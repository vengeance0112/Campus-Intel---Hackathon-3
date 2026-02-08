import sqlite3
import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# ------------------------------------------------------------
# Step 1: Load data from SQLite database
# ------------------------------------------------------------
DB_PATH = "database/campus_events.db"

conn = sqlite3.connect(DB_PATH)
df = pd.read_sql("SELECT * FROM event_attendance", conn)
conn.close()

print(f"Loaded dataset shape: {df.shape}")

# ------------------------------------------------------------
# Step 2: Define target and features
# ------------------------------------------------------------
TARGET_COL = "Expected_Attendance"

X = df.drop(columns=["Expected_Attendance", "Engagement_Level"])
y = df["Expected_Attendance"]

print("Feature matrix shape:", X.shape)
print("Target vector shape:", y.shape)

# ------------------------------------------------------------
# Step 3: Identify categorical and numerical columns
# ------------------------------------------------------------
categorical_cols = [
    "Domain",
    "Event_Type",
    "Speaker_Type",
    "Day_Type",
    "Time_Slot"
]

numerical_cols = [
    "Duration_Hours",
    "Promotion_Days",
    "Certificate_Flag",
    "Interactivity_Level"
] + [col for col in X.columns if "Friction_" in col]

# ------------------------------------------------------------
# Step 4: Build preprocessing pipeline
# ------------------------------------------------------------
preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(drop="first", handle_unknown="ignore"), categorical_cols),
        ("num", StandardScaler(), numerical_cols)
    ]
)

# ------------------------------------------------------------
# Step 5: Train-test split
# ------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Train size:", X_train.shape)
print("Test size :", X_test.shape)

# ------------------------------------------------------------
# Step 6: Define models
# ------------------------------------------------------------
models = {
    "Linear Regression": LinearRegression(),
    "Support Vector Regression": SVR(
        kernel="rbf",
        C=10,
        gamma="scale",
        epsilon=0.1
    ),
    "Random Forest": RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
}

results = []
best_model = None
best_model_name = None
best_r2 = -np.inf
best_metrics = {}

# ------------------------------------------------------------
# Step 7: Train and evaluate models
# ------------------------------------------------------------
for name, model in models.items():
    print(f"\nTraining {name}...")

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model)
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"{name} Performance:")
    print(f"RMSE: {rmse:.2f}")
    print(f"MAE : {mae:.2f}")
    print(f"R²  : {r2:.4f}")

    results.append({
        "Model": name,
        "RMSE": rmse,
        "MAE": mae,
        "R2": r2
    })

    if r2 > best_r2:
        best_r2 = r2
        best_model = pipeline
        best_model_name = name
        best_metrics = {
            "rmse": rmse,
            "mae": mae,
            "r2": r2
        }

# ------------------------------------------------------------
# Step 8: Results summary
# ------------------------------------------------------------
results_df = pd.DataFrame(results)
print("\nModel Comparison:")
print(results_df)

# ------------------------------------------------------------
# Step 9: Model Versioning (ADDED – no flow change)
# ------------------------------------------------------------
ARTIFACT_DIR = "artifacts"
REGISTRY_PATH = os.path.join(ARTIFACT_DIR, "model_registry.json")

os.makedirs(ARTIFACT_DIR, exist_ok=True)

# Load or initialize registry
if os.path.exists(REGISTRY_PATH) and os.path.getsize(REGISTRY_PATH) > 0:
    with open(REGISTRY_PATH, "r") as f:
        registry = json.load(f)
else:
    registry = {
        "latest_version": 0,
        "models": []
    }

# Create new version
new_version = registry["latest_version"] + 1
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

version_name = f"model_v{new_version}_{timestamp}"
version_path = os.path.join(ARTIFACT_DIR, version_name)
os.makedirs(version_path, exist_ok=True)

# ------------------------------------------------------------
# Step 10: Save model + metadata
# ------------------------------------------------------------
MODEL_PATH = os.path.join(version_path, "model.joblib")
METADATA_PATH = os.path.join(version_path, "metadata.json")

joblib.dump(best_model, MODEL_PATH)

metadata = {
    "version": new_version,
    "timestamp": timestamp,
    "model_name": best_model_name,
    "metrics": best_metrics,
    "num_training_rows": len(X_train),
    "categorical_features": categorical_cols,
    "numerical_features": numerical_cols
}

with open(METADATA_PATH, "w") as f:
    json.dump(metadata, f, indent=4)

# Update registry
registry["latest_version"] = new_version
registry["models"].append({
    "version": new_version,
    "model_name": best_model_name,
    "timestamp": timestamp,
    "path": version_path
})

with open(REGISTRY_PATH, "w") as f:
    json.dump(registry, f, indent=4)

# Also keep latest-model shortcut for dashboard
joblib.dump(best_model, os.path.join(ARTIFACT_DIR, "latest_model.joblib"))

print("\nBest model selected:", best_model_name)
print(f"Model version saved → {version_name}")
print("Latest model pointer updated → artifacts/latest_model.joblib")

print("\nTraining pipeline completed successfully.")

import pandas as pd
import numpy as np
import os
import json
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR

from xgboost import XGBRegressor


# -------------------------
# Paths
# -------------------------

ARTIFACT_DIR = "artifacts"
REGISTRY_PATH = os.path.join(ARTIFACT_DIR, "model_registry.json")


# -------------------------
# Load Dataset
# -------------------------

df = pd.read_csv("Campus_Event_Engagement_Synthetic.csv")

y = df["Expected_Attendance"]

X = df.drop(columns=["Expected_Attendance", "Engagement_Level"])


# -------------------------
# Columns
# -------------------------

categorical_cols = [
    "Domain",
    "Event_Type",
    "Speaker_Type",
    "Day_Type",
    "Time_Slot"
]

numerical_cols = [c for c in X.columns if c not in categorical_cols]


# -------------------------
# Preprocessing
# -------------------------

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ("num", StandardScaler(), numerical_cols)
    ]
)


# -------------------------
# Train Test Split
# -------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


# -------------------------
# Models
# -------------------------

models = {

    "LinearRegression": LinearRegression(),

    "Ridge": Ridge(),

    "Lasso": Lasso(),

    "ElasticNet": ElasticNet(),

    "DecisionTree": DecisionTreeRegressor(),

    "RandomForest": RandomForestRegressor(n_estimators=150),

    "GradientBoosting": GradientBoostingRegressor(),

    "KNN": KNeighborsRegressor(),

    "SVR": SVR(),

    "XGBoost": XGBRegressor(
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6
    )
}


# -------------------------
# Load Registry
# -------------------------

if os.path.exists(REGISTRY_PATH):

    with open(REGISTRY_PATH, "r") as f:
        registry = json.load(f)

else:

    registry = {
        "models": {},
        "best_model": None
    }


best_r2 = -999
best_model = None
best_version = None
best_path = None


# -------------------------
# Train Models
# -------------------------

for name, model in models.items():

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)

    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print(f"{name} | RMSE: {rmse:.2f} | MAE: {mae:.2f} | R2: {r2:.3f}")

    # -------------------------
    # Versioning Logic
    # -------------------------

    model_dir = os.path.join(ARTIFACT_DIR, name)

    os.makedirs(model_dir, exist_ok=True)

    existing_versions = [
        f for f in os.listdir(model_dir)
        if f.startswith("v") and f.endswith(".joblib")
    ]

    version = len(existing_versions) + 1

    model_path = os.path.join(model_dir, f"v{version}.joblib")

    joblib.dump(pipeline, model_path)


    # -------------------------
    # Update Registry
    # -------------------------

    if name not in registry["models"]:
        registry["models"][name] = {"versions": []}

    registry["models"][name]["versions"].append({

        "version": version,
        "path": model_path,
        "rmse": rmse,
        "mae": mae,
        "r2": r2

    })


    # -------------------------
    # Track Best Model
    # -------------------------

    if r2 > best_r2:

        best_r2 = r2
        best_model = name
        best_version = version
        best_path = model_path


# -------------------------
# Save Best Model
# -------------------------

registry["best_model"] = {

    "model": best_model,
    "version": best_version,
    "path": best_path,
    "r2": best_r2

}


with open(REGISTRY_PATH, "w") as f:
    json.dump(registry, f, indent=4)


print("\nBest Model:", best_model)
print("Version:", best_version)
print("Saved at:", best_path)
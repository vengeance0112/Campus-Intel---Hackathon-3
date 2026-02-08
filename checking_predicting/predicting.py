import sqlite3
import pandas as pd
import joblib

import json
import os

def load_latest_model():
    REGISTRY_PATH = "artifacts/model_registry.json"

    if not os.path.exists(REGISTRY_PATH):
        raise FileNotFoundError("Model registry not found.")

    with open(REGISTRY_PATH, "r") as f:
        registry = json.load(f)

    if not registry["models"]:
        raise ValueError("No models registered yet.")

    latest_model_entry = registry["models"][-1]
    model_path = os.path.join(latest_model_entry["path"], "model.joblib")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")

    print(f"Loaded model version v{latest_model_entry['version']} "
          f"({latest_model_entry['model_name']})")

    return joblib.load(model_path)

# ------------------------------
# Step 1: Load trained pipeline
# ------------------------------
model_pipeline = load_latest_model()


print("Model pipeline loaded successfully.")

# ------------------------------
# Step 2: Raw event input
# ------------------------------
new_event = {
    "Domain": "Tech",
    "Event_Type": "Workshop",
    "Speaker_Type": "Industry",
    "Duration_Hours": 2.0,
    "Day_Type": "Weekday",
    "Time_Slot": "Afternoon",
    "Promotion_Days": 30,
    "Certificate_Flag": 1,
    "Interactivity_Level": 0.75,

    # base friction levels (1–5)
    "Promotion_Friction": 3,
    "Fatigue_Friction": 3,
    "Format_Friction": 3,
    "Social_Friction": 3,
    "Schedule_Friction": 3,
    "Relevance_Friction": 3
}

# ------------------------------
# Step 3: Expand friction → one-hot
# ------------------------------
friction_types = [
    "Promotion_Friction",
    "Fatigue_Friction",
    "Format_Friction",
    "Social_Friction",
    "Schedule_Friction",
    "Relevance_Friction"
]

expanded = {}

for ft in friction_types:
    for level in range(1, 6):
        expanded[f"{ft}_{level}"] = 1 if new_event[ft] == level else 0

# Remove base friction keys
for ft in friction_types:
    new_event.pop(ft)

# Merge expanded features
new_event.update(expanded)

# Convert to DataFrame
input_df = pd.DataFrame([new_event])

# ------------------------------
# Step 4: Predict
# ------------------------------
predicted_attendance = model_pipeline.predict(input_df)[0]

print(f"Predicted Expected Attendance: {int(predicted_attendance)}")

# ------------------------------
# Step 5: Store prediction
# ------------------------------
conn = sqlite3.connect("database/campus_events.db")
cursor = conn.cursor()

cursor.execute("""
INSERT INTO event_attendance (
    Domain, Event_Type, Speaker_Type, Duration_Hours,
    Day_Type, Time_Slot, Promotion_Days, Certificate_Flag,
    Interactivity_Level, Expected_Attendance
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    input_df["Domain"][0],
    input_df["Event_Type"][0],
    input_df["Speaker_Type"][0],
    input_df["Duration_Hours"][0],
    input_df["Day_Type"][0],
    input_df["Time_Slot"][0],
    input_df["Promotion_Days"][0],
    input_df["Certificate_Flag"][0],
    input_df["Interactivity_Level"][0],
    int(predicted_attendance)
))

conn.commit()
conn.close()

print("Prediction stored successfully in SQLite database.")

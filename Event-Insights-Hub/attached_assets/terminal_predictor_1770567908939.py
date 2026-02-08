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
# Load trained pipeline
# ------------------------------
model_pipeline = load_latest_model()


print("\nCampus Event Attendance Predictor")
print("----------------------------------")

# ------------------------------
# Helper functions
# ------------------------------
def ask_choice(prompt, choices):
    print(f"\n{prompt}")
    for i, c in enumerate(choices, 1):
        print(f"{i}. {c}")
    while True:
        try:
            choice = int(input("Enter choice number: "))
            if 1 <= choice <= len(choices):
                return choices[choice - 1]
        except:
            pass
        print("Invalid input. Try again.")

def ask_int(prompt, min_val=None, max_val=None):
    while True:
        try:
            val = int(input(f"{prompt}: "))
            if (min_val is None or val >= min_val) and (max_val is None or val <= max_val):
                return val
        except:
            pass
        print("Invalid input. Try again.")

def ask_float(prompt, min_val=None, max_val=None):
    while True:
        try:
            val = float(input(f"{prompt}: "))
            if (min_val is None or val >= min_val) and (max_val is None or val <= max_val):
                return val
        except:
            pass
        print("Invalid input. Try again.")

# ------------------------------
# Collect inputs
# ------------------------------
event = {}

event["Domain"] = ask_choice(
    "Select Domain",
    ["Tech", "Law", "Design", "Music", "Business"]
)

event["Event_Type"] = ask_choice(
    "Select Event Type",
    ["Workshop", "Guest_Lecture", "Career_Talk"]
)

event["Speaker_Type"] = ask_choice(
    "Select Speaker Type",
    ["Industry", "Faculty", "Alumni"]
)

event["Day_Type"] = ask_choice(
    "Select Day Type",
    ["Weekday", "Weekend"]
)

event["Time_Slot"] = ask_choice(
    "Select Time Slot",
    ["Morning", "Afternoon", "Evening"]
)

event["Duration_Hours"] = ask_float("Event duration (hours)", 0.5, 5)
event["Promotion_Days"] = ask_int("Promotion days before event", 0, 30)
event["Certificate_Flag"] = ask_int("Certificate provided? (1 = Yes, 0 = No)", 0, 1)
event["Interactivity_Level"] = ask_float("Interactivity level (0 to 1)", 0, 1)

# ------------------------------
# Friction ratings (1–5)
# ------------------------------
print("\nRate the following frictions (1 = Low, 5 = High)")

frictions = {}
for f in [
    "Promotion_Friction",
    "Fatigue_Friction",
    "Format_Friction",
    "Social_Friction",
    "Schedule_Friction",
    "Relevance_Friction"
]:
    frictions[f] = ask_int(f.replace("_", " "), 1, 5)

# ------------------------------
# Expand friction into one-hot
# ------------------------------
expanded = {}

for ft, rating in frictions.items():
    for level in range(1, 6):
        expanded[f"{ft}_{level}"] = 1 if rating == level else 0

event.update(expanded)

# ------------------------------
# Convert to DataFrame
# ------------------------------
input_df = pd.DataFrame([event])

# ------------------------------
# Predict
# ------------------------------
prediction = model_pipeline.predict(input_df)[0]

print("\nPrediction Result")
print("-----------------")
print(f"Expected Attendance: {int(prediction)}")

# ------------------------------
# Store in SQLite
# ------------------------------
save = ask_choice("\nSave this prediction to database?", ["Yes", "No"])

if save == "Yes":
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
        event["Domain"],
        event["Event_Type"],
        event["Speaker_Type"],
        event["Duration_Hours"],
        event["Day_Type"],
        event["Time_Slot"],
        event["Promotion_Days"],
        event["Certificate_Flag"],
        event["Interactivity_Level"],
        int(prediction)
    ))

    conn.commit()
    conn.close()
    print("Prediction saved to database.")

print("\nDone.")

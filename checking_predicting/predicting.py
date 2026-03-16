import sqlite3
import pandas as pd
import joblib
import json
import os


REGISTRY_PATH = "artifacts/model_registry.json"


def load_model(model_name,version):

    with open(REGISTRY_PATH,"r") as f:
        registry = json.load(f)

    versions = registry["models"][model_name]["versions"]

    for v in versions:
        if v["version"] == version:
            return joblib.load(v["path"])

    raise ValueError("Model version not found")


# ---------------------------
# Select Model
# ---------------------------
MODEL_NAME = "LinearRegression"
MODEL_VERSION = 1

model_pipeline = load_model(MODEL_NAME,MODEL_VERSION)

print(f"Loaded {MODEL_NAME} v{MODEL_VERSION}")


# ---------------------------
# Example Event
# ---------------------------
event = {

"Domain":"Tech",
"Event_Type":"Workshop",
"Speaker_Type":"Industry",
"Duration_Hours":2.0,
"Day_Type":"Weekday",
"Time_Slot":"Afternoon",
"Promotion_Days":20,
"Certificate_Flag":1,
"Interactivity_Level":0.8,

"Promotion_Friction":3,
"Fatigue_Friction":3,
"Format_Friction":2,
"Social_Friction":3,
"Schedule_Friction":2,
"Relevance_Friction":2
}


# ---------------------------
# Expand OneHot
# ---------------------------
expanded={}

for ft in [
"Promotion_Friction",
"Fatigue_Friction",
"Format_Friction",
"Social_Friction",
"Schedule_Friction",
"Relevance_Friction"
]:

    for level in range(1,6):
        expanded[f"{ft}_{level}"] = 1 if event[ft]==level else 0


for ft in [
"Promotion_Friction",
"Fatigue_Friction",
"Format_Friction",
"Social_Friction",
"Schedule_Friction",
"Relevance_Friction"
]:
    event.pop(ft)


event.update(expanded)

input_df = pd.DataFrame([event])


# ---------------------------
# Predict
# ---------------------------
prediction = model_pipeline.predict(input_df)[0]

print("Predicted Attendance:",int(prediction))


# ---------------------------
# Store Result
# ---------------------------
conn = sqlite3.connect("database/campus_events.db")
cur = conn.cursor()

cur.execute("""
INSERT INTO event_attendance (
Domain,Event_Type,Speaker_Type,Duration_Hours,
Day_Type,Time_Slot,Promotion_Days,Certificate_Flag,
Interactivity_Level,Expected_Attendance
)
VALUES (?,?,?,?,?,?,?,?,?,?)
""",(
input_df["Domain"][0],
input_df["Event_Type"][0],
input_df["Speaker_Type"][0],
input_df["Duration_Hours"][0],
input_df["Day_Type"][0],
input_df["Time_Slot"][0],
input_df["Promotion_Days"][0],
input_df["Certificate_Flag"][0],
input_df["Interactivity_Level"][0],
int(prediction)
))

conn.commit()
conn.close()

print("Prediction stored in database.")
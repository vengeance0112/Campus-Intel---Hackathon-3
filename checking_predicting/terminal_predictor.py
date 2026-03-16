import sqlite3
import pandas as pd
import joblib
import json
import os


REGISTRY_PATH = "artifacts/model_registry.json"


# ---------------------------
# Load Registry
# ---------------------------
def load_registry():

    if not os.path.exists(REGISTRY_PATH):
        raise FileNotFoundError("Model registry not found.")

    with open(REGISTRY_PATH, "r") as f:
        return json.load(f)


# ---------------------------
# Choose Model + Version
# ---------------------------
def choose_model():

    registry = load_registry()

    models = list(registry["models"].keys())

    print("\nAvailable Models")
    print("----------------")

    for i, m in enumerate(models, 1):
        print(f"{i}. {m}")

    while True:
        try:
            choice = int(input("\nSelect model number: "))
            if 1 <= choice <= len(models):
                model_name = models[choice-1]
                break
        except:
            pass
        print("Invalid input")

    versions = registry["models"][model_name]["versions"]

    print(f"\nAvailable Versions for {model_name}")

    for v in versions:
        print(f"v{v['version']}  |  R2: {round(v['r2'],3)}")

    while True:
        try:
            ver = int(input("\nSelect version: "))
            for v in versions:
                if v["version"] == ver:
                    model_path = v["path"]
                    print(f"\nLoading {model_name} v{ver}")
                    return joblib.load(model_path)
        except:
            pass

        print("Invalid version")


# ---------------------------
# Helper Inputs
# ---------------------------
def ask_choice(prompt, choices):

    print(f"\n{prompt}")

    for i,c in enumerate(choices,1):
        print(f"{i}. {c}")

    while True:
        try:
            val = int(input("Enter choice: "))
            if 1 <= val <= len(choices):
                return choices[val-1]
        except:
            pass

        print("Invalid input")


def ask_int(prompt,minv,maxv):

    while True:
        try:
            val = int(input(f"{prompt}: "))
            if minv <= val <= maxv:
                return val
        except:
            pass
        print("Invalid input")


def ask_float(prompt,minv,maxv):

    while True:
        try:
            val = float(input(f"{prompt}: "))
            if minv <= val <= maxv:
                return val
        except:
            pass
        print("Invalid input")


# ---------------------------
# Load Model
# ---------------------------
model_pipeline = choose_model()


print("\nCampus Event Attendance Predictor")
print("----------------------------------")


# ---------------------------
# Collect Inputs
# ---------------------------
event = {}

event["Domain"] = ask_choice("Select Domain",
["Tech","Law","Design","Music","Business"])

event["Event_Type"] = ask_choice("Select Event Type",
["Workshop","Guest_Lecture","Career_Talk"])

event["Speaker_Type"] = ask_choice("Select Speaker Type",
["Industry","Faculty","Alumni"])

event["Day_Type"] = ask_choice("Select Day Type",
["Weekday","Weekend"])

event["Time_Slot"] = ask_choice("Select Time Slot",
["Morning","Afternoon","Evening"])

event["Duration_Hours"] = ask_float("Duration (hours)",0.5,5)
event["Promotion_Days"] = ask_int("Promotion days",0,30)
event["Certificate_Flag"] = ask_int("Certificate? (1/0)",0,1)
event["Interactivity_Level"] = ask_float("Interactivity level",0,1)


print("\nRate frictions (1-5)")


frictions = {}

for f in [
"Promotion_Friction",
"Fatigue_Friction",
"Format_Friction",
"Social_Friction",
"Schedule_Friction",
"Relevance_Friction"
]:
    frictions[f] = ask_int(f.replace("_"," "),1,5)


# ---------------------------
# Expand OneHot
# ---------------------------
expanded = {}

for ft,val in frictions.items():
    for level in range(1,6):
        expanded[f"{ft}_{level}"] = 1 if val == level else 0

event.update(expanded)


input_df = pd.DataFrame([event])


# ---------------------------
# Predict
# ---------------------------
prediction = model_pipeline.predict(input_df)[0]

print("\nPrediction Result")
print("-----------------")
print(f"Expected Attendance: {int(prediction)}")


# ---------------------------
# Save to DB
# ---------------------------
save = ask_choice("Save prediction?",["Yes","No"])

if save == "Yes":

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

    print("Saved to database")


print("\nDone.")
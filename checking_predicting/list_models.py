import json
import os

REGISTRY_PATH = "artifacts/model_registry.json"

if not os.path.exists(REGISTRY_PATH):
    print("Model registry not found.")
    exit()

with open(REGISTRY_PATH, "r") as f:
    registry = json.load(f)

print("\nAVAILABLE MODELS")
print("=" * 60)

best_path = None

if registry.get("best_model"):
    best_path = registry["best_model"]["path"]

# Loop through each model
for model_name, model_data in registry["models"].items():

    print(f"\nMODEL: {model_name}")
    print("-" * 50)

    versions = model_data["versions"]

    for v in versions:

        version = v["version"]
        r2 = round(v["r2"], 3)
        rmse = round(v["rmse"], 2)
        mae = round(v["mae"], 2)
        path = v["path"]

        best_flag = ""
        if path == best_path:
            best_flag = "  <-- BEST MODEL"

        print(f"Version : v{version}")
        print(f"R2      : {r2}")
        print(f"RMSE    : {rmse}")
        print(f"MAE     : {mae}")
        print(f"Path    : {path}{best_flag}")
        print("-" * 50)

print("\nBest Model Summary")
print("=" * 60)

if registry.get("best_model"):

    best = registry["best_model"]

    print(f"Model   : {best['model']}")
    print(f"Version : v{best['version']}")
    print(f"R2      : {round(best['r2'],3)}")
    print(f"Path    : {best['path']}")

else:
    print("No best model registered yet.")
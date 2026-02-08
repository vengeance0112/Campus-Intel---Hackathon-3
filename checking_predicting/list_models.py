import json

with open("artifacts/model_registry.json", "r") as f:
    registry = json.load(f)

print("\nAvailable Model Versions:")
print("-" * 40)

for m in registry["models"]:
    print(f"Version: v{m['version']}")
    print(f"Model : {m['model_name']}")
    print(f"Time  : {m['timestamp']}")
    print(f"Path  : {m['path']}")
    print("-" * 40)

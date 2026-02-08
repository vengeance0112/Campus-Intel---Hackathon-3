import sqlite3
import pandas as pd
from pathlib import Path

# -------------------------------
# Configuration
# -------------------------------
DB_PATH = Path("database/campus_events.db")
CSV_PATH = Path("Campus_Event_Engagement_Synthetic.csv")
TABLE_NAME = "event_attendance"

# -------------------------------
# Load data
# -------------------------------
if not CSV_PATH.exists():
    raise FileNotFoundError(f"CSV file not found: {CSV_PATH}")

df = pd.read_csv(CSV_PATH)

# -------------------------------
# Connect to SQLite database
# -------------------------------
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# -------------------------------
# Store data into SQL table
# -------------------------------
df.to_sql(
    TABLE_NAME,
    conn,
    if_exists="replace",   # overwrite for reproducibility
    index=False
)

# -------------------------------
# Verify insertion
# -------------------------------
cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
row_count = cursor.fetchone()[0]

conn.commit()
conn.close()

print(f"✅ {row_count} rows successfully stored in SQLite database → {DB_PATH}")

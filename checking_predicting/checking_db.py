import sqlite3
import pandas as pd

# ------------------------------
# Step 1: Connect to SQLite database
# ------------------------------
conn = sqlite3.connect("database/campus_events.db")

# ------------------------------
# Step 2: Read a few rows to verify data
# ------------------------------
query = "SELECT * FROM event_attendance LIMIT 5"
df_preview = pd.read_sql_query(query, conn)

print("Sample records from SQLite database:")
print(df_preview)

conn.close()

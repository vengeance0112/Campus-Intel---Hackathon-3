import sqlite3
import pandas as pd
from datetime import datetime

DB_PATH = r"C:\Users\RAJ GUPTA\Desktop\Hackathon 3 Rajdeep\generated data to database saver\database.db"
CSV_PATH = "Campus_Event_Engagement_Synthetic.csv"

conn = sqlite3.connect(DB_PATH)

df = pd.read_csv(CSV_PATH)
df["created_at"] = datetime.now()

df.to_sql("event_data", conn, if_exists="replace", index=False)

conn.close()

print("Data successfully stored in database.db")
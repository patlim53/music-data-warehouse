import sqlite3
import pandas as pd

conn = sqlite3.connect("discogs_songs_producers.db")
df = pd.read_sql("SELECT * FROM songs_producers", conn)
conn.close()

df.to_csv("discogs_songs_producers.csv", index=False)
print("✅ Exported to discogs_songs_producers.csv")
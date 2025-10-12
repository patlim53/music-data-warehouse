import pandas as pd
import sqlite3
import os

# Directory setup
RAW_DIR = "raw/"
PROCESSED_DIR = "processed/"
os.makedirs(PROCESSED_DIR, exist_ok=True)

# ---------- 1️⃣ SPOTIFY ----------
try:
    spotify_path = os.path.join(RAW_DIR, "regional-global-weekly-2025-10-02.csv")
    df_spotify = pd.read_csv(spotify_path, encoding="utf-8")
    df_spotify.rename(columns={
        "rank": "rank_val",
        "uri": "url",
        "artist_names": "artist_name",
        "previous_rank": "prev_rank"
    }, inplace=True)
    df_spotify.to_csv(os.path.join(PROCESSED_DIR, "spotify_fixed.csv"), index=False, encoding="utf-8")
    print(f"✅ Cleaned Spotify → {len(df_spotify)} rows saved.")
except Exception as e:
    print(f"⚠️ Spotify cleaning failed: {e}")

# ---------- 2️⃣ YOUTUBE ----------
try:
    yt_path = os.path.join(RAW_DIR, "youtube-charts-top-songs-global-weekly-20251002.csv")
    df_yt = pd.read_csv(yt_path, encoding="utf-8")
    df_yt.rename(columns={
        "Rank": "rank_val",
        "Previous Rank": "prev_rank",
        "Track Name": "track_name",
        "Artist Names": "artist_name",
        "Periods on Chart": "weeks_on_chart",
        "Views": "views",
        "Growth": "growth",
        "YouTube URL": "url"
    }, inplace=True)

    # Convert growth from "% string" to decimal
    df_yt["growth"] = df_yt["growth"].astype(str).str.replace("%", "").astype(float) / 100

    df_yt.to_csv(os.path.join(PROCESSED_DIR, "youtube_fixed.csv"), index=False, encoding="utf-8")
    print(f"✅ Cleaned YouTube → {len(df_yt)} rows saved.")
except Exception as e:
    print(f"⚠️ YouTube cleaning failed: {e}")

# ---------- 3️⃣ DISCOGS ----------
try:
    discogs_csv = os.path.join(RAW_DIR, "discogs_songs_producers.csv")
    df_discogs = pd.read_csv(discogs_csv, encoding="utf-8")
    # Just confirm the column names are clean and consistent
    df_discogs.rename(columns={
        "ReleaseID": "release_id",
        "TrackTitle": "track_title",
        "ArtistName": "artist_name",
        "ProducerName": "producer_name"
    }, inplace=True)
    df_discogs.to_csv(os.path.join(PROCESSED_DIR, "discogs_songs_producers.csv"), index=False, encoding="utf-8")
    print(f"✅ Cleaned Discogs CSV → {len(df_discogs)} rows saved.")
except Exception as e:
    print(f"⚠️ Discogs CSV cleaning failed: {e}")
# ---------- 4️⃣ GRAMMY ----------
try:
    grammy_path = os.path.join(RAW_DIR, "grammy_winners.csv")
    df_grammy = pd.read_csv(grammy_path, encoding="utf-8")
    df_grammy.rename(columns={
        "artist": "artist_name",
        "song_or_album": "song_album_name",
        "winner": "is_winner",
        "category": "category",
        "year": "year"
    }, inplace=True)
    df_grammy["is_winner"] = df_grammy["is_winner"].astype(bool)
    df_grammy = df_grammy[["year", "category", "artist_name", "song_album_name", "is_winner"]]
    df_grammy.to_csv(os.path.join(PROCESSED_DIR, "grammy_fixed.csv"), index=False, encoding="utf-8")
    print(f"✅ Cleaned Grammy → {len(df_grammy)} rows saved.")
except Exception as e:
    print(f"⚠️ Grammy cleaning failed: {e}")

print("🎉 All cleaning completed.")

import os
from kaggle.api.kaggle_api_extended import KaggleApi
import csv

# Set up paths for raw and processed data
BASE_DIR = os.path.dirname(__file__)
RAW_DIR = os.path.join(BASE_DIR, "../raw")
PROC_DIR = os.path.join(BASE_DIR, "../processed")
MYSQL_UPLOAD_DIR = "C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/"
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROC_DIR, exist_ok=True)

# Define Kaggle dataset and file
KAGGLE_DATASET = "johnpendenque/grammy-winners-and-nominees-from-1965-to-2024"
KAGGLE_FILE = "grammy_winners.csv"  # The file inside the Kaggle dataset

RAW_PATH = os.path.join(RAW_DIR, KAGGLE_FILE)
OUT_PATH = os.path.join(MYSQL_UPLOAD_DIR, "grammy_fixed.csv")

# Function to download Grammy dataset using Kaggle API
def download_grammy_data():
    api = KaggleApi()
    api.authenticate()
    print("Downloading Grammy dataset...")
    try:
        # Download the dataset (this will not be a ZIP file)
        api.dataset_download_file(KAGGLE_DATASET, KAGGLE_FILE, path=RAW_DIR, quiet=False)

        # Check if the downloaded file exists
        if os.path.exists(RAW_PATH):
            print(f"Downloaded Grammy dataset to {RAW_PATH}")
        else:
            print(f"Error: File not found at {RAW_PATH}")
    except Exception as e:
        print(f"Error downloading the dataset: {str(e)}")

# Function to normalize the Grammy data
def normalize_grammy_data():
    try:
        with open(RAW_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = []

            for row in reader:
                # Normalize the columns to the staging table format
                normalized_row = {
                    "year": row.get("year") or row.get("Year") or "",
                    "category": row.get("category") or row.get("Category") or "",
                    "artist_name": row.get("artist_name") or row.get("Artist") or "",
                    "song_album_name": row.get("song_album_name") or row.get("title") or "",
                    "is_winner": row.get("is_winner") or row.get("Winner") or row.get("winner") or "",
                }
                rows.append(normalized_row)

        # Write the normalized data to a CSV file
        with open(OUT_PATH, "w", newline="", encoding="utf-8") as out_f:
            writer = csv.DictWriter(out_f, fieldnames=["year", "category", "artist_name", "song_album_name", "is_winner"])
            writer.writeheader()
            writer.writerows(rows)

        print(f"Normalized Grammy data written to {OUT_PATH}")
    except Exception as e:
        print(f"Error during normalization: {str(e)}")

if __name__ == "__main__":
    download_grammy_data()
    normalize_grammy_data()
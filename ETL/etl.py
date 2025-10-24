import os
import csv
import subprocess
from kaggle.api.kaggle_api_extended import KaggleApi
import yaml
import shutil
import getpass # Keep getpass as a fallback, but we'll use the config

# --- GENERALIZED PATHS ---
# Get the absolute path of the directory containing this Python script (etl.py)
ETL_DIR = os.path.dirname(os.path.abspath(__file__))
# The project's ROOT_DIR is the parent directory of the ETL_DIR
ROOT_DIR = os.path.dirname(ETL_DIR)
# --- END GENERALIZED PATHS ---

# Load the configuration from the YAML file
CONFIG_PATH = os.path.join(ETL_DIR, "etl_config.yaml")
with open(CONFIG_PATH, "r") as config_file:
    config = yaml.safe_load(config_file)

# Set up paths from the config file
RAW_DIR = os.path.join(ROOT_DIR, config["raw_data_path"])
PROC_DIR = os.path.join(ROOT_DIR, config["processed_data_path"])
MYSQL_UPLOAD_DIR = config["mysql_upload_dir"]
os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROC_DIR, exist_ok=True)

# Define Kaggle dataset and file
KAGGLE_DATASET = config["kaggle_dataset"]
KAGGLE_FILE = config["kaggle_file"]
RAW_PATH = os.path.join(RAW_DIR, KAGGLE_FILE)
OUT_PATH = os.path.join(MYSQL_UPLOAD_DIR, config["normalized_output_file"])

# Update paths to reflect the correct locations
LOAD_STAGING_SQL_PATH = os.path.join(ROOT_DIR, "load_staging.sql")
ETL_POPULATION_SQL_PATH = os.path.join(ETL_DIR, "ETL_Population.sql")
ETL_POPULATION_NODISCOGS_SQL_PATH = os.path.join(ETL_DIR, "ETL_Population_nodiscogs.sql")

# --- (Your download_grammy_data and normalize_grammy_data functions go here) ---
# ... (omitted for brevity, they don't need changes) ...

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

# Function to create the MySQL database if it doesn't exist
def create_mysql_database():
    try:
        print(f"Creating MySQL database {config['mysql_database']} if it doesn't exist...")

        # --- FIX: Read password and exe_path from config ---
        mysql_password = config["mysql_password"]
        mysql_exe_path = config["mysql_executable_path"]

        command = [
            mysql_exe_path, # Use the full path
            "-u", config["mysql_user"],
            "-p" + mysql_password,
            "-e", f"CREATE DATABASE IF NOT EXISTS {config['mysql_database']};"
        ]
        # Run the MySQL command to create the database
        subprocess.run(command, check=True, shell=True)
        print(f"Successfully created or verified database: {config['mysql_database']}")
    except subprocess.CalledProcessError as e:
        print(f"Error creating database: {str(e)}")

# Function to run MySQL scripts
def run_mysql_script(script_path):
    try:
        print(f"Running MySQL script: {script_path}")

        # --- FIX: Read password and exe_path from config ---
        mysql_password = config["mysql_password"]
        mysql_exe_path = config["mysql_executable_path"]

        # Get the absolute path of the SQL script
        script_abs_path = os.path.abspath(script_path)

        # Create the full command to run MySQL script
        command = [
            mysql_exe_path, # Use the full path
            "-u", config["mysql_user"],
            "-p" + mysql_password,
            config["mysql_database"],
            "-e", f"source {script_abs_path}"
        ]

        # Run the MySQL command using subprocess
        subprocess.run(command, check=True, shell=True)
        print(f"Successfully executed {script_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error executing MySQL script: {str(e)}")

def main():
    """
    Main function to orchestrate the ETL process.
    """
    # Step 1: Create the MySQL database if it doesn't exist
    create_mysql_database()

    # Step 2: Download Grammy dataset
    download_grammy_data()

    # Step 3: Normalize the data
    normalize_grammy_data()

    # Step 4: Execute MySQL scripts
    print("Running load_staging.sql...")
    run_mysql_script(LOAD_STAGING_SQL_PATH)

    # --- NEW: User choice for ETL script ---
    print("\n--- ETL Population Choice ---")
    print("Which ETL script do you want to run?")
    print("  [1] FULL ETL (Includes the very long Discogs query. This can take over 40 minutes.)")
    print("  [2] FAST ETL (Skips the Discogs query for quick testing.)")

    choice = ""
    while choice not in ['1', '2']:
        choice = input("Enter your choice (1 or 2): ").strip()
        if choice not in ['1', '2']:
            print("Invalid choice. Please enter 1 or 2.")

    if choice == '1':
        print("\nRunning FULL ETL_Population.sql...")
        run_mysql_script(ETL_POPULATION_SQL_PATH)
    else: # choice must be '2'
        print("\nRunning FAST ETL_Population_nodiscogs.sql...")
        run_mysql_script(ETL_POPULATION_NODISCOGS_SQL_PATH)
    # --- END OF NEW CODE ---

    print("\nETL process complete.")

if __name__ == "__main__":
    main()


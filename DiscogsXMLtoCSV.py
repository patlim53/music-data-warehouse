import os
import csv
from lxml import etree
import sys

# --- CONFIGURATION (Match your file locations) ---
# NOTE: This path MUST be the absolute path to your raw XML file.
# Assuming the XML file is in your 'raw' directory (one level up from the script's location)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XML_PATH = os.path.join(BASE_DIR, "raw/discogs_20250101_releases.xml")

# The final destination path for MySQL's LOAD DATA INFILE command
MYSQL_UPLOAD_DIR = "C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/"
OUT_CSV_PATH = os.path.join(MYSQL_UPLOAD_DIR, "discogs_songs_producers.csv")
# --- END CONFIGURATION ---

def extract_xml_to_csv():
    """
    Parses the large Discogs XML file iteratively and writes song/producer data 
    directly to a CSV file in the MySQL upload directory.
    """
    if not os.path.exists(XML_PATH):
        print(f"FATAL ERROR: XML source file not found at {XML_PATH}")
        print("Please ensure 'discogs_20250101_releases.xml' is in your 'raw' directory.")
        sys.exit(1)

    print(f"Starting extraction from XML to CSV: {XML_PATH}")
    print(f"Outputting CSV to: {OUT_CSV_PATH}")

    row_count = 0
    
    try:
        with open(OUT_CSV_PATH, 'w', newline='', encoding='utf-8') as csvfile:
            # Define the header matching the staging table:
            fieldnames = ['ReleaseID', 'TrackTitle', 'ArtistName', 'ProducerName']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()

            # Use iterparse for efficient, low-memory handling of large XML files
            context = etree.iterparse(XML_PATH, events=("end",), tag="release")

            for _, elem in context:
                release_id = elem.get("id")
                # Extract the main performing artists for the entire release
                main_artists = [a.text.strip() for a in elem.findall("./artists/artist/name") if a.text]

                for track in elem.findall(".//track"):
                    track_title = track.findtext("title")
                    if not track_title:
                        continue
                    track_title = track_title.strip()

                    # Look for producer roles among extra artists
                    for ea in track.findall(".//extraartists/artist"):
                        role = ea.findtext("role")
                        if role and "Producer" in role:
                            producer_name = ea.findtext("name")
                            if producer_name:
                                producer_name = producer_name.strip()
                                
                                # A single producer/track pair can be associated with multiple main artists
                                for main_artist in main_artists:
                                    writer.writerow({
                                        'ReleaseID': release_id,
                                        'TrackTitle': track_title,
                                        'ArtistName': main_artist,
                                        'ProducerName': producer_name
                                    })
                                    row_count += 1
                                    
                                    if row_count % 100000 == 0:
                                        print(f"Processing: {row_count:,} producer credits extracted.")

                # Crucial step for low-memory XML parsing (clears element tree)
                elem.clear()
                while elem.getprevious() is not None:
                    del elem.getparent()[0]

            print(f"\n✅ Extraction complete! {row_count:,} rows saved directly to CSV.")
    
    except Exception as e:
        print(f"\nFATAL ERROR during processing: {e}")
        sys.exit(1)


if __name__ == "__main__":
    extract_xml_to_csv()
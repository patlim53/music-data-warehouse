import sqlite3
from lxml import etree

xml_path = "discogs_20250101_releases.xml"  # your XML file
db_path = "discogs_songs_producers.db"

# Connect to SQLite
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create table
cursor.execute("""
CREATE TABLE IF NOT EXISTS songs_producers (
    ReleaseID TEXT,
    TrackTitle TEXT,
    ArtistName TEXT,
    ProducerName TEXT
);
""")
conn.commit()

print("Starting extraction to SQLite database...")

context = etree.iterparse(xml_path, events=("end",), tag="release")
batch = []
batch_size = 1000
row_count = 0

for _, elem in context:
    release_id = elem.get("id")
    main_artists = [a.text.strip() for a in elem.findall("./artists/artist/name") if a.text]

    for track in elem.findall(".//track"):
        track_title = track.findtext("title")
        if not track_title:
            continue
        track_title = track_title.strip()

        for ea in track.findall(".//extraartists/artist"):
            role = ea.findtext("role")
            if role and "Producer" in role:
                producer_name = ea.findtext("name")
                if producer_name:
                    producer_name = producer_name.strip()
                    for main_artist in main_artists:
                        batch.append((release_id, track_title, main_artist, producer_name))
                        row_count += 1

                        # Insert every 1000 rows
                        if len(batch) >= batch_size:
                            cursor.executemany("""
                                INSERT INTO songs_producers
                                (ReleaseID, TrackTitle, ArtistName, ProducerName)
                                VALUES (?, ?, ?, ?);
                            """, batch)
                            conn.commit()
                            batch.clear()

                            if row_count % 100000 == 0:
                                print(f"✅ {row_count:,} rows inserted...")

    elem.clear()
    while elem.getprevious() is not None:
        del elem.getparent()[0]

# Final commit
if batch:
    cursor.executemany("""
        INSERT INTO songs_producers
        (ReleaseID, TrackTitle, ArtistName, ProducerName)
        VALUES (?, ?, ?, ?);
    """, batch)
    conn.commit()

cursor.close()
conn.close()
print(f"✅ Extraction complete! {row_count:,} rows saved to {db_path}")

-- =====================================
-- LOAD STAGING TABLES
-- Using MySQL secure_file_priv Directory
-- =====================================

USE music_source;

-- Temporarily relax strict SQL mode to allow flexible imports
SET @OLD_SQL_MODE = @@GLOBAL.sql_mode;
SET GLOBAL sql_mode = '';
SET SESSION sql_mode = '';

-- =====================================
-- 1️⃣ SPOTIFY
-- =====================================
-- CSV columns: rank_val, url, artist_name, track_name, source, peak_rank, prev_rank, weeks_on_chart, streams
-- Table columns: chart_rank, spotify_url, artist_name, track_name, source, peak_rank, previous_rank, weeks_on_chart, streams
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/spotify_fixed.csv'
INTO TABLE stage_spotify
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' 
OPTIONALLY ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(rank_val, url, artist_name, track_name, source, peak_rank, prev_rank, weeks_on_chart, streams)
SET
    chart_rank = NULLIF(rank_val, ''),
    spotify_url = NULLIF(url, ''),
    artist_name = NULLIF(artist_name, ''),
    track_name = NULLIF(track_name, ''),
    source = NULLIF(source, ''),
    peak_rank = NULLIF(peak_rank, ''),
    previous_rank = NULLIF(prev_rank, ''),
    weeks_on_chart = NULLIF(weeks_on_chart, ''),
    streams = NULLIF(streams, '');

-- =====================================
-- 2️⃣ YOUTUBE
-- =====================================
-- CSV columns: rank_val, prev_rank, track_name, artist_name, weeks_on_chart, views, growth, url
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/youtube_fixed.csv'
INTO TABLE stage_youtube
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' 
OPTIONALLY ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(rank_val, prev_rank, track_name, artist_name, weeks_on_chart, views, growth, url)
SET
    rank_val = NULLIF(rank_val, ''),
    prev_rank = NULLIF(prev_rank, ''),
    track_name = NULLIF(track_name, ''),
    artist_name = NULLIF(artist_name, ''),
    weeks_on_chart = NULLIF(weeks_on_chart, ''),
    views = NULLIF(views, ''),
    growth = NULLIF(growth, ''),
    url = NULLIF(url, '');

-- =====================================
-- 3️⃣ DISCOGS
-- =====================================
-- CSV columns: release_id, track_title, artist_name, producer_name
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/discogs_songs_producers.csv'
INTO TABLE stage_discogs
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' 
OPTIONALLY ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(release_id, track_title, artist_name, producer_name)
SET
    release_id = NULLIF(release_id, ''),
    track_title = NULLIF(track_title, ''),
    artist_name = NULLIF(artist_name, ''),
    producer_name = NULLIF(producer_name, '');

-- =====================================
-- 4️⃣ GRAMMY
-- =====================================
-- CSV columns: year, category, artist_name, song_album_name, is_winner
-- Table columns: year, annual_edition, category, artist_name, producers, song_album_name, is_winner, url
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/grammy_fixed.csv'
INTO TABLE stage_grammy
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' 
OPTIONALLY ENCLOSED BY '"' 
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(year, category, artist_name, song_album_name, is_winner)
SET
    year = NULLIF(year, ''),
    category = NULLIF(category, ''),
    artist_name = NULLIF(artist_name, ''),
    song_album_name = NULLIF(song_album_name, ''),
    is_winner = NULLIF(is_winner, ''),
    annual_edition = NULL,
    producers = NULL,
    url = NULL;

-- =====================================
-- Restore original SQL mode
-- =====================================
SET GLOBAL sql_mode = @OLD_SQL_MODE;

-- Done loading staging tables
SELECT '✅ All staging tables loaded successfully.' AS status;

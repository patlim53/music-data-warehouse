-- =====================================
-- 🛠 DATABASE SETUP
-- =====================================

-- Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS music_source;

-- Use the database
USE music_source;


-- =====================================
-- 🛠 CREATE STAGING TABLES
-- =====================================

-- 1️⃣ stage_spotify
-- NOTE: The original LOAD DATA statement maps CSV columns to specific table columns:
-- (rank_val -> chart_rank), (url -> spotify_url), (prev_rank -> previous_rank)
-- This CREATE TABLE statement reflects the final table column names.
CREATE TABLE stage_spotify (
  `chart_rank` int DEFAULT NULL,
  `spotify_url` varchar(500) DEFAULT NULL,
  `artist_name` varchar(255) DEFAULT NULL,
  `track_name` varchar(255) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `peak_rank` int DEFAULT NULL,
  `previous_rank` int DEFAULT NULL,
  `weeks_on_chart` int DEFAULT NULL,
  `streams` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2️⃣ stage_youtube
CREATE TABLE stage_youtube (
  `rank_val` int DEFAULT NULL,
  `prev_rank` int DEFAULT NULL,
  `track_name` varchar(255) DEFAULT NULL,
  `artist_name` varchar(255) DEFAULT NULL,
  `weeks_on_chart` int DEFAULT NULL,
  `views` bigint DEFAULT NULL,
  `growth` decimal(10,2) DEFAULT NULL,
  `url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3️⃣ stage_discogs
CREATE TABLE stage_discogs (
  `release_id` int DEFAULT NULL,
  `track_title` varchar(255) DEFAULT NULL,
  `artist_name` varchar(255) DEFAULT NULL,
  `producer_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4️⃣ stage_grammy
CREATE TABLE stage_grammy (
  `year` int DEFAULT NULL,
  `annual_edition` varchar(50) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `artist_name` varchar(255) DEFAULT NULL,
  `producers` varchar(255) DEFAULT NULL,
  `song_album_name` varchar(255) DEFAULT NULL,
  `is_winner` varchar(10) DEFAULT NULL,
  `url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =====================================
-- 💾 LOAD STAGING TABLES (Original Script)
-- =====================================

-- Temporarily relax strict SQL mode to allow flexible imports
SET @OLD_SQL_MODE = @@GLOBAL.sql_mode;
SET GLOBAL sql_mode = '';
SET SESSION sql_mode = '';

-- 1️⃣ SPOTIFY
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

-- 2️⃣ YOUTUBE
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

-- 3️⃣ DISCOGS
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

-- 4️⃣ GRAMMY
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
-- ↩️ Restore original SQL mode
-- =====================================
SET GLOBAL sql_mode = @OLD_SQL_MODE;

-- Done loading staging tables
SELECT '✅ All staging tables created and loaded successfully.' AS status;
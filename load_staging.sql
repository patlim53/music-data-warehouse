-- =====================================
-- 🛠 DATABASE SETUP
-- =====================================
-- This script creates the 'music_source' database and all staging tables.
-- It's designed to be run multiple times safely.

-- Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS music_source;

-- Use the database
USE music_source;

-- =====================================
-- 🛠 CREATE STAGING TABLES
-- =====================================

-- 1️⃣ stage_spotify
-- NOTE: This table's columns (e.g., 'chart_rank') match the final desired names.
-- The LOAD DATA command will map CSV columns ('rank_val') to these names.
DROP TABLE IF EXISTS stage_spotify;
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
DROP TABLE IF EXISTS stage_youtube;
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
DROP TABLE IF EXISTS stage_discogs;
CREATE TABLE stage_discogs (
  `release_id` int DEFAULT NULL,
  `track_title` varchar(255) DEFAULT NULL,
  `artist_name` varchar(255) DEFAULT NULL,
  `producer_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4️⃣ stage_grammy
DROP TABLE IF EXISTS stage_grammy;
CREATE TABLE stage_grammy (
  `year` int DEFAULT NULL,
  `annual_edition` varchar(50) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `artist_name` varchar(255) DEFAULT NULL,
  `producers` varchar(255) DEFAULT NULL,
  `song_album_name` varchar(255) DEFAULT NULL,
  `is_winner` varchar(10) DEFAULT NULL, -- Storing as text ('True'/'False')
  `url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =====================================
-- 💾 LOAD STAGING TABLES
-- =====================================
-- This section uses temporary variables (e.g., @rank_val) to read
-- data from the CSV and then maps it to the correct table columns.

-- Temporarily relax strict SQL mode to allow flexible imports
SET @OLD_SQL_MODE = @@GLOBAL.sql_mode;
SET GLOBAL sql_mode = '';
SET SESSION sql_mode = '';

-- Clear tables before loading to prevent duplicates on re-run
TRUNCATE TABLE stage_spotify;
TRUNCATE TABLE stage_youtube;
TRUNCATE TABLE stage_discogs;
TRUNCATE TABLE stage_grammy;

-- 1️⃣ SPOTIFY
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/spotify_fixed.csv'
INTO TABLE stage_spotify
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
-- Read CSV columns into temporary @variables
(@rank_val, @url, @artist_name, @track_name, @source, @peak_rank, @prev_rank, @weeks_on_chart, @streams)
SET
  -- Map @variables to the actual table columns, using NULLIF to handle empty strings
  chart_rank = NULLIF(@rank_val, ''),
  spotify_url = NULLIF(@url, ''),
  artist_name = NULLIF(@artist_name, ''),
  track_name = NULLIF(@track_name, ''),
  source = NULLIF(@source, ''),
  peak_rank = NULLIF(@peak_rank, ''),
  previous_rank = NULLIF(@prev_rank, ''),
  weeks_on_chart = NULLIF(@weeks_on_chart, ''),
  streams = NULLIF(@streams, '');

-- 2️⃣ YOUTUBE
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/youtube_fixed.csv'
INTO TABLE stage_youtube
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
-- Read CSV columns into temporary @variables
(@rank_val, @prev_rank, @track_name, @artist_name, @weeks_on_chart, @views, @growth, @url)
SET
  -- Map @variables to the actual table columns
  rank_val = NULLIF(@rank_val, ''),
  prev_rank = NULLIF(@prev_rank, ''),
  track_name = NULLIF(@track_name, ''),
  artist_name = NULLIF(@artist_name, ''),
  weeks_on_chart = NULLIF(@weeks_on_chart, ''),
  views = NULLIF(@views, ''),
  growth = NULLIF(@growth, ''),
  url = NULLIF(@url, '');

-- 3️⃣ DISCOGS
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/discogs_songs_producers.csv'
INTO TABLE stage_discogs
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
-- Read CSV columns into temporary @variables
(@release_id, @track_title, @artist_name, @producer_name)
SET
  -- Map @variables to the actual table columns
  release_id = NULLIF(@release_id, ''),
  track_title = NULLIF(@track_title, ''),
  artist_name = NULLIF(@artist_name, ''),
  producer_name = NULLIF(@producer_name, '');

-- 4️⃣ GRAMMY
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/grammy_fixed.csv'
INTO TABLE stage_grammy
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
-- Read specific CSV columns into temporary @variables
(@year, @category, @artist_name, @song_album_name, @is_winner)
SET
  -- Map @variables to the actual table columns
  year = NULLIF(@year, ''),
  category = NULLIF(@category, ''),
  artist_name = NULLIF(@artist_name, ''),
  song_album_name = NULLIF(@song_album_name, ''),
  is_winner = NULLIF(@is_winner, ''),
  -- Set other columns not in the CSV to NULL
  annual_edition = NULL,
  producers = NULL,
  url = NULL;

-- =====================================
-- ↩️ Restore original SQL mode
-- =====================================
SET GLOBAL sql_mode = @OLD_SQL_MODE;

-- Done loading staging tables
SELECT '✅ All staging tables created and loaded successfully.' AS status;


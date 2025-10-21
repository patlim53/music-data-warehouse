-- ----------------------------------------------------------------
-- FULL WAREHOUSE SETUP & ETL POPULATION SCRIPT
-- ----------------------------------------------------------------
-- This script creates the database, schema, and populates the
-- 'music_warehouse' from the 'music_source' staging database.
--
-- This script can be run multiple times safely.
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- STEP 0: Create Database and Tables
-- ----------------------------------------------------------------

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS music_warehouse;

-- Target the warehouse database
USE music_warehouse;

-- Create dim_artist table
CREATE TABLE IF NOT EXISTS dim_artist (
  `artist_id` INT NOT NULL AUTO_INCREMENT,
  `artist_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`artist_id`),
  UNIQUE INDEX `artist_name_UNIQUE` (`artist_name` ASC) VISIBLE)
ENGINE = InnoDB;

-- Create dim_song table
CREATE TABLE IF NOT EXISTS dim_song (
  `song_id` INT NOT NULL AUTO_INCREMENT,
  `track_name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`song_id`))
ENGINE = InnoDB;

-- Create dim_platform table
CREATE TABLE IF NOT EXISTS dim_platform (
  `platform_id` INT NOT NULL AUTO_INCREMENT,
  `platform_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`platform_id`),
  UNIQUE INDEX `platform_name_UNIQUE` (`platform_name` ASC) VISIBLE)
ENGINE = InnoDB;

-- Create dim_date table
CREATE TABLE IF NOT EXISTS dim_date (
  `date_id` INT NOT NULL,
  `full_date` DATE NULL,
  `year` INT NULL,
  PRIMARY KEY (`date_id`))
ENGINE = InnoDB;

-- Create fact_song_performance table
CREATE TABLE IF NOT EXISTS fact_song_performance (
  `performance_id` BIGINT NOT NULL AUTO_INCREMENT,
  `song_id` INT NOT NULL,
  `artist_id` INT NOT NULL,
  `producer_id` INT NULL,
  `platform_id` INT NOT NULL,
  `date_id` INT NOT NULL,
  `chart_rank` INT NULL,
  `peak_rank` INT NULL,
  `previous_rank` INT NULL,
  `weeks_on_chart` INT NULL,
  `streams` BIGINT NULL,
  `views` BIGINT NULL,
  `is_winner` TINYINT(1) NULL,
  PRIMARY KEY (`performance_id`),
  INDEX `fk_fact_song_idx` (`song_id` ASC) VISIBLE,
  INDEX `fk_fact_artist_idx` (`artist_id` ASC) VISIBLE,
  INDEX `fk_fact_platform_idx` (`platform_id` ASC) VISIBLE,
  INDEX `fk_fact_date_idx` (`date_id` ASC) VISIBLE,
  INDEX `fk_fact_producer_idx` (`producer_id` ASC) VISIBLE,
  CONSTRAINT `fk_fact_song` FOREIGN KEY (`song_id`) REFERENCES `dim_song` (`song_id`),
  CONSTRAINT `fk_fact_artist` FOREIGN KEY (`artist_id`) REFERENCES `dim_artist` (`artist_id`),
  CONSTRAINT `fk_fact_producer` FOREIGN KEY (`producer_id`) REFERENCES `dim_artist` (`artist_id`),
  CONSTRAINT `fk_fact_platform` FOREIGN KEY (`platform_id`) REFERENCES `dim_platform` (`platform_id`),
  CONSTRAINT `fk_fact_date` FOREIGN KEY (`date_id`) REFERENCES `dim_date` (`date_id`)
)
ENGINE = InnoDB;


-- ----------------------------------------------------------------
-- STEP 1: Populate Static Dimension Tables
-- ----------------------------------------------------------------

-- Populate dim_platform with the names of your data sources.
-- The ON DUPLICATE KEY UPDATE prevents errors if you run the script multiple times.
INSERT INTO dim_platform (platform_name) VALUES
('Spotify'),
('YouTube'),
('Grammy'),
('Discogs')
ON DUPLICATE KEY UPDATE platform_name = VALUES(platform_name);

-- Populate dim_date. For this project, we'll use the years from the Grammy data.
-- The date_id is set to YYYY0101 for simplicity in joining.
INSERT INTO dim_date (date_id, full_date, year)
SELECT DISTINCT
    (year * 10000) + 101 AS date_id,
    STR_TO_DATE(CONCAT(year, '-01-01'), '%Y-%m-%d') AS full_date,
    year
FROM
    music_source.stage_grammy
WHERE year IS NOT NULL
ON DUPLICATE KEY UPDATE date_id = VALUES(date_id);

-- Add a placeholder date for non-Grammy, weekly data (Spotify/YouTube)
INSERT INTO dim_date (date_id, full_date, year) VALUES (20230101, '2023-01-01', 2023)
ON DUPLICATE KEY UPDATE date_id = VALUES(date_id);


-- ----------------------------------------------------------------
-- STEP 2: Populate Core Dimension Tables from Staging Data
-- ----------------------------------------------------------------

-- Populate dim_artist with unique artist and producer names from all sources
INSERT INTO dim_artist (artist_name)
SELECT DISTINCT artist_name FROM (
    SELECT artist_name FROM music_source.stage_spotify WHERE artist_name IS NOT NULL AND artist_name != ''
    UNION
    SELECT artist_name FROM music_source.stage_youtube WHERE artist_name IS NOT NULL AND artist_name != ''
    UNION
    SELECT artist_name FROM music_source.stage_grammy WHERE artist_name IS NOT NULL AND artist_name != ''
    UNION
    SELECT artist_name FROM music_source.stage_discogs WHERE artist_name IS NOT NULL AND artist_name != ''
    UNION
    SELECT producer_name FROM music_source.stage_discogs WHERE producer_name IS NOT NULL AND producer_name != ''
) AS all_artists
ON DUPLICATE KEY UPDATE artist_name = VALUES(artist_name);

-- Populate dim_song with unique track titles from all sources
INSERT INTO dim_song (track_name)
SELECT DISTINCT track_name FROM (
    SELECT track_name FROM music_source.stage_spotify WHERE track_name IS NOT NULL AND track_name != ''
    UNION
    SELECT track_name FROM music_source.stage_youtube WHERE track_name IS NOT NULL AND track_name != ''
    UNION
    SELECT song_album_name AS track_name FROM music_source.stage_grammy WHERE song_album_name IS NOT NULL AND song_album_name != ''
    UNION
    SELECT track_title AS track_name FROM music_source.stage_discogs WHERE track_title IS NOT NULL AND track_title != ''
) AS all_songs
ON DUPLICATE KEY UPDATE track_name = VALUES(track_name);


-- ----------------------------------------------------------------
-- STEP 3: Populate the Fact Table from Each Staging Source
-- ----------------------------------------------------------------

-- Before inserting, it's safer to clear the fact table to avoid duplicate entries on re-runs.
TRUNCATE TABLE fact_song_performance;

-- Load Spotify Data
INSERT INTO fact_song_performance (song_id, artist_id, platform_id, date_id, chart_rank, peak_rank, previous_rank, weeks_on_chart, streams)
SELECT
    s.song_id,
    a.artist_id,
    p.platform_id,
    20230101 AS date_id, -- Using the placeholder date for weekly chart data
    st.chart_rank,
    st.peak_rank,
    st.previous_rank,
    st.weeks_on_chart,
    st.streams
FROM music_source.stage_spotify st
JOIN dim_song s ON st.track_name = s.track_name
JOIN dim_artist a ON st.artist_name = a.artist_name
JOIN dim_platform p ON p.platform_name = 'Spotify';

-- Load YouTube Data
INSERT INTO fact_song_performance (song_id, artist_id, platform_id, date_id, chart_rank, previous_rank, weeks_on_chart, views)
SELECT
    s.song_id,
    a.artist_id,
    p.platform_id,
    20230101 AS date_id, -- Using the placeholder date
    yt.rank_val,
    yt.prev_rank,
    yt.weeks_on_chart,
    yt.views
FROM music_source.stage_youtube yt
JOIN dim_song s ON yt.track_name = s.track_name
JOIN dim_artist a ON yt.artist_name = a.artist_name
JOIN dim_platform p ON p.platform_name = 'YouTube';

-- Load Grammy Data
INSERT INTO fact_song_performance (song_id, artist_id, platform_id, date_id, is_winner)
SELECT
    s.song_id,
    a.artist_id,
    p.platform_id,
    d.date_id,
    g.is_winner
FROM music_source.stage_grammy g
JOIN dim_song s ON g.song_album_name = s.track_name
JOIN dim_artist a ON g.artist_name = a.artist_name
JOIN dim_platform p ON p.platform_name = 'Grammy'
JOIN dim_date d ON g.year = d.year;

-- Load Discogs Producer Data
INSERT INTO fact_song_performance (song_id, artist_id, producer_id, platform_id, date_id)
SELECT
    s.song_id,
    a.artist_id,
    prod.artist_id AS producer_id,
    p.platform_id,
    20230101 AS date_id -- Using the placeholder date
FROM music_source.stage_discogs d
JOIN dim_song s ON d.track_title = s.track_name
JOIN dim_artist a ON d.artist_name = a.artist_name
JOIN dim_artist prod ON d.producer_name = prod.artist_name
JOIN dim_platform p ON p.platform_name = 'Discogs';

-- ----------------------------------------------------------------
-- ETL Process Complete
-- ----------------------------------------------------------------


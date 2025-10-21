const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// API Endpoints

// Endpoint to get Key Performance Indicators (KPIs)
app.get('/api/kpis', async (req, res) => {
    try {
        const [kpis] = await pool.query(`
            SELECT
                (SELECT COUNT(DISTINCT artist_id) FROM dim_artist) AS total_artists,
                (SELECT COUNT(DISTINCT song_id) FROM dim_song) AS total_songs,
                (SELECT SUM(streams) FROM fact_song_performance WHERE platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'Spotify')) AS total_spotify_streams,
                (SELECT SUM(views) FROM fact_song_performance WHERE platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'YouTube')) AS total_youtube_views;
        `);
        res.json(kpis[0]);
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
});

// Endpoint to get data for charts
app.get('/api/chart-data', async (req, res) => {
    try {
        const [topArtistsSpotify] = await pool.query(`
            SELECT da.artist_name, SUM(fs.streams) as total_metric
            FROM fact_song_performance fs
            JOIN dim_artist da ON fs.artist_id = da.artist_id
            JOIN dim_platform dp ON fs.platform_id = dp.platform_id
            WHERE dp.platform_name = 'Spotify'
            GROUP BY da.artist_name
            ORDER BY total_metric DESC
            LIMIT 10;
        `);

        const [topArtistsYouTube] = await pool.query(`
            SELECT da.artist_name, SUM(fs.views) as total_metric
            FROM fact_song_performance fs
            JOIN dim_artist da ON fs.artist_id = da.artist_id
            JOIN dim_platform dp ON fs.platform_id = dp.platform_id
            WHERE dp.platform_name = 'YouTube'
            GROUP BY da.artist_name
            ORDER BY total_metric DESC
            LIMIT 10;
        `);

        const [songsLongestOnChart] = await pool.query(`
            SELECT ds.track_name, MAX(fs.weeks_on_chart) as total_metric
            FROM fact_song_performance fs
            JOIN dim_song ds ON fs.song_id = ds.song_id
            WHERE fs.weeks_on_chart IS NOT NULL
            GROUP BY ds.track_name
            ORDER BY total_metric DESC
            LIMIT 10;
        `);

        res.json({
            topArtistsSpotify,
            topArtistsYouTube,
            songsLongestOnChart
        });

    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// Endpoint to search for artists
app.get('/api/search/artists', async (req, res) => {
    const searchTerm = req.query.q || '';
    if (searchTerm.length < 2) {
        return res.json([]);
    }
    try {
        const [artists] = await pool.query(
            'SELECT artist_id, artist_name FROM dim_artist WHERE artist_name LIKE ? LIMIT 10',
            [`%${searchTerm}%`]
        );
        res.json(artists);
    } catch (error) {
        console.error('Error searching artists:', error);
        res.status(500).json({ error: 'Failed to search artists' });
    }
});


app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});


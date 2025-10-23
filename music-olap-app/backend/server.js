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

// Endpoint to get Key Performance Indicators (KPIs) with platform filtering
app.get('/api/kpis', async (req, res) => {
    try {
        const platform = req.query.platform || 'all';
        let query = '';

        if (platform === 'all') {
            // All platforms combined
            query = `
                SELECT
                    (SELECT COUNT(DISTINCT artist_id) FROM dim_artist) AS total_artists,
                    (SELECT COUNT(DISTINCT song_id) FROM dim_song) AS total_songs,
                    (
                        (SELECT COALESCE(SUM(streams), 0) FROM fact_song_performance WHERE platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'Spotify')) +
                        (SELECT COALESCE(SUM(views), 0) FROM fact_song_performance WHERE platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'YouTube'))
                    ) AS total_streams_views
            `;
        } else if (platform === 'spotify') {
            // Spotify only
            query = `
                SELECT
                    (SELECT COUNT(DISTINCT fs.artist_id) 
                     FROM fact_song_performance fs 
                     WHERE fs.platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'Spotify')) AS total_artists,
                    (SELECT COUNT(DISTINCT fs.song_id) 
                     FROM fact_song_performance fs 
                     WHERE fs.platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'Spotify')) AS total_songs,
                    (SELECT COALESCE(SUM(streams), 0) 
                     FROM fact_song_performance 
                     WHERE platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'Spotify')) AS total_streams_views
            `;
        } else if (platform === 'youtube') {
            // YouTube only
            query = `
                SELECT
                    (SELECT COUNT(DISTINCT fs.artist_id) 
                     FROM fact_song_performance fs 
                     WHERE fs.platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'YouTube')) AS total_artists,
                    (SELECT COUNT(DISTINCT fs.song_id) 
                     FROM fact_song_performance fs 
                     WHERE fs.platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'YouTube')) AS total_songs,
                    (SELECT COALESCE(SUM(views), 0) 
                     FROM fact_song_performance 
                     WHERE platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'YouTube')) AS total_streams_views
            `;
        } else if (platform === 'grammy') {
            // Grammy only - no streams/views data
            query = `
                SELECT
                    (SELECT COUNT(DISTINCT artist_id) FROM dim_grammy) AS total_artists,
                    (SELECT COUNT(DISTINCT song_album_name) FROM dim_grammy) AS total_songs,
                    NULL AS total_streams_views
            `;
        }

        const [kpis] = await pool.query(query);
        res.json(kpis[0]);
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
});

// Endpoint to get artist rankings by platform
app.get('/api/artist-rankings', async (req, res) => {
    try {
        const platform = req.query.platform || 'youtube';
        let query = '';

        if (platform === 'spotify') {
            query = `
                SELECT da.artist_name, SUM(fs.streams) as total_metric
                FROM fact_song_performance fs
                JOIN dim_artist da ON fs.artist_id = da.artist_id
                JOIN dim_platform dp ON fs.platform_id = dp.platform_id
                WHERE dp.platform_name = 'Spotify'
                GROUP BY da.artist_name
                ORDER BY total_metric DESC
                LIMIT 10
            `;
        } else {
            // YouTube
            query = `
                SELECT da.artist_name, SUM(fs.views) as total_metric
                FROM fact_song_performance fs
                JOIN dim_artist da ON fs.artist_id = da.artist_id
                JOIN dim_platform dp ON fs.platform_id = dp.platform_id
                WHERE dp.platform_name = 'YouTube'
                GROUP BY da.artist_name
                ORDER BY total_metric DESC
                LIMIT 10
            `;
        }

        const [rankings] = await pool.query(query);
        res.json(rankings);
    } catch (error) {
        console.error('Error fetching artist rankings:', error);
        res.status(500).json({ error: 'Failed to fetch artist rankings' });
    }
});

// Endpoint to get song rankings by platform
app.get('/api/song-rankings', async (req, res) => {
    try {
        const platform = req.query.platform || 'youtube';
        let query = '';

        if (platform === 'spotify') {
            query = `
                SELECT ds.track_name, MAX(fs.weeks_on_chart) as total_metric
                FROM fact_song_performance fs
                JOIN dim_song ds ON fs.song_id = ds.song_id
                JOIN dim_platform dp ON fs.platform_id = dp.platform_id
                WHERE dp.platform_name = 'Spotify' AND fs.weeks_on_chart IS NOT NULL
                GROUP BY ds.track_name
                ORDER BY total_metric DESC
                LIMIT 10
            `;
        } else {
            // YouTube
            query = `
                SELECT ds.track_name, MAX(fs.weeks_on_chart) as total_metric
                FROM fact_song_performance fs
                JOIN dim_song ds ON fs.song_id = ds.song_id
                JOIN dim_platform dp ON fs.platform_id = dp.platform_id
                WHERE dp.platform_name = 'YouTube' AND fs.weeks_on_chart IS NOT NULL
                GROUP BY ds.track_name
                ORDER BY total_metric DESC
                LIMIT 10
            `;
        }

        const [rankings] = await pool.query(query);
        res.json(rankings);
    } catch (error) {
        console.error('Error fetching song rankings:', error);
        res.status(500).json({ error: 'Failed to fetch song rankings' });
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

// Endpoint to get artist details (streams/views)
app.get('/api/artist/:id', async (req, res) => {
    try {
        const artistId = req.params.id;

        const query = `
            SELECT
                (SELECT COALESCE(SUM(streams), 0) 
                 FROM fact_song_performance 
                 WHERE artist_id = ? 
                 AND platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'Spotify')) AS total_spotify_streams,
                (SELECT COALESCE(SUM(views), 0) 
                 FROM fact_song_performance 
                 WHERE artist_id = ? 
                 AND platform_id = (SELECT platform_id FROM dim_platform WHERE platform_name = 'YouTube')) AS total_youtube_views
        `;

        const [artistData] = await pool.query(query, [artistId, artistId]);
        res.json(artistData[0]);
    } catch (error) {
        console.error('Error fetching artist details:', error);
        res.status(500).json({ error: 'Failed to fetch artist details' });
    }
});

// Endpoint to get artist's Grammy history
app.get('/api/artist/:id/grammys', async (req, res) => {
    try {
        const artistId = req.params.id;

        const query = `
            SELECT 
                dg.song_album_name,
                dg.year_nominated AS year,
                dg.category,
                dg.result
            FROM dim_grammy dg
            WHERE dg.artist_id = ?
            ORDER BY dg.year_nominated DESC
        `;

        const [grammyHistory] = await pool.query(query, [artistId]);
        res.json(grammyHistory);
    } catch (error) {
        console.error('Error fetching Grammy history:', error);
        res.status(500).json({ error: 'Failed to fetch Grammy history' });
    }
});

// Endpoint to get artist's producer credits
app.get('/api/artist/:id/producers', async (req, res) => {
    try {
        const artistId = req.params.id;

        const query = `
            SELECT DISTINCT dp.producer_name
            FROM dim_producer dp
            JOIN bridge_artist_producer bap ON dp.producer_id = bap.producer_id
            WHERE bap.artist_id = ?
            ORDER BY dp.producer_name ASC
        `;

        const [producers] = await pool.query(query, [artistId]);
        res.json(producers);
    } catch (error) {
        console.error('Error fetching producer credits:', error);
        res.status(500).json({ error: 'Failed to fetch producer credits' });
    }
});


app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
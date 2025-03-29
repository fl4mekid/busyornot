require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// CORS ayarları
app.use(cors({
    origin: 'https://fl4mekid.github.io',
    methods: ['GET']
}));

// API endpoint'i
app.get('/api/events', async (req, res) => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${process.env.CALENDAR_ID}/events?key=${process.env.CALENDAR_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
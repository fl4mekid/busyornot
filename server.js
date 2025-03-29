require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// CORS ayarları - tüm domainlere izin ver
app.use(cors());

// Rate limiting için basit bir middleware
const rateLimit = {};
app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (rateLimit[ip]) {
        const timeDiff = now - rateLimit[ip].timestamp;
        if (timeDiff < 1000) { // 1 saniye içinde maksimum istek sayısı
            rateLimit[ip].count++;
            if (rateLimit[ip].count > 10) {
                return res.status(429).json({ error: 'Too many requests' });
            }
        } else {
            rateLimit[ip].count = 1;
            rateLimit[ip].timestamp = now;
        }
    } else {
        rateLimit[ip] = {
            count: 1,
            timestamp: now
        };
    }
    next();
});

// API endpoint'i
app.get('/api/events', async (req, res) => {
    try {
        const calendarId = process.env.CALENDAR_ID;
        const apiKey = process.env.CALENDAR_API_KEY;
        
        if (!calendarId || !apiKey) {
            throw new Error('Calendar ID veya API Key eksik');
        }

        const timeMin = new Date();
        const timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('Google Calendar API Hatası:', data);
            throw new Error(data.error?.message || 'API hatası');
        }

        res.json(data);
    } catch (error) {
        console.error('API Hatası:', error);
        res.status(500).json({ 
            error: 'Sunucu hatası',
            message: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Sayfa bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ 
        error: 'Sunucu hatası',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
    });
});

app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
}); 
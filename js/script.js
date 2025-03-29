// API Bilgileri
const API_KEY = 'AIzaSyDvNqmKw96e5-NPsV-mHs2y1Q49jSvkwEc';
const CALENDAR_ID = 'e7b79d1506cbd17c8f98d6a434118a22f8a508996b888a610250e5e5b5502d5b@group.calendar.google.com';
const API_URL = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${new Date().toISOString()}&timeMax=${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}&singleEvents=true&orderBy=startTime`;

// DOM elementleri
const statusText = document.getElementById('statusText');
const eventSummary = document.getElementById('eventSummary');
const eventTime = document.getElementById('eventTime');
const eventCreator = document.getElementById('eventCreator');

let currentEvent = null;
let upcomingEvent = null;

// Panel otomatik kapatma için değişkenler
let autoCloseTimeout;
const PANEL_TIMEOUT = 60000; // 60 saniye

async function fetchEvents(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Yanıtı:', data); // API yanıtını logla
        return data.items || [];
    } catch (error) {
        console.error('API erişim hatası:', error.message);
        return [];
    }
}

async function updateEvents() {
    try {
        const events = await fetchEvents(API_URL);
        console.log('Tüm etkinlikler:', events); // Tüm etkinlikleri logla
        
        const currentTime = new Date();
        console.log('Şu anki zaman:', currentTime); // Şu anki zamanı logla

        currentEvent = events.find(event => {
            const eventStartTime = new Date(event.start.dateTime);
            const eventEndTime = new Date(event.end.dateTime);
            console.log('Etkinlik:', {
                summary: event.summary,
                start: eventStartTime,
                end: eventEndTime,
                isCurrentEvent: eventStartTime <= currentTime && eventEndTime >= currentTime
            }); // Her etkinliğin zaman kontrolünü logla
            return eventStartTime <= currentTime && eventEndTime >= currentTime;
        });

        console.log('Mevcut etkinlik:', currentEvent); // Bulunan mevcut etkinliği logla

        upcomingEvent = events.find(event => new Date(event.start.dateTime) > currentTime);
        console.log('Gelecek etkinlik:', upcomingEvent); // Gelecek etkinliği logla

        updateStatus();
        
        const panel = document.getElementById('futureEvents');
        if (!panel.classList.contains('translate-x-full')) {
            updateTimeline(events);
        }
    } catch (error) {
        console.error('Etkinlikler güncellenirken hata oluştu:', error);
    }
}

function updateStatus() {
    if (currentEvent) {
        statusText.textContent = 'MEŞGUL';
        statusText.className = 'text-7xl md:text-9xl font-bold status-busy animate-pulse drop-shadow-2xl';
        document.body.style.background = 'linear-gradient(135deg, #590D22 50%, #C9184A 120%)';
        
        document.getElementById('clickToSee').classList.remove('hidden');
        document.getElementById('clickToFuture').classList.add('hidden');
        
        eventSummary.textContent = currentEvent.summary === undefined ? '(Başlıksız)' : currentEvent.summary;
        eventTime.textContent = `${formatDateTime(new Date(currentEvent.start.dateTime))} - ${formatDateTime(new Date(currentEvent.end.dateTime))}`;
        eventCreator.textContent = currentEvent.creator.email || 'Organizatör';

        // MÜSAİT -> MEŞGUL geçişinde Gelecek Toplantılar panelini kapat
        const futurePanel = document.getElementById('futureEvents');
        if (!futurePanel.classList.contains('translate-x-full')) {
            futurePanel.classList.add('translate-x-full');
            if (window.countdownInterval) {
                clearInterval(window.countdownInterval);
            }
        }
    } else {
        statusText.textContent = 'MÜSAİT';
        statusText.className = 'text-7xl md:text-9xl font-bold status-available drop-shadow-2xl';
        document.body.style.background = 'linear-gradient(135deg, #007667 50%, #00d8bd 100%)';
        
        document.getElementById('clickToSee').classList.add('hidden');
        
        if (upcomingEvent) {
            document.getElementById('clickToFuture').classList.remove('hidden');
        } else {
            document.getElementById('clickToFuture').classList.add('hidden');
        }

        // MEŞGUL -> MÜSAİT geçişinde Detaylar panelini kapat
        const detailsPanel = document.getElementById('details');
        if (!detailsPanel.classList.contains('translate-x-full')) {
            detailsPanel.classList.add('translate-x-full');
        }
    }
}

function updateTimeline(events = []) {
    if (!Array.isArray(events)) return;

    const container = document.getElementById('timelineContainer');
    if (!container) return;

    container.innerHTML = '';

    const now = new Date();
    const futureEvents = events.filter(event => new Date(event.start.dateTime) > now)
                              .sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));

    const innerContainer = document.createElement('div');
    innerContainer.className = 'flex space-x-4 min-w-max pb-2';

    futureEvents.forEach((event) => {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        
        const eventElement = document.createElement('div');
        eventElement.className = 'meeting-card';
        eventElement.innerHTML = `
            <div class="meeting-title font-bold mb-1 truncate">${event.summary === undefined ? '(Başlıksız)' : event.summary}</div>
            <div class="meeting-date text-[10px] mb-1">${formatDate(eventStart)}</div>
            <div class="meeting-time text-xs mb-1">${formatDateTime(eventStart)} - ${formatDateTime(eventEnd)}</div>
            <div class="meeting-organizer text-xs opacity-75 truncate">${event.creator.email || 'Organizatör'}</div>
        `;
        
        innerContainer.appendChild(eventElement);
    });

    container.appendChild(innerContainer);

    if (futureEvents.length > 0) {
        startCountdown(futureEvents[0]);
    }
}

function startCountdown(nextEvent) {
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }

    function updateTimer() {
        const now = new Date().getTime();
        const eventStart = new Date(nextEvent.start.dateTime).getTime();
        const timeDiff = eventStart - now;

        if (timeDiff <= 0) {
            clearInterval(window.countdownInterval);
            updateEvents();
            return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        document.getElementById('futureHours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('futureMinutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('futureSeconds').textContent = seconds.toString().padStart(2, '0');
    }

    updateTimer();
    window.countdownInterval = setInterval(updateTimer, 1000);
}

function formatDateTime(dateTime) {
    return new Intl.DateTimeFormat('tr-TR', { hour: 'numeric', minute: 'numeric' }).format(dateTime);
}

// Yeni tarih formatlama fonksiyonu
function formatDate(dateTime) {
    return new Intl.DateTimeFormat('tr-TR', { 
        day: 'numeric',
        month: 'long',
        weekday: 'long'
    }).format(dateTime);
}

// Panelleri otomatik kapatma fonksiyonu
function startAutoCloseTimer() {
    if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
    }
    
    autoCloseTimeout = setTimeout(() => {
        const detailsPanel = document.getElementById('details');
        const futurePanel = document.getElementById('futureEvents');
        
        if (!detailsPanel.classList.contains('translate-x-full')) {
            detailsPanel.classList.add('translate-x-full');
        }
        
        if (!futurePanel.classList.contains('translate-x-full')) {
            futurePanel.classList.add('translate-x-full');
            if (window.countdownInterval) {
                clearInterval(window.countdownInterval);
            }
        }
    }, PANEL_TIMEOUT);
}

// Mouse/touch olaylarını dinle
function resetAutoCloseTimer() {
    const detailsPanel = document.getElementById('details');
    const futurePanel = document.getElementById('futureEvents');
    
    // Eğer panellerden biri açıksa zamanlayıcıyı başlat
    if (!detailsPanel.classList.contains('translate-x-full') || 
        !futurePanel.classList.contains('translate-x-full')) {
        startAutoCloseTimer();
    }
}

function toggleDetails() {
    document.getElementById('details').classList.toggle('translate-x-full');
    resetAutoCloseTimer();
}

function toggleFutureEvents() {
    const panel = document.getElementById('futureEvents');
    panel.classList.toggle('translate-x-full');
    
    // Panel açıldığında events'leri al ve timeline'ı güncelle
    if (!panel.classList.contains('translate-x-full')) {
        fetchEvents(API_URL).then(events => {
            if (events && Array.isArray(events)) {
                updateTimeline(events);
            }
        }).catch(error => {
            console.error('Error fetching events:', error);
        });
    } else {
        // Panel kapandığında interval'i temizle
        if (window.countdownInterval) {
            clearInterval(window.countdownInterval);
        }
    }
    
    resetAutoCloseTimer();
}

// Başlangıç yüklemesi
document.addEventListener('DOMContentLoaded', () => {
    updateEvents().catch(error => {
        console.error('Initial load error:', error);
    });
    
    // Mouse/touch olaylarını dinlemeye başla
    document.addEventListener('mousemove', resetAutoCloseTimer);
    document.addEventListener('touchstart', resetAutoCloseTimer);
});

// Periyodik güncelleme (tek bir setInterval yeterli)
setInterval(() => {
    updateEvents().catch(error => {
        console.error('Periodic update error:', error);
    });
}, 5000);

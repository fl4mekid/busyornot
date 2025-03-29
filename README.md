# BusyOrNot

Toplantı odası durumunu gösteren uygulama.

## Kurulum

1. Repoyu klonlayın
2. `.env.example` dosyasını `.env` olarak kopyalayın
3. `.env` dosyasındaki değerleri kendi API bilgilerinizle güncelleyin
4. Bağımlılıkları yükleyin:
```bash
npm install
```
5. Uygulamayı başlatın:
```bash
npm start
```

## Güvenlik

- API anahtarınızı ve Takvim ID'nizi asla GitHub'a pushlamayın
- `.env` dosyası `.gitignore`'da olduğundan emin olun
- Sadece güvenilir kaynaklardan gelen isteklere izin verilir
- Rate limiting koruması aktif
- Hassas veriler API yanıtlarından temizlenir

## Geliştirme

- `NODE_ENV=development` modunda daha detaylı hata mesajları görüntülenir
- Localhost'ta test ederken CORS izinleri otomatik olarak verilir
- API istekleri saniyede maksimum 10 adet ile sınırlıdır 
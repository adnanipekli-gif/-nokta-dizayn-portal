# Nokta Dizayn Portal — CLAUDE.md

## Proje Bilgisi

**Uygulama:** Nokta Dizayn Mimari Proje Portalı v4.5
**Stack:** React + Vite + Firebase Firestore
**Branch:** `claude/firebase-storage-light-theme-IxKxI`

## Proje Yapısı

```
src/
  App.jsx       # Tek dosya React uygulaması (~800 satır)
  firebase.js   # Firebase Firestore bağlantısı (loadData / saveData)
  main.jsx      # Vite entry point
index.html
vite.config.js
```

## Mimari Kararlar

### Veri Katmanı
- **firebase.js** `loadData(key)` / `saveData(key, value)` — Firestore `appdata` koleksiyonunu kullanır
- App.jsx içinde `ld/sv/ldS/svS` fonksiyonları Firebase'i çağırır (`window.storage` artık kullanılmıyor)
- Session verisi: `ndv45-sess` anahtarıyla
- Projeler: `ndv45-proj` (admin paylaşımlı)
- Kullanıcılar: `ndv45-users`

### Tema
- Arka plan: `#f4f6f9`
- Kartlar: `#ffffff`, border: `#dce0e5`
- Navy: `#1a3a5f`
- Mavi: `#2980B9`
- Koyu metin: `#1a2a3a`

### Ekipman Kataloğu

#### Ecocold Soğutma
- Dikey soğutucu: 70/100/140cm
- Yatay dondurucu: 150cm
- Şarküteri vitrini: 150/200/250cm
- Pasta vitrini: 120cm
- Ada soğutucu: 200cm
- Grab&Go: 100/150cm
- **Navi** Bombe Cam Kasap Vitrini: 150/200/250cm — `EC-NVI-*`
- **Apple** Plug-in Dondurucu: 188/212cm — `EC-APL-*`
- **Orange** Vitrin: 100/150/200cm — `EC-ORG-*`

#### Ecocold Sütlük (Merga)
- Merga Sütlük: 125/187/250cm — `EC-MRG-*`
- Kapaklı Sütlük: 125cm — `EC-CLS-*`
- Duvar Tipi: 200cm — `EC-WLL-*`

#### Pasifik Raf
- Tek taraflı gondol: 90/100/120cm — `PR-SGL-*`
- Çift taraflı gondol: 90/100/120cm — `PR-DBL-*`
- Duvar rafı: 200cm — `PR-WLL-*`
- Endcap: 90cm — `PR-END-*`
- Promosyon sepeti: 80cm — `PR-PRM-*`

#### Nokta Dizayn
- Ahşap Lata Ünitesi 250cm — `ND-LAT-2500`
- Self-Servis Ekmek Rafı 120cm — `ND-BRD-1200`
- Isıtmalı Vitrin 120cm — `ND-HTV-1200`
- Kahve Bar Tezgahı 200cm — `ND-CBR-2000`
- Kasa Tezgahı 150cm — `ND-CSH-1500`
- Sandviç Tezgahı 200cm — `ND-SND-2000`

### Sunum Modu Özellikleri
- Slaytlar: Kapak → Plan → 3D → Konsept Board → Walkthrough → Onay
- **"Görsel İyileştir"** butonu: `generateDesignTips()` ile kural tabanlı tasarım önerileri üretir
- Onay sayfası: tarih damgası + onaylayan adı kaydeder, status `konsept-onay` yapar

### Önemli Sabitler
- `ADMINS`: `ndgroupcompnies@gmail.com`, `adnan.ipekli@gmail.com`, `gozdeipekli@gmail.com`, `turnaertan@gmail.com`
- `KDV`: %20
- `ELEC_KWH`: 4.2 ₺/kWh
- `SC` (ölçek): 0.08 (piksel/cm)

## Geliştirme

```bash
npm install
npm run dev      # localhost:5173
npm run build    # dist/ klasörü
```

## Firebase Güvenlik Notu
- `firebase.js` içinde gerçek API anahtarı mevcut
- Firestore güvenlik kuralları Firebase Console'dan yönetilmeli
- Üretim ortamında domain kısıtlaması ekleyin

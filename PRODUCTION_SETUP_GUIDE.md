# 📋 NOKTA DIZAYN PORTAL v5 - PRODUCTION SETUP GUIDE

## 🎯 Hızlı Başlangıç (5 Dakika)

### 1. API Keylerini Al

**SendGrid:**
```
URL: https://sendgrid.com/free
1. Sign up → Free tier
2. Verify email
3. Settings → API Keys
4. Create API Key → Full Access
5. Copy: SG.xxxxxxxxxxxxx
```

**Freepik:**
```
URL: https://www.freepik.com/api
1. Get Started → Free API
2. Copy API Key
3. 25 free requests/day
```

### 2. .env Dosyası Oluştur

```bash
# Terminal:
cd /home/claude/nd-portal
cp .env.example .env
```

**`.env` dosyasını aç ve doldur:**
```env
# SendGrid
REACT_APP_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# Freepik
REACT_APP_FREEPIK_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# Email
REACT_APP_EMAIL_FROM=portal@nokta-dizayn.com
REACT_APP_ENVIRONMENT=production
```

### 3. Vercel Environment Variables

```bash
# Vercel Dashboard → Project → Settings → Environment Variables

Add:
Name:  REACT_APP_SENDGRID_API_KEY
Value: SG.xxxxxxxxxxxxxxxxxxxx
Type:  Encrypted
Environments: Production & Preview

Add:
Name:  REACT_APP_FREEPIK_API_KEY
Value: xxxxxxxxxxxxxxxxxxxxx
Type:  Encrypted
Environments: Production & Preview
```

### 4. Deploy

```bash
git add .
git commit -m "Production: Add API keys"
git push origin main

# Vercel otomatik deploy yapacak
# https://nokta-dizayn-portal.vercel.app
```

---

## 🧪 TAM TESTING REHBERI

### Phase 1: Lokal Testing (Laptop)

#### Step 1: Terminal'de başlat

```bash
cd /home/claude/nd-portal

# .env'yi kontrol et
cat .env

# Dependencies yükle
npm install

# Dev server başlat
npm run dev

# Tarayıcı:
# http://localhost:5173
```

#### Step 2: Browser Console açılır (F12)

```javascript
// Aşağıdaki kodları Console'a yapıştır:

// Test 1: localStorage
localStorage.setItem('test', 'value');
console.log(localStorage.getItem('test')); // "value" yazmalı

// Test 2: sendGrid config
console.log(process.env.REACT_APP_SENDGRID_API_KEY);
// SG.xxxx... yazmalı

// Test 3: Freepik config
console.log(process.env.REACT_APP_FREEPIK_API_KEY);
// xxxx... yazmalı
```

#### Step 3: Portal Özelliklerini Test Et

**3D Viewer:**
```
1. Portal açılır → "📐 3D & Upscale" tab
2. Brand seç: "Ecocold"
3. 3D sahne görünür mü?
4. Material seçişler çalışıyor mu?
```

**Scene Setup:**
```
1. "🎨 Scene Setup" tab tıkla
2. Left panel: Material Panel
   - Flooring: "Tile" seç ✓
   - Walls: "White" seç ✓
   - Shelving: "Steel" seç ✓
   - Lighting: "Bright" seç ✓
3. Right panel: Asset Library
   - Search: "texture" yaz
   - Grid görünüyor mü? ✓
```

**PDF Builder:**
```
1. "📄 PDF Builder" tab
2. Form doldur:
   - Project Name: "Test Project"
   - Location: "Istanbul"
   - Area: "200"
   - Products: "Ecocold Fridge"
3. "Generate PDF" tıkla
4. PDF preview görünür mü?
5. "Download" → PDF indir ✓
```

**Export Dialog:**
```
1. Export button tıkla
2. Mode seç: "Single PDF"
3. Project seç
4. "Export PDF" → İndir ✓

Batch test:
1. Mode: "Batch ZIP"
2. 2+ project seç
3. "Create ZIP" → İndir ✓

Email test:
1. Mode: "Send Email"
2. Email gir: "test@example.com"
3. "Send Email" → Console'da log görülür ✓
```

#### Step 4: Console Test Utilities Çalıştır

```javascript
// Console'da:

// Health check
healthCheck()

// Tüm testleri çalıştır
runAllTests()

// Çıktı örneği:
// ✅ localStorage
// ✅ Email Service
// ✅ Batch Export
// ✅ Analytics
// ✅ Performance
// ✅ Responsiveness
// 6/6 passed
```

---

### Phase 2: Mobile Testing (Tablet - Samsung Galaxy Tab)

#### Step 1: Tablet Bağlan (Aynı ağ)

```bash
Terminal:
npm run dev

Tablet Chrome:
192.168.x.x:5173
```

#### Step 2: Responsive Test

**Landscape Mode:**
```
✓ Menüler görünüyor?
✓ Butonlar büyük?
✓ Material panel scroll?
✓ 3D viewer full width?
```

**Portrait Mode:**
```
✓ Layout responsive?
✓ Export dialog tam ekran?
✓ Email input keyboard?
✓ Form submit çalışıyor?
```

#### Step 3: Touch Test

```
✓ Button tap response (44x44px min)
✓ Slider touch working
✓ Checkbox touch
✓ Text input focus
```

---

### Phase 3: Lighthouse Audit

#### Step 1: Portal açılır

```
Vercel URL:
https://nokta-dizayn-portal.vercel.app
```

#### Step 2: DevTools → Lighthouse

```
F12 → Lighthouse tab → Desktop
"Analyze page load"

Bekleme: ~2 dakika

Hedef Scores:
- Performance: ≥ 80 ✓
- Accessibility: ≥ 90 ✓
- Best Practices: ≥ 90 ✓
- SEO: ≥ 90 ✓
```

#### Step 3: Optimize eğer düşükse

```
Performance düşükse:
- Chrome DevTools → Performance tab
- Record → Scroll portal → Stop
- Bottleneck bul → Optimize

Network tab:
- Bundle size kontrol
- Compression enabled?
- Cache working?
```

---

### Phase 4: Email Testing

#### Step 1: Test Email Gönder

```javascript
// Console'da:

// Project email test
const testEmail = async () => {
  const result = await sendProjectPDF(emailConfig, {
    projectName: 'Test Project',
    location: 'Istanbul',
    area: 200,
    email: 'test@nokta-dizayn.com',
    clientName: 'Test User'
  });
  console.log(result);
}

testEmail()

// Output:
// {
//   success: true,
//   message: "Email sent successfully",
//   to: "test@nokta-dizayn.com",
//   subject: "Your Nokta Dizayn Project Export"
// }
```

#### Step 2: SendGrid Dashboard'da Kontrol

```
SendGrid Dashboard:
- Activity → Sent emails
- Görmeli: "test@nokta-dizayn.com"
- Status: "Delivered" ✓
```

---

### Phase 5: Analytics Testing

```javascript
// Console'da:

// Event tracking
analytics.track('test_render', { brand: 'ecocold' });
analytics.track('test_pdf', { size: '2.1MB' });
analytics.track('test_email', { recipients: 1 });

// Stats kontrol
const stats = analytics.getStats('today');
console.log(stats);

// Output:
// {
//   totalEvents: 3,
//   eventTypes: {
//     test_render: 1,
//     test_pdf: 1,
//     test_email: 1
//   }
// }

// localStorage'da kaydedildi mi?
JSON.parse(localStorage.getItem('analytics_events'));
// Array görünmeli, 3+ items
```

---

### Phase 6: Production Deployment

#### Step 1: Build Test

```bash
cd /home/claude/nd-portal

npm run build

# Output:
# ✓ 446 modules
# ✓ dist/assets/index.css 18.63 kB
# ✓ dist/assets/index.es-DCeIVUSR.js 149.16 kB
# ✓ built in 23.54s

# Errors görünmedi mi? ✓
```

#### Step 2: GitHub Push

```bash
git status
git add -A
git commit -m "Production: Setup and testing complete"
git push origin master

# GitHub: adnanipekli-gif/-nokta-dizayn-portal
```

#### Step 3: Vercel Deploy

```
Vercel Dashboard:
- Project: nokta-dizayn-portal
- Auto-deploy: ON (GitHub)
- Status: Deploying → Building → Ready

URL: https://nokta-dizayn-portal.vercel.app
```

#### Step 4: Live Testing

```
Production URL açılır:
https://nokta-dizayn-portal.vercel.app

1. 3D Viewer çalışıyor?
   - Material seçişler → render update?
   - Lighting profil → scene değişiyor?

2. Export çalışıyor?
   - PDF download çalışıyor?
   - Batch ZIP download?
   - Email gidiyor? (SendGrid Dashboard check)

3. Analytics tracking?
   - localStorage'da events?
   - Correct event types?

4. Performance?
   - Load time < 4s?
   - No console errors?
   - Mobile responsive?
```

---

## 🔍 TROUBLESHOOTING

### ❌ Email görmüyor

```bash
# Step 1: Key kontrol
console.log(process.env.REACT_APP_SENDGRID_API_KEY);
// SG.xxxx... görmeli

# Step 2: SendGrid status
# https://sendgrid.com/settings/credentials/api_keys
# Status: Active olmalı

# Step 3: Vercel logs
vercel logs nokta-dizayn-portal

# Step 4: Test curl
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer SG.xxxx" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[...]}'
```

### ❌ localStorage çalışmıyor

```bash
# Private mode mı?
# Developer tools settings:
# ☑ Disable Cache (while DevTools open)

# Quota exceeded?
localStorage.clear();

# Test
localStorage.setItem('x', '1');
localStorage.getItem('x'); // "1" yazmalı
```

### ❌ PDF export hata

```javascript
// Console'da:
try {
  generateProjectPDF({ projectName: 'Test' });
} catch (e) {
  console.error('PDF error:', e);
}

// Common:
// - Canvas CORS issue
// - jsPDF not loaded
// - Image URL invalid
```

---

## ✅ FINAL CHECKLIST

```
☐ API Keys added to .env
☐ .env file in .gitignore
☐ Vercel environment variables set
☐ localStorage test passed
☐ Email template test passed
☐ Batch export test passed
☐ Analytics tracking verified
☐ Lighthouse score ≥ 80
☐ Mobile responsive (480px-1440px)
☐ npm run build → 0 errors
☐ GitHub pushed
☐ Vercel deployed
☐ Live URL tested
☐ Email delivery verified
```

---

## 📞 DESTEK

**Hata gördüğünde:**

1. **Browser Console'da hata var mı?** (F12)
   ```
   Tüm hataları not et
   ```

2. **Vercel deployment logs kontrol et**
   ```
   Vercel Dashboard → Deployments → View Build Logs
   ```

3. **SendGrid status kontrol et**
   ```
   SendGrid Dashboard → Email Activity
   Bounced/Deferred mails?
   ```

4. **Network bağlantısı kontrol et**
   ```
   DevTools → Network tab
   API calls başarılı mı? (200 status)
   ```

---

**🎉 Production'a hazır!**

Herhangi soru → Adnan'a sor

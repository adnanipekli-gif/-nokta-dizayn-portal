<!-- NOKTA DIZAYN PORTAL v5 - PRODUCTION CHECKLIST -->

# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## 1️⃣ API KEYS SETUP

### SendGrid Email API
**Amaç:** Email gönderimi ve batch export notifications

**Kurulum Adımları:**
```bash
1. https://sendgrid.com adresine git
2. Free plan'a kaydol (30 gün ücretsiz, günde 100 email)
3. Email Verification'ı tamamla
4. API Keys bölümüne git
5. "Create API Key" tıkla
6. Key adı: "nokta-portal-v5"
7. Full Access ver
8. API key'i kopyala ve güvenli yerde sakla
```

**Vercel'e Ekle:**
```bash
# Vercel Dashboard → Settings → Environment Variables
Key:   REACT_APP_SENDGRID_API_KEY
Value: SG.xxxxxxxxxxxxxxxxxxxx... (SendGrid API key)
Select: Production & Preview
```

**Test Et:**
```bash
# Lokal test:
REACT_APP_SENDGRID_API_KEY=your_key npm run dev

# Portal'da: 
Export Dialog → Email tab → test@example.com → Send
```

---

### Freepik API
**Amaç:** Asset Library search ve download

**Kurulum Adımları:**
```bash
1. https://www.freepik.com/api adresine git
2. "Get Started" tıkla
3. API Key al (Free: 25 requests/day)
4. Dashboard'dan API Key'i kopyala
```

**Vercel'e Ekle:**
```bash
Key:   REACT_APP_FREEPIK_API_KEY
Value: xxxxxxxxxxxxxxxxxxxxx (Freepik API key)
Select: Production & Preview
```

**Test Et:**
```bash
# Portal'da:
Scene Setup tab → Asset Library → Search "texture"
```

---

## 2️⃣ LOCALHOST TESTING

### localStorage Test
```javascript
// Browser Console'da (F12):

// 1. Material Preferences
localStorage.setItem('user_preferences', JSON.stringify({
  theme: 'dark',
  favoriteFloorMaterial: 'tile'
}));
console.log('✓ User preferences saved');

// 2. Verify loading
console.log(JSON.parse(localStorage.getItem('user_preferences')));

// 3. Clear all
localStorage.clear();
console.log('✓ Cleared');
```

**Adımlar:**
```
1. npm run dev → http://localhost:5173 aç
2. F12 → Console tab
3. Yukarıdaki kodu yapıştır
4. 3D & Upscale tab → material seç
5. Scene Setup tab → localStorage'da kayıtlı mı kontrol et
6. Sayfayı refresh et → Ayarlar kapalı mı kaldı?
```

---

### Email Templates Test
```bash
# Test 1: Project Export
Portal → Export Dialog → Single PDF → Email tab
↓
Email: test@nokta-dizayn.com
↓
Send → Browser Console'da log görmeli

# Test 2: Batch Export
Portal → Export Dialog → Batch ZIP
↓
Select 3+ projects
↓
Create ZIP → test@nokta-dizayn.com
↓
Console: Email payload loglanmalı

# Test 3: Verify HTML
Console'da:
console.log(emailPayload.content[0].value)
→ HTML tamamen görünür mü?
```

---

### Batch Export Test
```bash
# Test Steps:

1. Portal aç → 3D & Upscale tab
2. "Export Render" butonu → 3D görüntüsü al
3. Scene Setup tab → Material + Lighting seç
4. PDF Builder tab → Test project oluştur
5. Export Dialog → "Batch ZIP" mode
6. 2-3 project seç
7. "Create ZIP" tıkla
8. Progress bar görmeli (0-100%)
9. File indirme başlamalı → "nokta-projects-XXXX.zip"

# Verify:
- ZIP dosyası indirildi mi?
- İçinde PDF dosyaları var mı?
- PDF'ler açılıyor mu? (Adobe Reader)
- Her PDF 2 sayfa mı? (Render + Details)
```

---

### Analytics Tracking Test
```javascript
// Browser Console'da:

// Test 1: Track event
analytics.track('test_event', { test: true });
console.log(analytics.events); // Görünüyor mu?

// Test 2: Check localStorage
const events = JSON.parse(localStorage.getItem('analytics_events'));
console.log(events.length + ' events tracked');

// Test 3: Get stats
const stats = analytics.getStats('all');
console.log(stats);

// Test 4: Generate report
const report = analytics.generateReport('week');
console.log(report);

// Output: Recommendations görmeli
```

**Portal'da:**
```bash
1. 3D Viewer → material seç → analytics.track('material_change')
2. Scene Setup → lighting seç → analytics.track('lighting_change')
3. PDF Builder → export → analytics.track('pdf_export')
4. Export Dialog → email → analytics.track('email_sent')

Console'da her action loglanmalı
```

---

## 3️⃣ PERFORMANCE AUDIT

### Lighthouse Test
```bash
1. Portal aç: https://nokta-dizayn-portal.vercel.app
2. F12 → Lighthouse tab
3. "Analyze page load" → Desktop
4. Bekleme (~2 dakika)
```

**Hedef Scores:**
- Performance: ≥ 80
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

**Optimize eğer düşüka:**
```
• Image optimization (Magnific upscale)
• Code splitting (Three.js)
• CSS minification
• Lazy loading
```

### Bundle Size Check
```bash
npm run build
# Output:
# ✓ index.html                    0.63 kB
# ✓ CSS                          18.63 kB (gzip: 4.10 kB)
# ✓ JS vendor                   155.58 kB (gzip: 50.65 kB)
# ✓ JS main                     631.66 kB (gzip: 185.71 kB)

# Toplam: ~800 KB (gzip: ~250 KB) ✓ Acceptable
```

### Load Time Test
```bash
1. DevTools → Network tab
2. Throttling: "Slow 3G" seç
3. Portal reload
4. Wait time:
   - HTML: < 2s ✓
   - CSS: < 1s ✓
   - JS: < 3s ✓
   - 3D Scene: < 4s ✓
```

---

## 4️⃣ MOBILE RESPONSIVENESS TEST

### Tablet Test (iPad)
```bash
F12 → Device emulation
Device: iPad Pro 12.9"

☑️ Check:
- Layout responsive?
- Buttons clickable?
- Form inputs readable?
- Modal/Dialog visible?
- Export dialog fits screen?
- Scrolling smooth?
```

### Mobile Test (iPhone)
```bash
Device: iPhone 14 Pro

☑️ Check:
- All tabs visible?
- Material panel scrollable?
- Asset grid responsive?
- Export dialog modal full screen?
- Email input keyboard shows?
- Button heights ≥ 44px?
- Touch targets > 44x44px?
```

### Responsive Breakpoints
```css
- Mobile:  < 480px    ✓ Tested
- Tablet:  480-768px  ✓ Tested  
- Desktop: > 768px    ✓ Tested
```

**Tests:**
```bash
# Chrome DevTools
F12 → Toggle device toolbar
Size: 320px (iPhone SE)
     480px (Android)
     768px (iPad)
    1024px (Desktop)
    1440px (Wide)
```

---

## 5️⃣ PRODUCTION DEPLOYMENT

### Pre-deployment Checklist

```bash
☑️ Code & Build
- npm run build → 0 errors?
- dist/ folder ready?
- GitHub push done?

☑️ Environment
- .env keys added?
- SendGrid active?
- Freepik API working?
- Feature flags correct?

☑️ Testing
- localStorage ✓
- Emails ✓
- Batch export ✓
- Analytics ✓
- Performance ✓
- Mobile ✓

☑️ Documentation
- README updated?
- API keys documented (secure)?
- Deployment guide ready?

☑️ Monitoring
- Vercel monitoring on?
- Error tracking setup?
- Analytics dashboard ready?
```

### Deploy to Vercel

```bash
# Automatic (GitHub)
1. Commit & push
2. Vercel auto-deploys
3. Check deployment status

# Manual
1. vercel deploy
2. Wait for build
3. https://nokta-dizayn-portal.vercel.app
```

---

## 6️⃣ POST-DEPLOYMENT

### Live Testing
```bash
# Test production URL
https://nokta-dizayn-portal.vercel.app

☑️ Features:
- 3D viewer loads?
- Materials work?
- Asset library searchable?
- PDF export downloads?
- Email sends? (check Vercel logs)
- Analytics tracks?
```

### Monitoring
```bash
# Vercel Dashboard
- Deployment status
- Build logs
- Error tracking
- Function logs (if serverless)

# Email (SendGrid Dashboard)
- Emails delivered?
- Bounce rate?
- Click rate?

# Analytics (Browser localStorage)
- Events tracking?
- User stats?
```

---

## 7️⃣ TROUBLESHOOTING

### Common Issues

**❌ Problem: Email not sending**
```bash
Solution:
1. Check API key in Vercel env vars
2. Verify SendGrid account active
3. Check email domain verified
4. Look at Vercel function logs
5. Test with curl:
   curl -X POST https://api.sendgrid.com/v3/mail/send \
   -H "Authorization: Bearer YOUR_KEY" \
   -H "Content-Type: application/json" \
   -d '{"personalizations":[{"to":[{"email":"test@test.com"}]}]}'
```

**❌ Problem: localStorage not persisting**
```bash
Solution:
1. Check if private/incognito mode
2. Clear browser cache
3. Check localStorage size < 5MB
4. Verify browser supports localStorage
5. Test in Chrome DevTools:
   localStorage.setItem('test', 'value')
   localStorage.getItem('test')
```

**❌ Problem: PDF export fails**
```bash
Solution:
1. Check jsPDF + html2canvas loaded
2. Verify browser canvas support
3. Check image URLs (CORS?)
4. Test with simple HTML first
5. Check console errors (F12)
```

**❌ Problem: Batch export slow**
```bash
Solution:
1. Reduce PDF quality (settings)
2. Limit concurrent exports (3 max)
3. Use ZIP compression
4. Test with smaller batch (2-3)
```

---

## 📋 FINAL CHECKLIST

```
☑️ SendGrid API configured
☑️ Freepik API configured  
☑️ localStorage working
☑️ Email templates tested
☑️ Batch export tested
☑️ Analytics tracking verified
☑️ Performance audited (Lighthouse)
☑️ Mobile responsive (480px-1440px)
☑️ All 0 build errors
☑️ GitHub pushed
☑️ Vercel deployed
☑️ Live testing passed
☑️ Monitoring enabled
```

---

**✅ Ready for production!**

Questions? Check console logs (F12) or Vercel deployment logs

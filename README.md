# Nokta Dizayn Portal v5

🎨 Professional Store Design & Quote Management System with AI-Powered Render Upscaling

## ✨ Latest Updates (v5.1.0) — DAY 1 COMPLETE ✅

### Fixed Issues
- ✅ **Light theme "returnReact" error** — useEffect hook properly manages DOM styles
- ✅ **Three.js 3D black screen** — Scene initialization, camera positioning, lighting enhanced
- ✅ **Theme persistence** — CSS variables system for smooth theme transitions
- ✅ **Error handling** — Loading states and error messages in 3D viewer

### New Features
- ✨ **Magnific AI Integration** — Convert renders to photo-realistic 4K with single click
- 📸 **Render Export** — Capture 3D canvas as PNG for upscaling
- 🎨 **Reimagine Mode** — Style transfer with AI (modern, industrial, minimalist)
- 📥 **Batch Processing** — Multi-image upscale support
- 💾 **Download Support** — Export 4K results directly

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Add Magnific API key to .env
REACT_APP_MAGNIFIC_API_KEY=your_key_here

# Start dev server
npm run dev
```

Visit: `http://localhost:5173`

## 🔧 Build

```bash
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Lint code
npm run format   # Format with Prettier
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ThemeProvider.jsx      # Light/dark theme context
│   ├── Store3DViewer.jsx      # Three.js 3D renderer (FIXED)
│   ├── MagnificUpscaler.jsx   # AI upscale interface (NEW)
│   └── QuoteReader.tsx        # Quote management
├── services/
│   └── magnificAPI.js         # Magnific AI SDK (NEW)
├── stores/
│   └── themeStore.js          # Zustand theme state
├── styles/
│   └── index.css
└── App.jsx                    # Main app router
```

## 🎯 Workflow

### Portal → 4K Render Pipeline

```
1. Select Brand (Ecocold / Pasifik)
   ↓
2. View 3D Render (React + Three.js)
   ↓
3. Export Canvas as PNG
   ↓
4. Upscale with Magnific AI
   ├─ Standard mode: 4x upscale
   └─ Reimagine mode: style transfer
   ↓
5. Download 4K Output
   ↓
6. Use in PDF/LinkedIn/Presentations
```

## 🔑 API Integration

### Magnific AI Setup

1. Register at [magnific.ai](https://magnific.ai)
2. Get API key from dashboard
3. Add to `.env`:
   ```
   REACT_APP_MAGNIFIC_API_KEY=sk_live_xxxxx
   ```

### Upscale Methods

```javascript
// Upscale 4K
const result = await magnific.upscaleImage(imageBlob, {
  mode: 'upscayl',
  quality: 'ultra',
  scale: 4,
  prompt: 'professional photorealistic store display'
});

// Reimagine Style
const result = await magnific.reimagineImage(imageBlob, 
  'modern minimalist with professional lighting'
);

// Wait for completion
const finalUrl = await magnific.waitForCompletion(result.jobId);
```

## 🎨 Design System

### Brand Colors
| Brand | Primary | Secondary |
|-------|---------|-----------|
| **Ecocold** | #1B3D4F (Teal) | #00C4CC (Cyan) |
| **Pasifik** | #00C4CC (Cyan) | #1B3D4F (Teal) |
| **Nokta Dizayn** | #D4006A (Magenta) | #1B3D4F (Teal) |

### Light Theme
- Background: #ffffff
- Text: #1a1a1a
- Border: #e0e0e0

### Dark Theme
- Background: #0a0a0a
- Text: #ffffff
- Border: #333333

## 📊 Status

| Feature | Status | Notes |
|---------|--------|-------|
| Light theme | ✅ Working | CSS variables system |
| Dark theme | ✅ Working | useEffect theme sync |
| 3D viewer | ✅ Working | Enhanced lighting & camera |
| Magnific AI | ✅ Ready | Requires API key |
| Export render | ✅ Ready | Canvas to PNG |
| Batch upscale | ✅ Ready | Multiple images |
| Quote reader | ✅ Ready | CSV/PDF support |

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
# Add REACT_APP_MAGNIFIC_API_KEY in Vercel dashboard
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🐛 Troubleshooting

### Black 3D screen?
- Check browser console for errors
- Ensure container has width/height
- Try hard refresh (Ctrl+Shift+R)

### Magnific not working?
- Verify API key in `.env`
- Check API key validity at [magnific.ai](https://magnific.ai)
- Ensure image format is PNG/JPG
- Check browser console for errors

### Theme not changing?
- Clear browser cache
- Check localStorage for theme preference
- Verify CSS variables are applied

## 📝 Notes

- **Portal v5.1.0** targets market layout design + executive presentation
- **Integration roadmap**: İzmir template → Freepik assets → LinkedIn automation
- **Performance**: WebGL rendering optimized, Magnific API async processing
- **Mobile**: Responsive but optimized for desktop (1920x1080+)

## 📦 Dependencies

- React 18.2 — UI framework
- Three.js r128 — 3D rendering
- Zustand 4.4 — State management
- React Router 6.20 — Navigation
- Vite 5.0 — Build tool

## 🔗 Links

- **Demo**: nd-portal.vercel.app (pending)
- **CRM**: nd-group-ai.vercel.app
- **Magnific AI**: https://magnific.ai
- **Three.js Docs**: https://threejs.org/docs

---

**Version**: v5.1.0 | **Updated**: May 1, 2026 | **Status**: 🟢 DAY 1 COMPLETE

'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Rect, Circle, Text, Group, Arc } from 'react-konva'

// ── Sabitler ────────────────────────────────────────────────────────
const MM         = 0.1   // px / mm temel ölçek
const GRID_MM    = 1000  // 1m grid
const SNAP_MM    = 100   // 100mm snap
const GRID_COUNT = 60    // 60m × 60m alan
const DOOR_SNAP_MM = 600 // kapı/pencere için duvara yakınlık eşiği

const ROOM_FILLS = [
  'rgba(0,196,204,0.10)', 'rgba(27,61,79,0.08)',
  'rgba(59,130,246,0.08)', 'rgba(245,158,11,0.08)',
  'rgba(16,185,129,0.08)',
]

// ── Araçlar (AutoCAD kısayollarıyla) ───────────────────────────────
const TOOLS = [
  { key: 'select',  label: 'Seç',     hint: 'S',       icon: '▶' },
  { key: 'duvar',   label: 'Duvar',   hint: 'L',       icon: '|' },
  { key: 'kapi',    label: 'Kapı',    hint: 'D',       icon: '⌒' },
  { key: 'pencere', label: 'Pencere', hint: 'P',       icon: '▭' },
  { key: 'kolon',   label: 'Kolon',   hint: 'C',       icon: '■' },
  { key: 'sil',     label: 'Sil',     hint: 'E',       icon: '✕' },
]

const SHORTCUTS_REF = [
  ['S / Esc', 'Seç / İptal'],
  ['L', 'Duvar çiz (Line)'],
  ['D', 'Kapı yerleştir (Door)'],
  ['P', 'Pencere yerleştir'],
  ['C', 'Kolon yerleştir'],
  ['E', 'Sil (Erase)'],
  ['Del / ⌫', 'Seçili öğeyi sil'],
  ['Shift + çiz', 'Yatay/dikey kilitle (Ortho)'],
  ['F / Z', 'Tüme sığdır'],
  ['+  /  -', 'Yakınlaştır / Uzaklaştır'],
  ['G', 'Snap ızgara aç/kapat'],
  ['Boşluk', 'Son aracı tekrar seç'],
  ['Ctrl+Z', 'Geri Al'],
  ['Ctrl+Y', 'İleri Al'],
  ['Orta tık + sürükle', 'Pan'],
]

// ── Yardımcı fonksiyonlar ───────────────────────────────────────────
function snapVal(mm, enabled) {
  return enabled ? Math.round(mm / SNAP_MM) * SNAP_MM : Math.round(mm)
}

function applyOrtho(start, current) {
  const dx = Math.abs(current[0] - start[0])
  const dy = Math.abs(current[1] - start[1])
  return dx >= dy ? [current[0], start[1]] : [start[0], current[1]]
}

function getBBox(data) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const w of (data.duvarlar ?? [])) {
    minX = Math.min(minX, w.baslangic[0], w.bitis[0])
    minY = Math.min(minY, w.baslangic[1], w.bitis[1])
    maxX = Math.max(maxX, w.baslangic[0], w.bitis[0])
    maxY = Math.max(maxY, w.baslangic[1], w.bitis[1])
  }
  for (const c of (data.kolonlar ?? [])) {
    minX = Math.min(minX, c.merkez[0]); maxX = Math.max(maxX, c.merkez[0])
    minY = Math.min(minY, c.merkez[1]); maxY = Math.max(maxY, c.merkez[1])
  }
  return minX === Infinity ? null : { minX, minY, maxX, maxY }
}

// Duvara en yakın noktayı bul
function closestOnWall(wall, pt) {
  const dx = wall.bitis[0] - wall.baslangic[0]
  const dy = wall.bitis[1] - wall.baslangic[1]
  const len2 = dx * dx + dy * dy
  if (!len2) return null
  let t = ((pt[0] - wall.baslangic[0]) * dx + (pt[1] - wall.baslangic[1]) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = wall.baslangic[0] + dx * t
  const cy = wall.baslangic[1] + dy * t
  const dist = Math.sqrt((pt[0] - cx) ** 2 + (pt[1] - cy) ** 2)
  const wallLen = Math.sqrt(len2)
  return { t, dist, wallLen, konum_mm: Math.round(t * wallLen) }
}

// ── Ana Bileşen ─────────────────────────────────────────────────────
export default function StudioCanvas({
  studioData,
  onUpdate,
  activeTool,
  setActiveTool,
  selectedEl,
  onSelectEl,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const containerRef = useRef(null)
  const stageRef     = useRef(null)
  const fitted       = useRef(false)
  const scaleRef     = useRef(1)
  const offsetRef    = useRef({ x: 40, y: 40 })
  const lastToolRef  = useRef('duvar') // Boşluk tuşu için son aktif araç

  const [size,        setSize]        = useState({ w: 800, h: 600 })
  const [scale,       setScale]       = useState(1)
  const [offset,      setOffset]      = useState({ x: 40, y: 40 })
  const [drawStart,   setDrawStart]   = useState(null)
  const [mousePos,    setMousePos]    = useState(null)
  const [mouseMm,     setMouseMm]     = useState([0, 0])
  const [shiftDown,   setShiftDown]   = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [showHelp,    setShowHelp]    = useState(false)
  const [midPan,      setMidPan]      = useState(null) // orta tık pan

  // Refs senkronizasyonu
  useEffect(() => { scaleRef.current = scale },   [scale])
  useEffect(() => { offsetRef.current = offset }, [offset])

  // ── Boyut izle ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height })
    )
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // ── Otomatik sığdır (ilk yükleme) ────────────────────────────────
  useEffect(() => {
    if (fitted.current || !size.w) return
    const bbox = getBBox(studioData)
    if (!bbox) return
    fitted.current = true
    const pad = 1500
    const cW  = (bbox.maxX - bbox.minX + pad * 2) * MM
    const cH  = (bbox.maxY - bbox.minY + pad * 2) * MM
    const s   = Math.min(size.w / cW, size.h / cH, 4) * 0.85
    const ox  = (size.w - (bbox.maxX - bbox.minX) * MM * s) / 2 - bbox.minX * MM * s
    const oy  = (size.h - (bbox.maxY - bbox.minY) * MM * s) / 2 - bbox.minY * MM * s
    setScale(s); setOffset({ x: ox, y: oy })
  }, [studioData, size])

  // ── Fit to view fonksiyonu ────────────────────────────────────────
  const fitToView = useCallback(() => {
    const bbox = getBBox(studioData)
    if (!bbox || !size.w) return
    const pad = 1500
    const cW  = (bbox.maxX - bbox.minX + pad * 2) * MM
    const cH  = (bbox.maxY - bbox.minY + pad * 2) * MM
    const s   = Math.min(size.w / cW, size.h / cH, 4) * 0.85
    const ox  = (size.w - (bbox.maxX - bbox.minX) * MM * s) / 2 - bbox.minX * MM * s
    const oy  = (size.h - (bbox.maxY - bbox.minY) * MM * s) / 2 - bbox.minY * MM * s
    setScale(s); setOffset({ x: ox, y: oy })
  }, [studioData, size])

  // ── Zoom helper ───────────────────────────────────────────────────
  const zoomAt = useCallback((factor, cx, cy) => {
    const oldScale = scaleRef.current
    const newScale = Math.min(Math.max(oldScale * factor, 0.05), 15)
    const mouseX   = (cx - offsetRef.current.x) / oldScale
    const mouseY   = (cy - offsetRef.current.y) / oldScale
    setScale(newScale)
    setOffset({ x: cx - mouseX * newScale, y: cy - mouseY * newScale })
  }, [])

  // ── Shift tuşu takibi (Ortho modu) ────────────────────────────────
  useEffect(() => {
    const down = (e) => e.key === 'Shift' && setShiftDown(true)
    const up   = (e) => e.key === 'Shift' && setShiftDown(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Orta tık pan (native event listener) ─────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let panStart = null

    function onDown(e) {
      if (e.button !== 1) return
      e.preventDefault()
      panStart = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y }
    }
    function onMove(e) {
      if (!panStart) return
      setOffset({ x: panStart.ox + e.clientX - panStart.x, y: panStart.oy + e.clientY - panStart.y })
    }
    function onUp(e) { if (e.button === 1) panStart = null }

    el.addEventListener('mousedown',  onDown)
    el.addEventListener('mousemove',  onMove)
    el.addEventListener('mouseup',    onUp)
    el.addEventListener('contextmenu', e => e.preventDefault())
    return () => {
      el.removeEventListener('mousedown',   onDown)
      el.removeEventListener('mousemove',   onMove)
      el.removeEventListener('mouseup',     onUp)
      el.removeEventListener('contextmenu', e => e.preventDefault())
    }
  }, [])

  // ── Seçili öğeyi sil ─────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selectedEl) return
    const fieldMap = { duvar: 'duvarlar', kolon: 'kolonlar', kapi: 'kapilar', pencere: 'pencereler', oda: 'odalar' }
    const field = fieldMap[selectedEl.type]
    if (field) {
      onUpdate({ ...studioData, [field]: (studioData[field] ?? []).filter(el => el.id !== selectedEl.id) })
      onSelectEl(null)
    }
  }, [selectedEl, studioData, onUpdate, onSelectEl])

  // ── Klavye kısayolları ────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl kombinasyonları
      if (ctrl && e.key === 'z') { e.preventDefault(); onUndo?.(); return }
      if (ctrl && e.key === 'y') { e.preventDefault(); onRedo?.(); return }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); onRedo?.(); return }
      if (ctrl) return

      const key = e.key.toLowerCase()

      switch (key) {
        case 'escape':
          e.preventDefault()
          setDrawStart(null); setMousePos(null)
          setActiveTool('select'); onSelectEl(null)
          break
        case 'delete': case 'backspace':
          e.preventDefault()
          deleteSelected()
          break
        case 's': case 'v':
          e.preventDefault()
          setActiveTool('select'); setDrawStart(null)
          break
        case 'l':
          e.preventDefault()
          lastToolRef.current = 'duvar'
          setActiveTool('duvar'); setDrawStart(null)
          break
        case 'd':
          e.preventDefault()
          lastToolRef.current = 'kapi'
          setActiveTool('kapi'); setDrawStart(null)
          break
        case 'p': case 'w':
          e.preventDefault()
          lastToolRef.current = 'pencere'
          setActiveTool('pencere'); setDrawStart(null)
          break
        case 'c':
          e.preventDefault()
          lastToolRef.current = 'kolon'
          setActiveTool('kolon'); setDrawStart(null)
          break
        case 'e':
          e.preventDefault()
          setActiveTool('sil'); setDrawStart(null)
          break
        case 'f': case 'z':
          e.preventDefault()
          fitToView()
          break
        case '+': case '=':
          e.preventDefault()
          zoomAt(1.2, size.w / 2, size.h / 2)
          break
        case '-': case '_':
          e.preventDefault()
          zoomAt(0.83, size.w / 2, size.h / 2)
          break
        case 'g':
          e.preventDefault()
          setSnapEnabled(v => !v)
          break
        case ' ':
          e.preventDefault()
          if (activeTool === 'select') {
            setActiveTool(lastToolRef.current)
          }
          break
        default: break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedEl, activeTool, deleteSelected, fitToView, zoomAt, size, onUndo, onRedo, onSelectEl, setActiveTool])

  // ── Pointer pozisyonu (mm, snap) ──────────────────────────────────
  function getPtrMm(applyOrthoConstraint = false) {
    const stage = stageRef.current
    if (!stage) return [0, 0]
    const ptr  = stage.getPointerPosition()
    const rawX = (ptr.x - offsetRef.current.x) / scaleRef.current / MM
    const rawY = (ptr.y - offsetRef.current.y) / scaleRef.current / MM
    let mx = snapVal(rawX, snapEnabled)
    let my = snapVal(rawY, snapEnabled)
    if (applyOrthoConstraint && shiftDown && drawStart) {
      ;[mx, my] = applyOrtho([drawStart.x, drawStart.y], [mx, my])
    }
    return [mx, my]
  }

  // ── Stage olayları ────────────────────────────────────────────────
  function handleWheel(e) {
    e.evt.preventDefault()
    const ptr   = stageRef.current.getPointerPosition()
    zoomAt(e.evt.deltaY < 0 ? 1.1 : 0.9, ptr.x, ptr.y)
  }

  function handleMouseMove() {
    const [mx, my] = getPtrMm(true)
    setMouseMm([mx, my])
    if (activeTool === 'duvar' && drawStart) setMousePos([mx, my])
    else setMousePos(null)
  }

  function handleStageClick(e) {
    if (e.target !== e.target.getStage()) return
    onSelectEl(null)
    const [mx, my] = getPtrMm(true)

    if (activeTool === 'duvar') {
      if (!drawStart) {
        setDrawStart({ x: mx, y: my })
      } else {
        const wallLen = Math.round(Math.sqrt((mx - drawStart.x) ** 2 + (my - drawStart.y) ** 2))
        if (wallLen < 50) { setDrawStart(null); return } // çok kısa duvar
        const newWall = {
          id: Date.now(),
          baslangic: [drawStart.x, drawStart.y],
          bitis: [mx, my],
          kalinlik_mm: 200, tip: 'ic',
        }
        onUpdate({ ...studioData, duvarlar: [...(studioData.duvarlar ?? []), newWall] })
        // Zincirleme: bitiş noktası yeni başlangıç olur (AutoCAD gibi)
        setDrawStart({ x: mx, y: my })
      }
      return
    }

    if (activeTool === 'kolon') {
      onUpdate({ ...studioData, kolonlar: [...(studioData.kolonlar ?? []), { id: Date.now(), merkez: [mx, my], genislik_mm: 400, derinlik_mm: 400 }] })
      return
    }

    // Kapı ve Pencere: en yakın duvara yerleştir
    if (activeTool === 'kapi' || activeTool === 'pencere') {
      let bestWall = null, bestDist = Infinity, bestKonum = 0
      for (const wall of (studioData.duvarlar ?? [])) {
        const cp = closestOnWall(wall, [mx, my])
        if (cp && cp.dist < DOOR_SNAP_MM && cp.dist < bestDist) {
          bestWall = wall; bestDist = cp.dist; bestKonum = cp.konum_mm
        }
      }
      if (!bestWall) return // duvara yakın değil
      if (activeTool === 'kapi') {
        onUpdate({ ...studioData, kapilar: [...(studioData.kapilar ?? []), { id: Date.now(), duvar_id: bestWall.id, konum_mm: bestKonum, genislik_mm: 900, yon: 'sag' }] })
      } else {
        onUpdate({ ...studioData, pencereler: [...(studioData.pencereler ?? []), { id: Date.now(), duvar_id: bestWall.id, konum_mm: bestKonum, genislik_mm: 1200, yukseklik_mm: 1100, alt_kot_mm: 900 }] })
      }
    }
  }

  function handleElementClick(type, id, e) {
    if (e?.evt) e.evt.stopPropagation()
    if (activeTool === 'sil') {
      const field = { duvar: 'duvarlar', kolon: 'kolonlar', kapi: 'kapilar', pencere: 'pencereler', oda: 'odalar' }[type]
      if (field) { onUpdate({ ...studioData, [field]: (studioData[field] ?? []).filter(el => el.id !== id) }); onSelectEl(null) }
    } else {
      onSelectEl({ type, id })
    }
  }

  function handleStageDragEnd() {
    const stage = stageRef.current
    if (stage) setOffset({ x: stage.x(), y: stage.y() })
  }

  const isSel = (type, id) => selectedEl?.type === type && selectedEl?.id === id

  // ── Grid ──────────────────────────────────────────────────────────
  const gridLines = []
  for (let i = 0; i <= GRID_COUNT; i++) {
    const pos = i * GRID_MM * MM
    const end = GRID_COUNT * GRID_MM * MM
    const maj = i % 5 === 0
    gridLines.push(
      <Line key={`gv${i}`} points={[pos, 0, pos, end]} stroke={maj ? '#C4D3DF' : '#E4EDF3'} strokeWidth={maj ? 0.5 : 0.3} listening={false} />,
      <Line key={`gh${i}`} points={[0, pos, end, pos]} stroke={maj ? '#C4D3DF' : '#E4EDF3'} strokeWidth={maj ? 0.5 : 0.3} listening={false} />,
    )
  }

  // ── Preview duvar uzunluğu ────────────────────────────────────────
  const previewLen = drawStart && mousePos
    ? Math.round(Math.sqrt((mousePos[0] - drawStart.x) ** 2 + (mousePos[1] - drawStart.y) ** 2))
    : 0

  // ── Kursor tipi ───────────────────────────────────────────────────
  const cursorClass = activeTool === 'select' ? 'cursor-default' : activeTool === 'sil' ? 'cursor-crosshair' : 'cursor-crosshair'

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Araç Çubuğu ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-white border-b flex-shrink-0" style={{ borderColor: 'var(--portal-border)' }}>

        {/* Araçlar */}
        <div className="flex items-center gap-0.5 mr-2">
          {TOOLS.map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTool(t.key); setDrawStart(null); setMousePos(null); if (t.key !== 'sil' && t.key !== 'select') lastToolRef.current = t.key }}
              title={`${t.label}  [${t.hint}]`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTool === t.key
                  ? 'bg-[#1B3D4F] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-[9px] px-1 py-0.5 rounded font-mono ${activeTool === t.key ? 'bg-white/20 text-white/70' : 'bg-slate-100 text-slate-400'}`}>{t.hint}</span>
            </button>
          ))}
        </div>

        {/* Ayırıcı */}
        <div className="h-5 w-px bg-slate-200 mx-1 flex-shrink-0" />

        {/* Geri Al / İleri Al */}
        <button
          onClick={onUndo} disabled={!canUndo} title="Geri Al  [Ctrl+Z]"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          <span className="text-[9px] px-1 py-0.5 rounded font-mono bg-slate-100 text-slate-400">Ctrl+Z</span>
        </button>
        <button
          onClick={onRedo} disabled={!canRedo} title="İleri Al  [Ctrl+Y]"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
          <span className="text-[9px] px-1 py-0.5 rounded font-mono bg-slate-100 text-slate-400">Ctrl+Y</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 flex-shrink-0" />

        {/* Snap toggle */}
        <button onClick={() => setSnapEnabled(v => !v)} title="Snap ızgara aç/kapat  [G]"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${snapEnabled ? 'bg-[#E0FAF9] text-[#00C4CC]' : 'text-slate-400 hover:bg-slate-100'}`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[9px]">Snap</span>
        </button>

        {/* Fit */}
        <button onClick={fitToView} title="Tüme sığdır  [F]"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="text-[9px]">Sığdır</span>
        </button>

        {/* Ortho göstergesi */}
        {shiftDown && activeTool === 'duvar' && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-semibold">
            ORTHO
          </div>
        )}

        {/* Durum mesajı */}
        <div className="flex-1 text-center text-xs text-slate-400">
          {activeTool === 'duvar'   && !drawStart && 'Duvarın başlangıç noktasına tıklayın'}
          {activeTool === 'duvar'   &&  drawStart && <span className="text-[#00C4CC] font-medium">Bitiş noktası • Shift = Ortho • Esc = İptal</span>}
          {activeTool === 'kapi'    && 'Kapı yerleştirmek için duvara tıklayın (600mm içinde)'}
          {activeTool === 'pencere' && 'Pencere yerleştirmek için duvara tıklayın (600mm içinde)'}
          {activeTool === 'kolon'   && 'Kolon yerleştirmek için tıklayın'}
          {activeTool === 'sil'     && 'Silmek için öğeye tıklayın  •  Del = Seçili sil'}
          {activeTool === 'select'  && selectedEl && <span className="text-slate-600">Seçili: <strong>{selectedEl.type}</strong> #{selectedEl.id}  •  Del = Sil</span>}
        </div>

        {/* Kısayol yardımı */}
        <div className="relative">
          <button onClick={() => setShowHelp(v => !v)}
            className={`w-6 h-6 rounded-full text-xs font-bold transition-colors ${showHelp ? 'bg-[#1B3D4F] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            ?
          </button>
          {showHelp && (
            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-2xl border p-4 w-72" style={{ borderColor: 'var(--portal-border)' }}>
              <p className="text-xs font-bold text-slate-700 mb-3">Klavye Kısayolları</p>
              <table className="w-full text-xs">
                <tbody>
                  {SHORTCUTS_REF.map(([key, desc]) => (
                    <tr key={key} className="border-b last:border-0" style={{ borderColor: 'var(--portal-border)' }}>
                      <td className="py-1.5 pr-3 font-mono text-[10px] bg-slate-50 rounded px-2 whitespace-nowrap text-slate-600">{key}</td>
                      <td className="py-1.5 pl-2 text-slate-500">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Canvas alanı ─────────────────────────────────────────── */}
      <div ref={containerRef} className={`flex-1 overflow-hidden relative select-none ${cursorClass}`}>
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={scale}
          scaleY={scale}
          x={offset.x}
          y={offset.y}
          draggable={activeTool === 'select'}
          onDragEnd={handleStageDragEnd}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
        >
          {/* Grid */}
          <Layer listening={false}>{gridLines}</Layer>

          {/* İçerik */}
          <Layer>
            {/* Odalar */}
            {(studioData.odalar ?? []).map((room, ri) => {
              if (!room.polygon?.length) return null
              const pts = room.polygon.flatMap(([x, y]) => [x * MM, y * MM])
              const cx  = room.polygon.reduce((s, [x]) => s + x, 0) / room.polygon.length * MM
              const cy  = room.polygon.reduce((s, [, y]) => s + y, 0) / room.polygon.length * MM
              const sel = isSel('oda', room.id)
              return (
                <Group key={`oda-${room.id}`} onClick={(e) => handleElementClick('oda', room.id, e)}>
                  <Line points={pts} closed fill={ROOM_FILLS[ri % ROOM_FILLS.length]} stroke={sel ? '#00C4CC' : 'rgba(0,0,0,0.08)'} strokeWidth={sel ? 1.5 : 0.5} />
                  <Text x={cx - 40} y={cy - 10} text={room.ad} fontSize={10} fill="#1B3D4F" align="center" width={80} fontStyle="bold" />
                  <Text x={cx - 40} y={cy + 3}  text={`${room.alan_m2}m²`} fontSize={9} fill="#64748B" align="center" width={80} />
                </Group>
              )
            })}

            {/* Pencereler */}
            {(studioData.pencereler ?? []).map((win) => {
              const wall = (studioData.duvarlar ?? []).find(w => w.id === win.duvar_id)
              if (!wall) return null
              const dx  = wall.bitis[0] - wall.baslangic[0]
              const dy  = wall.bitis[1] - wall.baslangic[1]
              const len = Math.sqrt(dx * dx + dy * dy)
              if (!len) return null
              const t0  = win.konum_mm / len
              const t1  = (win.konum_mm + win.genislik_mm) / len
              const sel = isSel('pencere', win.id)
              return (
                <Line key={`win-${win.id}`}
                  points={[
                    (wall.baslangic[0] + dx * t0) * MM, (wall.baslangic[1] + dy * t0) * MM,
                    (wall.baslangic[0] + dx * t1) * MM, (wall.baslangic[1] + dy * t1) * MM,
                  ]}
                  stroke={sel ? '#2563EB' : '#93C5FD'}
                  strokeWidth={sel ? 8 : 6}
                  hitStrokeWidth={14}
                  onClick={(e) => handleElementClick('pencere', win.id, e)}
                />
              )
            })}

            {/* Duvarlar */}
            {(studioData.duvarlar ?? []).map((wall) => {
              const sel = isSel('duvar', wall.id)
              const sw  = Math.max(wall.kalinlik_mm * MM, 2)
              return (
                <Line key={`duvar-${wall.id}`}
                  points={[wall.baslangic[0] * MM, wall.baslangic[1] * MM, wall.bitis[0] * MM, wall.bitis[1] * MM]}
                  stroke={sel ? '#00C4CC' : '#1B3D4F'}
                  strokeWidth={sw}
                  lineCap="square"
                  hitStrokeWidth={Math.max(sw, 12)}
                  onClick={(e) => handleElementClick('duvar', wall.id, e)}
                />
              )
            })}

            {/* Kapılar */}
            {(studioData.kapilar ?? []).map((door) => {
              const wall = (studioData.duvarlar ?? []).find(w => w.id === door.duvar_id)
              if (!wall) return null
              const dx   = wall.bitis[0] - wall.baslangic[0]
              const dy   = wall.bitis[1] - wall.baslangic[1]
              const len  = Math.sqrt(dx * dx + dy * dy)
              if (!len) return null
              const t    = door.konum_mm / len
              const px   = (wall.baslangic[0] + dx * t) * MM
              const py   = (wall.baslangic[1] + dy * t) * MM
              const ang  = Math.atan2(dy, dx) * 180 / Math.PI
              const sel  = isSel('kapi', door.id)
              return (
                <Group key={`kapi-${door.id}`} onClick={(e) => handleElementClick('kapi', door.id, e)}>
                  <Arc x={px} y={py} innerRadius={0} outerRadius={door.genislik_mm * MM}
                    angle={90} rotation={ang}
                    fill="rgba(0,196,204,0.12)" stroke={sel ? '#00C4CC' : '#00C4CC'} strokeWidth={1} opacity={0.85} />
                  <Line
                    points={[px, py,
                      px + Math.cos((ang + 90) * Math.PI / 180) * door.genislik_mm * MM,
                      py + Math.sin((ang + 90) * Math.PI / 180) * door.genislik_mm * MM]}
                    stroke={sel ? '#00C4CC' : '#0099A8'} strokeWidth={sel ? 2 : 1.5}
                  />
                </Group>
              )
            })}

            {/* Kolonlar */}
            {(studioData.kolonlar ?? []).map((col) => {
              const sel = isSel('kolon', col.id)
              return (
                <Rect key={`kolon-${col.id}`}
                  x={(col.merkez[0] - col.genislik_mm / 2) * MM}
                  y={(col.merkez[1] - col.derinlik_mm / 2) * MM}
                  width={col.genislik_mm * MM} height={col.derinlik_mm * MM}
                  fill={sel ? '#CCF5F5' : '#CBD5E1'}
                  stroke={sel ? '#00C4CC' : '#475569'} strokeWidth={sel ? 2 : 1}
                  onClick={(e) => handleElementClick('kolon', col.id, e)}
                />
              )
            })}

            {/* Ölçü etiketleri */}
            {(studioData.olcu_etiketleri ?? []).map((lbl, i) => (
              <Text key={`lbl-${i}`}
                x={lbl.konum[0] * MM} y={lbl.konum[1] * MM}
                text={`${(lbl.deger_mm / 1000).toFixed(2)}m`}
                fontSize={10} fill="#64748B"
                rotation={lbl.yon === 'dikey' ? -90 : 0}
              />
            ))}

            {/* Çizim önizleme: duvar */}
            {activeTool === 'duvar' && drawStart && mousePos && (() => {
              const midX = (drawStart.x + mousePos[0]) / 2 * MM
              const midY = (drawStart.y + mousePos[1]) / 2 * MM
              const labelTxt = previewLen >= 1000
                ? `${(previewLen / 1000).toFixed(2)}m`
                : `${previewLen}mm`
              const lw = Math.max(labelTxt.length * 6.5, 48)
              return (
                <Group>
                  {/* Kesik çizgi */}
                  <Line
                    points={[drawStart.x * MM, drawStart.y * MM, mousePos[0] * MM, mousePos[1] * MM]}
                    stroke="#00C4CC" strokeWidth={2} dash={[8, 4]}
                  />
                  {/* Başlangıç noktası */}
                  <Circle x={drawStart.x * MM} y={drawStart.y * MM} radius={5} fill="#00C4CC" opacity={0.9} />
                  {/* Uzunluk etiketi */}
                  <Group x={midX - lw / 2} y={midY - 9}>
                    <Rect width={lw} height={17} fill="#1B3D4F" cornerRadius={4} />
                    <Text width={lw} height={17} text={labelTxt} fontSize={10} fill="white" align="center" verticalAlign="middle" />
                  </Group>
                </Group>
              )
            })()}

            {/* Kapı/Pencere önizleme: duvara yakınsa yeşil nokta göster */}
            {(activeTool === 'kapi' || activeTool === 'pencere') && (() => {
              let bestWall = null, bestDist = Infinity, bestPx = 0, bestPy = 0
              for (const wall of (studioData.duvarlar ?? [])) {
                const cp = closestOnWall(wall, mouseMm)
                if (cp && cp.dist < DOOR_SNAP_MM && cp.dist < bestDist) {
                  bestDist = cp.dist
                  const dx = wall.bitis[0] - wall.baslangic[0]
                  const dy = wall.bitis[1] - wall.baslangic[1]
                  bestPx = (wall.baslangic[0] + dx * cp.t) * MM
                  bestPy = (wall.baslangic[1] + dy * cp.t) * MM
                }
              }
              if (!bestWall && bestDist === Infinity) return null
              if (bestDist >= DOOR_SNAP_MM) return null
              return (
                <Circle x={bestPx} y={bestPy} radius={6}
                  fill={activeTool === 'kapi' ? '#00C4CC' : '#3B82F6'} opacity={0.8} />
              )
            })()}
          </Layer>
        </Stage>

        {/* ── Sağ alt bilgi: koordinat + zoom ─────────────────────── */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-500 shadow-sm" style={{ borderColor: 'var(--portal-border)' }}>
            X: {mouseMm[0]} &nbsp; Y: {mouseMm[1]}
          </div>
          <div className="bg-white/90 backdrop-blur-sm border rounded-lg px-2.5 py-1 text-[10px] text-slate-500 shadow-sm" style={{ borderColor: 'var(--portal-border)' }}>
            {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Sol alt: ölçek çubuğu */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm border rounded-lg px-2 py-1 shadow-sm" style={{ borderColor: 'var(--portal-border)' }}>
            <div className="flex items-end gap-1 mb-0.5">
              <div className="border-l border-b border-r border-slate-400" style={{ width: `${1000 * MM * scale}px`, height: 4 }} />
            </div>
            <p className="text-[9px] text-slate-400">1m</p>
          </div>
        </div>

        {/* Boş durum */}
        {!(studioData.duvarlar?.length) && !(studioData.kolonlar?.length) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-30">📐</div>
              <p className="text-slate-300 text-sm font-medium">Çizim yok — Vision analizi çalıştırın veya</p>
              <p className="text-slate-300 text-sm"><kbd className="font-mono bg-slate-100 rounded px-1">L</kbd> tuşuyla duvar çizmeye başlayın</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Rect, Circle, Text, Group, Arc } from 'react-konva'

const MM = 0.1 // px per mm (base scale, stage zoom applied on top)
const GRID_MM = 1000 // 1m grid
const SNAP_MM = 100  // 100mm snap
const GRID_COUNT = 60 // 60m grid total

const TOOL_LABELS = {
  select:  'Seç',
  duvar:   'Duvar',
  kolon:   'Kolon',
  kapi:    'Kapı',
  pencere: 'Pencere',
  sil:     'Sil',
}

const ROOM_FILLS = [
  'rgba(0,196,204,0.10)',
  'rgba(27,61,79,0.08)',
  'rgba(59,130,246,0.08)',
  'rgba(245,158,11,0.08)',
  'rgba(16,185,129,0.08)',
]

function snap(mm) {
  return Math.round(mm / SNAP_MM) * SNAP_MM
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
  if (minX === Infinity) return null
  return { minX, minY, maxX, maxY }
}

export default function StudioCanvas({ studioData, onUpdate, activeTool, setActiveTool, selectedEl, onSelectEl }) {
  const containerRef = useRef(null)
  const stageRef     = useRef(null)
  const [size, setSize]       = useState({ w: 800, h: 600 })
  const [scale, setScale]     = useState(1)
  const [offset, setOffset]   = useState({ x: 40, y: 40 })
  const [drawStart, setDrawStart]   = useState(null)  // { x, y } in mm — wall drawing
  const [mousePos, setMousePos]     = useState(null)  // current mm position for preview
  const fitted = useRef(false)

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Auto-fit on first data load
  useEffect(() => {
    if (fitted.current || !size.w) return
    const bbox = getBBox(studioData)
    if (!bbox) return
    fitted.current = true
    const pad = 1500 // mm padding
    const contentW = (bbox.maxX - bbox.minX + pad * 2) * MM
    const contentH = (bbox.maxY - bbox.minY + pad * 2) * MM
    const fitScale = Math.min(size.w / contentW, size.h / contentH, 3) * 0.85
    setScale(fitScale)
    setOffset({
      x: (size.w - (bbox.maxX - bbox.minX) * MM * fitScale) / 2 - bbox.minX * MM * fitScale,
      y: (size.h - (bbox.maxY - bbox.minY) * MM * fitScale) / 2 - bbox.minY * MM * fitScale,
    })
  }, [studioData, size])

  // Wheel zoom
  function handleWheel(e) {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldScale = scale
    const pointer  = stage.getPointerPosition()
    const factor   = e.evt.deltaY < 0 ? 1.1 : 0.9
    const newScale = Math.min(Math.max(oldScale * factor, 0.05), 10)
    const mouseX   = (pointer.x - offset.x) / oldScale
    const mouseY   = (pointer.y - offset.y) / oldScale
    setScale(newScale)
    setOffset({ x: pointer.x - mouseX * newScale, y: pointer.y - mouseY * newScale })
  }

  // Pointer position in mm (snapped)
  function getPtrMm() {
    const stage = stageRef.current
    if (!stage) return [0, 0]
    const ptr = stage.getPointerPosition()
    const rawX = (ptr.x - offset.x) / scale / MM
    const rawY = (ptr.y - offset.y) / scale / MM
    return [snap(rawX), snap(rawY)]
  }

  function handleMouseMove() {
    if (activeTool === 'duvar' && drawStart) {
      setMousePos(getPtrMm())
    }
  }

  function handleStageClick(e) {
    // Only react to Stage background clicks for tools
    if (e.target !== e.target.getStage()) return
    onSelectEl(null)

    const [mx, my] = getPtrMm()

    if (activeTool === 'duvar') {
      if (!drawStart) {
        setDrawStart({ x: mx, y: my })
      } else {
        // Create wall
        const newWall = {
          id: Date.now(),
          baslangic: [drawStart.x, drawStart.y],
          bitis: [mx, my],
          kalinlik_mm: 200,
          tip: 'ic',
        }
        onUpdate({ ...studioData, duvarlar: [...(studioData.duvarlar ?? []), newWall] })
        setDrawStart(null)
        setMousePos(null)
      }
    } else if (activeTool === 'kolon') {
      const newCol = {
        id: Date.now(),
        merkez: [mx, my],
        genislik_mm: 400,
        derinlik_mm: 400,
      }
      onUpdate({ ...studioData, kolonlar: [...(studioData.kolonlar ?? []), newCol] })
    }
  }

  function handleElementClick(type, id, e) {
    e?.cancelBubble && (e.cancelBubble = true)
    if (e?.evt) e.evt.stopPropagation()
    if (activeTool === 'sil') {
      const fieldMap = { duvar: 'duvarlar', kolon: 'kolonlar', kapi: 'kapilar', pencere: 'pencereler', oda: 'odalar' }
      const field = fieldMap[type]
      if (field) {
        onUpdate({ ...studioData, [field]: (studioData[field] ?? []).filter(el => el.id !== id) })
        onSelectEl(null)
      }
    } else {
      onSelectEl({ type, id })
    }
  }

  function handleStageDragEnd(e) {
    const stage = stageRef.current
    if (!stage) return
    setOffset({ x: stage.x(), y: stage.y() })
  }

  const isSelected = useCallback((type, id) => selectedEl?.type === type && selectedEl?.id === id, [selectedEl])

  // Grid lines
  const gridLines = []
  for (let i = 0; i <= GRID_COUNT; i++) {
    const pos = i * GRID_MM * MM
    const end = GRID_COUNT * GRID_MM * MM
    const isMajor = i % 5 === 0
    gridLines.push(
      <Line key={`gv${i}`} points={[pos, 0, pos, end]} stroke={isMajor ? '#C8D5E0' : '#E8EFF4'} strokeWidth={isMajor ? 0.5 : 0.3} />,
      <Line key={`gh${i}`} points={[0, pos, end, pos]} stroke={isMajor ? '#C8D5E0' : '#E8EFF4'} strokeWidth={isMajor ? 0.5 : 0.3} />,
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b flex-shrink-0" style={{ borderColor: 'var(--portal-border)' }}>
        {Object.entries(TOOL_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setActiveTool(key); setDrawStart(null); setMousePos(null) }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === key
                ? 'bg-[#1B3D4F] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          {activeTool === 'duvar' && drawStart && (
            <span className="text-[#00C4CC] font-medium">Bitiş noktasına tıklayın</span>
          )}
          {activeTool === 'duvar' && !drawStart && (
            <span>Başlangıç noktasına tıklayın</span>
          )}
          {activeTool === 'kolon' && <span>Kolon yerleştirmek için tıklayın</span>}
          {activeTool === 'sil' && <span>Silmek için öğeye tıklayın</span>}
          <span className="ml-2 text-slate-300">Zoom: kaydırma tekerleği · Pan: sürükle</span>
        </div>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative cursor-crosshair">
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
          {/* Grid layer */}
          <Layer listening={false}>
            {gridLines}
          </Layer>

          {/* Content layer */}
          <Layer>
            {/* Rooms (below walls) */}
            {(studioData.odalar ?? []).map((room, ri) => {
              if (!room.polygon?.length) return null
              const pts = room.polygon.flatMap(([x, y]) => [x * MM, y * MM])
              const cx = room.polygon.reduce((s, [x]) => s + x, 0) / room.polygon.length * MM
              const cy = room.polygon.reduce((s, [, y]) => s + y, 0) / room.polygon.length * MM
              const sel = isSelected('oda', room.id)
              return (
                <Group key={`oda-${room.id}`} onClick={(e) => handleElementClick('oda', room.id, e)}>
                  <Line points={pts} closed fill={ROOM_FILLS[ri % ROOM_FILLS.length]} stroke={sel ? '#00C4CC' : 'rgba(0,0,0,0.08)'} strokeWidth={sel ? 1.5 : 0.5} />
                  <Text x={cx - 40} y={cy - 10} text={room.ad} fontSize={10} fill="#1B3D4F" align="center" width={80} fontStyle="bold" />
                  <Text x={cx - 40} y={cy + 2} text={`${room.alan_m2}m²`} fontSize={9} fill="#64748B" align="center" width={80} />
                </Group>
              )
            })}

            {/* Windows */}
            {(studioData.pencereler ?? []).map((win) => {
              const wall = (studioData.duvarlar ?? []).find(w => w.id === win.duvar_id)
              if (!wall) return null
              const dx = wall.bitis[0] - wall.baslangic[0]
              const dy = wall.bitis[1] - wall.baslangic[1]
              const len = Math.sqrt(dx * dx + dy * dy)
              if (!len) return null
              const t0 = win.konum_mm / len
              const t1 = (win.konum_mm + win.genislik_mm) / len
              const sel = isSelected('pencere', win.id)
              return (
                <Line key={`win-${win.id}`}
                  points={[
                    (wall.baslangic[0] + dx * t0) * MM, (wall.baslangic[1] + dy * t0) * MM,
                    (wall.baslangic[0] + dx * t1) * MM, (wall.baslangic[1] + dy * t1) * MM,
                  ]}
                  stroke={sel ? '#2563EB' : '#60A5FA'}
                  strokeWidth={6}
                  hitStrokeWidth={12}
                  onClick={(e) => handleElementClick('pencere', win.id, e)}
                />
              )
            })}

            {/* Walls */}
            {(studioData.duvarlar ?? []).map((wall) => {
              const sel = isSelected('duvar', wall.id)
              const sw = Math.max(wall.kalinlik_mm * MM, 2)
              return (
                <Line key={`duvar-${wall.id}`}
                  points={[wall.baslangic[0] * MM, wall.baslangic[1] * MM, wall.bitis[0] * MM, wall.bitis[1] * MM]}
                  stroke={sel ? '#00C4CC' : '#1B3D4F'}
                  strokeWidth={sw}
                  lineCap="square"
                  hitStrokeWidth={Math.max(sw, 10)}
                  onClick={(e) => handleElementClick('duvar', wall.id, e)}
                />
              )
            })}

            {/* Doors */}
            {(studioData.kapilar ?? []).map((door) => {
              const wall = (studioData.duvarlar ?? []).find(w => w.id === door.duvar_id)
              if (!wall) return null
              const dx = wall.bitis[0] - wall.baslangic[0]
              const dy = wall.bitis[1] - wall.baslangic[1]
              const len = Math.sqrt(dx * dx + dy * dy)
              if (!len) return null
              const t = door.konum_mm / len
              const px = (wall.baslangic[0] + dx * t) * MM
              const py = (wall.baslangic[1] + dy * t) * MM
              const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI
              const sel = isSelected('kapi', door.id)
              return (
                <Group key={`kapi-${door.id}`} onClick={(e) => handleElementClick('kapi', door.id, e)}>
                  <Arc
                    x={px} y={py}
                    innerRadius={0}
                    outerRadius={door.genislik_mm * MM}
                    angle={90}
                    rotation={angleDeg}
                    fill="rgba(0,196,204,0.12)"
                    stroke={sel ? '#00C4CC' : '#00C4CC'}
                    strokeWidth={1}
                    opacity={0.8}
                  />
                  <Line
                    points={[px, py, px + Math.cos((angleDeg + 90) * Math.PI / 180) * door.genislik_mm * MM, py + Math.sin((angleDeg + 90) * Math.PI / 180) * door.genislik_mm * MM]}
                    stroke={sel ? '#00C4CC' : '#0099A8'}
                    strokeWidth={1}
                  />
                </Group>
              )
            })}

            {/* Columns */}
            {(studioData.kolonlar ?? []).map((col) => {
              const sel = isSelected('kolon', col.id)
              const x = (col.merkez[0] - col.genislik_mm / 2) * MM
              const y = (col.merkez[1] - col.derinlik_mm / 2) * MM
              return (
                <Rect key={`kolon-${col.id}`}
                  x={x} y={y}
                  width={col.genislik_mm * MM}
                  height={col.derinlik_mm * MM}
                  fill={sel ? '#E0FAF9' : '#CBD5E1'}
                  stroke={sel ? '#00C4CC' : '#475569'}
                  strokeWidth={sel ? 2 : 1}
                  onClick={(e) => handleElementClick('kolon', col.id, e)}
                />
              )
            })}

            {/* Dimension labels */}
            {(studioData.olcu_etiketleri ?? []).map((lbl, i) => (
              <Text key={`lbl-${i}`}
                x={lbl.konum[0] * MM}
                y={lbl.konum[1] * MM}
                text={`${(lbl.deger_mm / 1000).toFixed(2)}m`}
                fontSize={10}
                fill="#64748B"
                rotation={lbl.yon === 'dikey' ? -90 : 0}
              />
            ))}

            {/* Wall drawing preview line */}
            {activeTool === 'duvar' && drawStart && mousePos && (
              <Line
                points={[drawStart.x * MM, drawStart.y * MM, mousePos[0] * MM, mousePos[1] * MM]}
                stroke="#00C4CC"
                strokeWidth={2}
                dash={[8, 4]}
              />
            )}
            {/* Start point indicator */}
            {activeTool === 'duvar' && drawStart && (
              <Circle x={drawStart.x * MM} y={drawStart.y * MM} radius={5} fill="#00C4CC" opacity={0.8} />
            )}
          </Layer>
        </Stage>

        {/* Scale indicator */}
        <div className="absolute bottom-4 left-4 flex items-end gap-2 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-slate-500 border" style={{ borderColor: 'var(--portal-border)' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <div className="h-px bg-slate-400" style={{ width: `${1000 * MM * scale}px` }} />
            </div>
            1m
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-slate-500 border" style={{ borderColor: 'var(--portal-border)' }}>
            {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Empty state */}
        {!(studioData.duvarlar?.length) && !(studioData.kolonlar?.length) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-3">📐</div>
              <p className="text-slate-400 text-sm font-medium">Henüz çizim verisi yok</p>
              <p className="text-slate-300 text-xs mt-1">Vision analizi çalıştırın veya Duvar aracıyla başlayın</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

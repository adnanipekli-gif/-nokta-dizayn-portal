'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

const CanvasPanel = dynamic(() => import('./studio-canvas'), { ssr: false })

// ── Varsayılan stüdyo verisi ────────────────────────────────────────
function defaultStudio(ai = {}) {
  return {
    rolove_tipi:      ai.rolove_tipi      ?? 'bilinmiyor',
    olcek:            ai.olcek            ?? 'bilinmiyor',
    birim:            'mm',
    duvarlar:         ai.duvarlar         ?? [],
    kapilar:          ai.kapilar          ?? [],
    pencereler:       ai.pencereler       ?? [],
    odalar:           ai.odalar           ?? [],
    kolonlar:         ai.kolonlar         ?? [],
    olcu_etiketleri:  ai.olcu_etiketleri  ?? [],
    guven_skoru:      ai.guven_skoru      ?? 0,
    okunamayan_alanlar: ai.okunamayan_alanlar ?? [],
    notlar:           ai.notlar           ?? '',
    proje_meta: ai.proje_meta ?? {
      magaza_tipi: 'diger',
      tavan_yuksekligi_mm: null,
      zemin_tipi: null,
      cephe_yonleri: { kuzey: false, guney: false, dogu: false, bati: false },
      hedef_alan_m2: null,
      ozel_kisitlar: [],
    },
    tesisat: ai.tesisat ?? {
      elektrik: { mevcut: false, guc_kva: null, faz: null,      pano_yeri: null },
      su:       { mevcut: false, giris_yeri: null, basinc_bar: null },
      atik_su:  { mevcut: false, konum: null },
      hvac:     { mevcut: false, tip: null },
      dogalgaz: { mevcut: false, hat_yeri: null },
    },
    mevcut_ekipman:       ai.mevcut_ekipman       ?? [],
    notlar_liste:         ai.notlar_liste         ?? [],
    referans_fotograflar: ai.referans_fotograflar ?? [],
  }
}

// ── Yardımcı bileşenler ─────────────────────────────────────────────
function ConfBar({ score }) {
  const pct   = Math.round((score ?? 0) * 100)
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  )
}

function SaveStatus({ status }) {
  if (status === 'saving')  return <span className="text-xs text-slate-400 animate-pulse">Kaydediliyor…</span>
  if (status === 'unsaved') return <span className="text-xs text-amber-500">● Kaydedilmedi</span>
  if (status === 'error')   return <span className="text-xs text-red-500">Kayıt hatası</span>
  return <span className="text-xs text-green-600">✓ Kaydedildi</span>
}

// ── Sağ panel sekmeleri ─────────────────────────────────────────────
const RIGHT_TABS = [
  { key: 'yapisal',    label: 'Yapısal' },
  { key: 'meta',       label: 'Meta' },
  { key: 'tesisat',    label: 'Tesisat' },
  { key: 'notlar',     label: 'Notlar' },
  { key: 'fotograflar', label: 'Fotoğraf' },
  { key: 'ai',         label: 'AI' },
]

// ── Yapısal sekme: tablolar ─────────────────────────────────────────
function YapisalTab({ data, onChange, selectedEl }) {
  function editRow(field, id, key, val) {
    onChange({ ...data, [field]: (data[field] ?? []).map(r => r.id === id ? { ...r, [key]: val } : r) })
  }
  function delRow(field, id) {
    onChange({ ...data, [field]: (data[field] ?? []).filter(r => r.id !== id) })
  }

  const CellInput = ({ val, onSave, type = 'text', small }) => {
    const [v, setV] = useState(String(val ?? ''))
    return (
      <input
        className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-[#00C4CC] rounded px-1 py-0.5 text-xs text-slate-700 ${small ? '' : ''}`}
        value={v}
        onChange={e => setV(e.target.value)}
        onBlur={() => onSave(type === 'number' ? parseFloat(v) || 0 : v)}
        type={type}
      />
    )
  }

  const TipSel = ({ val, opts, onSave }) => (
    <select
      className="w-full bg-transparent text-xs text-slate-700 border-0 focus:ring-1 focus:ring-[#00C4CC] rounded px-1 py-0.5"
      value={val}
      onChange={e => onSave(e.target.value)}
    >
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )

  const Section = ({ title, rows, addNew, children }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <button onClick={addNew} className="text-[10px] px-2 py-0.5 rounded text-[#00C4CC] hover:bg-[#E0FAF9]">+ Ekle</button>
      </div>
      <div className="border rounded-lg overflow-hidden text-xs" style={{ borderColor: 'var(--portal-border)' }}>
        {rows.length === 0 ? (
          <p className="px-3 py-2 text-slate-300 italic">Kayıt yok</p>
        ) : children}
      </div>
    </div>
  )

  // Duvarlar
  const addWall = () => onChange({ ...data, duvarlar: [...(data.duvarlar ?? []), { id: Date.now(), baslangic: [0, 0], bitis: [1000, 0], kalinlik_mm: 200, tip: 'ic' }] })
  const addKapi = () => onChange({ ...data, kapilar: [...(data.kapilar ?? []), { id: Date.now(), duvar_id: (data.duvarlar?.[0]?.id ?? 0), konum_mm: 500, genislik_mm: 900, yon: 'sag' }] })
  const addPencere = () => onChange({ ...data, pencereler: [...(data.pencereler ?? []), { id: Date.now(), duvar_id: (data.duvarlar?.[0]?.id ?? 0), konum_mm: 500, genislik_mm: 1200, yukseklik_mm: 1100, alt_kot_mm: 900 }] })
  const addKolon = () => onChange({ ...data, kolonlar: [...(data.kolonlar ?? []), { id: Date.now(), merkez: [2000, 2000], genislik_mm: 400, derinlik_mm: 400 }] })

  return (
    <div className="p-3 overflow-y-auto flex-1">
      {/* Duvarlar */}
      <Section title={`Duvarlar (${data.duvarlar?.length ?? 0})`} rows={data.duvarlar ?? []} addNew={addWall}>
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {['ID', 'Baş [x,y]', 'Bitiş [x,y]', 'Kalınlık', 'Tip', ''].map(h => (
                <th key={h} className="px-1 py-1 text-left text-[10px] text-slate-400 font-medium border-b" style={{ borderColor: 'var(--portal-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.duvarlar ?? []).map((w, i) => {
              const hl = selectedEl?.type === 'duvar' && selectedEl?.id === w.id
              return (
                <tr key={w.id} className={hl ? 'bg-[#E0FAF9]' : i % 2 ? 'bg-slate-50/50' : ''}>
                  <td className="px-1 py-0.5 text-slate-400">{w.id}</td>
                  <td className="px-1 py-0.5">
                    <div className="flex gap-0.5">
                      <CellInput val={w.baslangic[0]} type="number" onSave={v => editRow('duvarlar', w.id, 'baslangic', [v, w.baslangic[1]])} />
                      <CellInput val={w.baslangic[1]} type="number" onSave={v => editRow('duvarlar', w.id, 'baslangic', [w.baslangic[0], v])} />
                    </div>
                  </td>
                  <td className="px-1 py-0.5">
                    <div className="flex gap-0.5">
                      <CellInput val={w.bitis[0]} type="number" onSave={v => editRow('duvarlar', w.id, 'bitis', [v, w.bitis[1]])} />
                      <CellInput val={w.bitis[1]} type="number" onSave={v => editRow('duvarlar', w.id, 'bitis', [w.bitis[0], v])} />
                    </div>
                  </td>
                  <td className="px-1 py-0.5 w-14"><CellInput val={w.kalinlik_mm} type="number" onSave={v => editRow('duvarlar', w.id, 'kalinlik_mm', v)} /></td>
                  <td className="px-1 py-0.5 w-16">
                    <TipSel val={w.tip} opts={[{v:'dis',l:'Dış'},{v:'ic',l:'İç'},{v:'bolme',l:'Bölme'}]} onSave={v => editRow('duvarlar', w.id, 'tip', v)} />
                  </td>
                  <td className="px-1 py-0.5">
                    <button onClick={() => delRow('duvarlar', w.id)} className="text-slate-300 hover:text-red-400 px-1">✕</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Section>

      {/* Kapılar */}
      <Section title={`Kapılar (${data.kapilar?.length ?? 0})`} rows={data.kapilar ?? []} addNew={addKapi}>
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {['Duvar', 'Konum', 'Genişlik', 'Yön', ''].map(h => (
                <th key={h} className="px-1 py-1 text-left text-[10px] text-slate-400 font-medium border-b" style={{ borderColor: 'var(--portal-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.kapilar ?? []).map((k, i) => (
              <tr key={k.id} className={i % 2 ? 'bg-slate-50/50' : ''}>
                <td className="px-1 py-0.5"><CellInput val={k.duvar_id} type="number" onSave={v => editRow('kapilar', k.id, 'duvar_id', v)} /></td>
                <td className="px-1 py-0.5"><CellInput val={k.konum_mm} type="number" onSave={v => editRow('kapilar', k.id, 'konum_mm', v)} /></td>
                <td className="px-1 py-0.5"><CellInput val={k.genislik_mm} type="number" onSave={v => editRow('kapilar', k.id, 'genislik_mm', v)} /></td>
                <td className="px-1 py-0.5">
                  <TipSel val={k.yon} opts={[{v:'sag',l:'Sağ'},{v:'sol',l:'Sol'},{v:'iki_yon',l:'İki'}]} onSave={v => editRow('kapilar', k.id, 'yon', v)} />
                </td>
                <td className="px-1 py-0.5"><button onClick={() => delRow('kapilar', k.id)} className="text-slate-300 hover:text-red-400 px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Pencereler */}
      <Section title={`Pencereler (${data.pencereler?.length ?? 0})`} rows={data.pencereler ?? []} addNew={addPencere}>
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {['Duvar', 'Konum', 'Gen.', 'Yük.', ''].map(h => (
                <th key={h} className="px-1 py-1 text-left text-[10px] text-slate-400 font-medium border-b" style={{ borderColor: 'var(--portal-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.pencereler ?? []).map((p, i) => (
              <tr key={p.id} className={i % 2 ? 'bg-slate-50/50' : ''}>
                <td className="px-1 py-0.5"><CellInput val={p.duvar_id} type="number" onSave={v => editRow('pencereler', p.id, 'duvar_id', v)} /></td>
                <td className="px-1 py-0.5"><CellInput val={p.konum_mm} type="number" onSave={v => editRow('pencereler', p.id, 'konum_mm', v)} /></td>
                <td className="px-1 py-0.5"><CellInput val={p.genislik_mm} type="number" onSave={v => editRow('pencereler', p.id, 'genislik_mm', v)} /></td>
                <td className="px-1 py-0.5"><CellInput val={p.yukseklik_mm} type="number" onSave={v => editRow('pencereler', p.id, 'yukseklik_mm', v)} /></td>
                <td className="px-1 py-0.5"><button onClick={() => delRow('pencereler', p.id)} className="text-slate-300 hover:text-red-400 px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Kolonlar */}
      <Section title={`Kolonlar (${data.kolonlar?.length ?? 0})`} rows={data.kolonlar ?? []} addNew={addKolon}>
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {['Merkez [x,y]', 'Genişlik', 'Derinlik', ''].map(h => (
                <th key={h} className="px-1 py-1 text-left text-[10px] text-slate-400 font-medium border-b" style={{ borderColor: 'var(--portal-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.kolonlar ?? []).map((c, i) => (
              <tr key={c.id} className={i % 2 ? 'bg-slate-50/50' : ''}>
                <td className="px-1 py-0.5">
                  <div className="flex gap-0.5">
                    <CellInput val={c.merkez[0]} type="number" onSave={v => editRow('kolonlar', c.id, 'merkez', [v, c.merkez[1]])} />
                    <CellInput val={c.merkez[1]} type="number" onSave={v => editRow('kolonlar', c.id, 'merkez', [c.merkez[0], v])} />
                  </div>
                </td>
                <td className="px-1 py-0.5"><CellInput val={c.genislik_mm} type="number" onSave={v => editRow('kolonlar', c.id, 'genislik_mm', v)} /></td>
                <td className="px-1 py-0.5"><CellInput val={c.derinlik_mm} type="number" onSave={v => editRow('kolonlar', c.id, 'derinlik_mm', v)} /></td>
                <td className="px-1 py-0.5"><button onClick={() => delRow('kolonlar', c.id)} className="text-slate-300 hover:text-red-400 px-1">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

// ── Meta sekme ──────────────────────────────────────────────────────
function MetaTab({ data, onChange }) {
  const meta = data.proje_meta ?? {}
  function upMeta(key, val) {
    onChange({ ...data, proje_meta: { ...meta, [key]: val } })
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto flex-1">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Mağaza Tipi</label>
        <select className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white" style={{ borderColor: 'var(--portal-border)' }}
          value={meta.magaza_tipi ?? 'diger'}
          onChange={e => upMeta('magaza_tipi', e.target.value)}>
          {[['market','Market'],['butik','Butik'],['yemek','Yemek'],['firin','Fırın'],['manav','Manav'],['diger','Diğer']].map(([v,l]) =>
            <option key={v} value={v}>{l}</option>
          )}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Tavan Yüksekliği (mm)</label>
        <input type="number" className="w-full text-xs border rounded-lg px-2 py-1.5" style={{ borderColor: 'var(--portal-border)' }}
          value={meta.tavan_yuksekligi_mm ?? ''}
          onChange={e => upMeta('tavan_yuksekligi_mm', e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="örn. 3200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Zemin Tipi</label>
        <select className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white" style={{ borderColor: 'var(--portal-border)' }}
          value={meta.zemin_tipi ?? ''}
          onChange={e => upMeta('zemin_tipi', e.target.value || null)}>
          <option value="">Seçiniz</option>
          {[['seramik','Seramik'],['epoksi','Epoksi'],['gridos','Gridos'],['laminat','Laminat'],['diger','Diğer']].map(([v,l]) =>
            <option key={v} value={v}>{l}</option>
          )}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Cephe Yönleri</label>
        <div className="flex gap-3">
          {['kuzey','guney','dogu','bati'].map(y => (
            <label key={y} className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox"
                checked={meta.cephe_yonleri?.[y] ?? false}
                onChange={e => upMeta('cephe_yonleri', { ...(meta.cephe_yonleri ?? {}), [y]: e.target.checked })}
                className="rounded"
              />
              {y.charAt(0).toUpperCase() + y.slice(1)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Hedef Ekipman Alanı (m²)</label>
        <input type="number" className="w-full text-xs border rounded-lg px-2 py-1.5" style={{ borderColor: 'var(--portal-border)' }}
          value={meta.hedef_alan_m2 ?? ''}
          onChange={e => upMeta('hedef_alan_m2', e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="örn. 450"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Özel Kısıtlar</label>
        {(meta.ozel_kisitlar ?? []).map((k, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input className="flex-1 text-xs border rounded-lg px-2 py-1.5" style={{ borderColor: 'var(--portal-border)' }}
              value={k}
              onChange={e => {
                const arr = [...(meta.ozel_kisitlar ?? [])]
                arr[i] = e.target.value
                upMeta('ozel_kisitlar', arr)
              }}
            />
            <button onClick={() => upMeta('ozel_kisitlar', (meta.ozel_kisitlar ?? []).filter((_, j) => j !== i))}
              className="text-slate-300 hover:text-red-400 px-1">✕</button>
          </div>
        ))}
        <button onClick={() => upMeta('ozel_kisitlar', [...(meta.ozel_kisitlar ?? []), ''])}
          className="text-xs text-[#00C4CC] hover:underline">+ Kısıt Ekle</button>
      </div>
    </div>
  )
}

// ── Tesisat sekme ───────────────────────────────────────────────────
function TesisatTab({ data, onChange }) {
  const tes = data.tesisat ?? {}
  function upTes(key, val) {
    onChange({ ...data, tesisat: { ...tes, [key]: val } })
  }

  const Card = ({ title, field, children }) => {
    const sub = tes[field] ?? {}
    return (
      <div className="border rounded-xl p-3 mb-2" style={{ borderColor: 'var(--portal-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <div onClick={() => upTes(field, { ...sub, mevcut: !sub.mevcut })}
              className={`w-8 h-4 rounded-full transition-colors relative ${sub.mevcut ? 'bg-[#00C4CC]' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${sub.mevcut ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-slate-500">{sub.mevcut ? 'Mevcut' : 'Yok'}</span>
          </label>
        </div>
        {sub.mevcut && <div className="space-y-1.5">{children(sub, (key, val) => upTes(field, { ...sub, [key]: val }))}</div>}
      </div>
    )
  }

  const TF = ({ label, val, onChange, type = 'text' }) => (
    <div>
      <label className="text-[10px] text-slate-400 block mb-0.5">{label}</label>
      <input type={type} value={val ?? ''} onChange={e => onChange(type === 'number' ? (e.target.value ? parseFloat(e.target.value) : null) : (e.target.value || null))}
        className="w-full text-xs border rounded-lg px-2 py-1" style={{ borderColor: 'var(--portal-border)' }} />
    </div>
  )

  return (
    <div className="p-3 overflow-y-auto flex-1">
      <Card title="Elektrik" field="elektrik">
        {(sub, up) => <>
          <TF label="Güç (kVA)" val={sub.guc_kva} type="number" onChange={v => up('guc_kva', v)} />
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Faz</label>
            <select className="w-full text-xs border rounded-lg px-2 py-1 bg-white" style={{ borderColor: 'var(--portal-border)' }}
              value={sub.faz ?? ''} onChange={e => up('faz', e.target.value || null)}>
              <option value="">Seçiniz</option>
              <option value="monofaze">Monofaze</option>
              <option value="trifaze">Trifaze</option>
            </select>
          </div>
          <TF label="Pano Yeri" val={sub.pano_yeri} onChange={v => up('pano_yeri', v)} />
        </>}
      </Card>
      <Card title="Su" field="su">
        {(sub, up) => <>
          <TF label="Giriş Yeri" val={sub.giris_yeri} onChange={v => up('giris_yeri', v)} />
          <TF label="Basınç (bar)" val={sub.basinc_bar} type="number" onChange={v => up('basinc_bar', v)} />
        </>}
      </Card>
      <Card title="Atık Su" field="atik_su">
        {(sub, up) => <TF label="Konum" val={sub.konum} onChange={v => up('konum', v)} />}
      </Card>
      <Card title="HVAC" field="hvac">
        {(sub, up) => (
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Tip</label>
            <select className="w-full text-xs border rounded-lg px-2 py-1 bg-white" style={{ borderColor: 'var(--portal-border)' }}
              value={sub.tip ?? ''} onChange={e => up('tip', e.target.value || null)}>
              <option value="">Seçiniz</option>
              <option value="split">Split</option>
              <option value="vrf">VRF</option>
              <option value="merkezi">Merkezi</option>
              <option value="yok">Yok</option>
            </select>
          </div>
        )}
      </Card>
      <Card title="Doğalgaz" field="dogalgaz">
        {(sub, up) => <TF label="Hat Yeri" val={sub.hat_yeri} onChange={v => up('hat_yeri', v)} />}
      </Card>
    </div>
  )
}

// ── Notlar sekme ────────────────────────────────────────────────────
function NotlarTab({ data, onChange, userEmail }) {
  const [newNote, setNewNote] = useState('')
  const notes = data.notlar_liste ?? []

  function addNote() {
    if (!newNote.trim()) return
    const n = {
      id: Date.now().toString(),
      yazan: userEmail ?? 'Anonim',
      tarih: new Date().toISOString().slice(0, 10),
      metin: newNote.trim(),
    }
    onChange({ ...data, notlar_liste: [n, ...notes] })
    setNewNote('')
  }

  return (
    <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
      <div>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Yeni not…"
          rows={3}
          className="w-full text-xs border rounded-xl px-3 py-2 resize-none focus:ring-1 focus:ring-[#00C4CC] focus:border-[#00C4CC]"
          style={{ borderColor: 'var(--portal-border)' }}
        />
        <button onClick={addNote} disabled={!newNote.trim()}
          className="mt-1 w-full py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
          style={{ background: 'var(--portal-sidebar)' }}>
          + Not Ekle
        </button>
      </div>
      <div className="space-y-2">
        {notes.map(n => (
          <div key={n.id} className="border rounded-xl p-3" style={{ borderColor: 'var(--portal-border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-600">{n.yazan}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{n.tarih}</span>
                <button onClick={() => onChange({ ...data, notlar_liste: notes.filter(x => x.id !== n.id) })}
                  className="text-slate-300 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
            <p className="text-xs text-slate-700">{n.metin}</p>
          </div>
        ))}
        {notes.length === 0 && <p className="text-xs text-slate-300 italic text-center py-4">Henüz not yok</p>}
      </div>
      {data.notlar && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--portal-border)' }}>
          <p className="text-[10px] text-slate-400 font-semibold mb-1">AI Notları</p>
          <p className="text-xs text-slate-500 italic">{data.notlar}</p>
        </div>
      )}
    </div>
  )
}

// ── Fotoğraflar sekme ───────────────────────────────────────────────
function FotoğraflarTab({ data, onChange, project, userId }) {
  const supabase = createClient()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const photos = data.referans_fotograflar ?? []

  async function upload(file) {
    if (photos.length >= 20) return
    if (file.size > 10 * 1024 * 1024) { alert('Maks 10MB'); return }
    setUploading(true)
    try {
      const ts   = Date.now()
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${userId}/${project.id}/${ts}-${safe}`
      const { error } = await supabase.storage.from('rolove-photos').upload(path, file, { upsert: false })
      if (error) throw error
      onChange({ ...data, referans_fotograflar: [...photos, { url: path, etiket: file.name.replace(/\.[^.]+$/, '') }] })
    } catch (e) {
      alert('Yükleme hatası: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  async function getUrl(path) {
    const { data: { signedUrl } } = await supabase.storage.from('rolove-photos').createSignedUrl(path, 3600)
    return signedUrl
  }

  function updateLabel(url, label) {
    onChange({ ...data, referans_fotograflar: photos.map(p => p.url === url ? { ...p, etiket: label } : p) })
  }
  function remove(url) {
    onChange({ ...data, referans_fotograflar: photos.filter(p => p.url !== url) })
  }

  return (
    <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-[#00C4CC] hover:bg-[#E0FAF9]/30 transition-colors"
        style={{ borderColor: 'var(--portal-border)' }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) upload(f) }}
      >
        <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={e => { if (e.target.files[0]) upload(e.target.files[0]); e.target.value = '' }} />
        {uploading ? (
          <p className="text-xs text-[#00C4CC]">Yükleniyor…</p>
        ) : (
          <>
            <p className="text-xs font-medium text-slate-600">Fotoğraf sürükle veya tıkla</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Maks 20 fotoğraf · 10 MB / fotoğraf</p>
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {photos.map(p => (
          <PhotoCard key={p.url} photo={p} getUrl={getUrl} onLabel={updateLabel} onRemove={remove} onLightbox={setLightbox} />
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Fotoğraf" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

function PhotoCard({ photo, getUrl, onLabel, onRemove, onLightbox }) {
  const [url, setUrl] = useState(null)
  const [label, setLabel] = useState(photo.etiket)
  useEffect(() => { getUrl(photo.url).then(setUrl) }, [photo.url])
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--portal-border)' }}>
      <div className="aspect-video bg-slate-100 relative cursor-pointer" onClick={() => url && onLightbox(url)}>
        {url ? <img src={url} alt={photo.etiket} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-300 text-xs">Yükleniyor</div>}
      </div>
      <div className="p-1.5 flex items-center gap-1">
        <input className="flex-1 text-[10px] border-0 bg-transparent text-slate-600 focus:ring-0 px-0" value={label}
          onChange={e => setLabel(e.target.value)} onBlur={() => onLabel(photo.url, label)} placeholder="Etiket…" />
        <button onClick={() => onRemove(photo.url)} className="text-slate-300 hover:text-red-400 text-xs">✕</button>
      </div>
    </div>
  )
}

// ── AI Yardımcı sekme ───────────────────────────────────────────────
function AITab({ data, onChange, project, inputVersionId, imageUrl }) {
  const [chat, setChat]           = useState('')
  const [answer, setAnswer]       = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [reResult, setReResult]   = useState(null)
  const [applyLoading, setApplyLoading] = useState(false)

  async function askChat() {
    if (!chat.trim()) return
    setChatLoading(true)
    setAnswer('')
    try {
      const res  = await fetch('/api/vision/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ project_id: project.id, version_id: inputVersionId, question: chat }),
      })
      const d = await res.json()
      setAnswer(d.answer ?? d.error ?? 'Cevap alınamadı')
    } catch (e) {
      setAnswer('Hata: ' + e.message)
    } finally {
      setChatLoading(false)
    }
  }

  async function reanalyze() {
    setReanalyzing(true)
    setReResult(null)
    try {
      const res = await fetch('/api/vision/re-analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ project_id: project.id, input_version_id: inputVersionId, current_data: data }),
      })
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setReResult(d.data)
    } catch (e) {
      alert('Yeniden analiz hatası: ' + e.message)
    } finally {
      setReanalyzing(false)
    }
  }

  function applyResult() {
    setApplyLoading(true)
    try {
      // Merge AI result into current data (preserve user's S2 fields)
      const merged = {
        ...reResult,
        proje_meta:           data.proje_meta,
        tesisat:              data.tesisat,
        mevcut_ekipman:       data.mevcut_ekipman,
        notlar_liste:         data.notlar_liste,
        referans_fotograflar: data.referans_fotograflar,
      }
      onChange(merged)
      setReResult(null)
    } finally {
      setApplyLoading(false)
    }
  }

  return (
    <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
      {/* Re-analyze */}
      <div className="border rounded-xl p-3" style={{ borderColor: 'var(--portal-border)' }}>
        <p className="text-xs font-semibold text-slate-700 mb-2">Tekrar Analiz Et</p>
        <p className="text-[10px] text-slate-400 mb-2">Orijinal görsel + mevcut düzeltmelerinizle AI'dan yeni bir okuma alır.</p>
        <button onClick={reanalyze} disabled={reanalyzing || !inputVersionId}
          className="w-full py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--portal-sidebar)' }}>
          {reanalyzing ? 'Analiz ediliyor…' : 'AI ile Tekrar Analiz Et'}
        </button>
        {reResult && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-green-700">Yeni Analiz Hazır</p>
              <span className="text-xs text-slate-500">Güven: {Math.round((reResult.guven_skoru ?? 0) * 100)}%</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[['Duvar', reResult.duvarlar?.length], ['Kapı', reResult.kapilar?.length], ['Oda', reResult.odalar?.length], ['Kolon', reResult.kolonlar?.length]].map(([l, v]) => (
                <div key={l} className="bg-slate-50 rounded-lg p-1.5">
                  <p className="text-xs font-bold">{v ?? 0}</p>
                  <p className="text-[10px] text-slate-400">{l}</p>
                </div>
              ))}
            </div>
            <button onClick={applyResult} disabled={applyLoading}
              className="w-full py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: '#22c55e' }}>
              Sonucu Uygula (S2 alanlarınız korunur)
            </button>
          </div>
        )}
      </div>

      {/* Güven skoru yenile */}
      <div className="border rounded-xl p-3" style={{ borderColor: 'var(--portal-border)' }}>
        <p className="text-xs font-semibold text-slate-700 mb-1">Mevcut Analiz</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Güven:</span>
          <ConfBar score={data.guven_skoru} />
        </div>
        {data.okunamayan_alanlar?.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] text-slate-400 mb-1">Okunamayan alanlar:</p>
            {data.okunamayan_alanlar.map((s, i) => (
              <p key={i} className="text-[10px] text-yellow-700 bg-yellow-50 rounded px-1.5 py-0.5 mb-0.5">{s}</p>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="border rounded-xl p-3" style={{ borderColor: 'var(--portal-border)' }}>
        <p className="text-xs font-semibold text-slate-700 mb-2">Rölöve Hakkında Sor</p>
        <textarea
          value={chat}
          onChange={e => setChat(e.target.value)}
          placeholder="örn. 'Bu rölövede servis koridoru var mı?'"
          rows={2}
          className="w-full text-xs border rounded-lg px-2 py-1.5 resize-none"
          style={{ borderColor: 'var(--portal-border)' }}
        />
        <button onClick={askChat} disabled={chatLoading || !chat.trim()}
          className="mt-1 w-full py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
          style={{ background: '#00C4CC' }}>
          {chatLoading ? 'Yanıt alınıyor…' : 'Sor →'}
        </button>
        {answer && (
          <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-700 leading-relaxed">{answer}</div>
        )}
      </div>
    </div>
  )
}

// ── Ana StudioTab bileşeni ──────────────────────────────────────────
export default function StudioTab({ project }) {
  const supabase = createClient()

  const [status,          setStatus]          = useState('loading')
  const [studioData,      setStudioData]       = useState(() => defaultStudio())
  const [jsonVersions,    setJsonVersions]     = useState([])
  const [activeVersionId, setActiveVersionId]  = useState(null)
  const [draftVersionId,  setDraftVersionId]   = useState(null)
  const [inputVersion,    setInputVersion]     = useState(null)
  const [imageUrl,        setImageUrl]         = useState(null)
  const [userEmail,       setUserEmail]        = useState('')
  const [userId,          setUserId]           = useState('')

  const [activeTool,    setActiveTool]    = useState('select')
  const [selectedEl,    setSelectedEl]    = useState(null)
  const [rightTab,      setRightTab]      = useState('yapisal')

  const [saveStatus,    setSaveStatus]    = useState('saved')
  const [showApprove,   setShowApprove]   = useState(false)
  const [approving,     setApproving]     = useState(false)
  const [approved,      setApproved]      = useState(false)
  const [showVersions,  setShowVersions]  = useState(false)

  const saveTimerRef  = useRef(null)
  // Undo/Redo: history dizisi ref ile (gereksiz re-render önlemek için)
  const historyRef    = useRef([])          // studioData snapshot'ları
  const [historyIdx,  setHistoryIdx]  = useState(-1)  // mevcut konum

  // ── Veri yükleme ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? '')
      setUserId(user?.id ?? '')

      // json versiyonlarını yükle
      const { data: jvs } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', project.id)
        .eq('stage', 'json')
        .order('created_at', { ascending: false })

      if (!jvs?.length) {
        setStatus('no_data')
        return
      }

      setJsonVersions(jvs)
      const latest = jvs[0]
      setActiveVersionId(latest.id)

      // Taslak (onaylanmamış) mı?
      if (!latest.approved) {
        setDraftVersionId(latest.id)
      } else {
        setApproved(true)
      }

      // Stüdyo verisini hazırla ve history'yi başlat
      const initial = defaultStudio(latest.ai_metadata ?? {})
      historyRef.current = [initial]
      setHistoryIdx(0)
      setStudioData(initial)

      // Üst input versiyonunu bul
      if (latest.parent_version_id) {
        const { data: iv } = await supabase
          .from('project_versions')
          .select('*')
          .eq('id', latest.parent_version_id)
          .single()
        setInputVersion(iv)

        // Signed URL (görsel/PDF için)
        if (iv?.file_url) {
          const ext = iv.file_url.split('.').pop()?.toLowerCase()
          if (['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
            const { data: { signedUrl } } = await supabase.storage
              .from('rolove-input')
              .createSignedUrl(iv.file_url, 7200)
            setImageUrl(signedUrl)
          }
        }
      }

      setStatus('loaded')
    }
    load()
  }, [project.id])

  // ── Versiyon değişimi ─────────────────────────────────────────────
  async function switchVersion(ver) {
    setActiveVersionId(ver.id)
    setDraftVersionId(ver.approved ? null : ver.id)
    setApproved(!!ver.approved)
    const newData = defaultStudio(ver.ai_metadata ?? {})
    historyRef.current = [newData]
    setHistoryIdx(0)
    setStudioData(newData)
    setSelectedEl(null)
    setSaveStatus('saved')
    setShowVersions(false)
  }

  // ── Otomatik kayıt ────────────────────────────────────────────────
  const saveDraft = useCallback(async (data) => {
    setSaveStatus('saving')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (draftVersionId) {
        await supabase.from('project_versions').update({ ai_metadata: data }).eq('id', draftVersionId)
      } else {
        const { data: maxVer } = await supabase
          .from('project_versions').select('version_no').eq('project_id', project.id)
          .order('version_no', { ascending: false }).limit(1).single()
        const nextNo = (maxVer?.version_no ?? 0) + 1
        const { data: newVer } = await supabase
          .from('project_versions')
          .insert({
            project_id:       project.id,
            stage:            'json',
            version_no:       nextNo,
            parent_version_id: inputVersion?.id ?? null,
            ai_metadata:      data,
            approved:         false,
            created_by:       user?.id,
          })
          .select().single()
        setDraftVersionId(newVer.id)
        setJsonVersions(prev => [newVer, ...prev])
      }
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }, [draftVersionId, project.id, inputVersion, supabase])

  function updateData(newData, skipHistory = false) {
    setStudioData(newData)
    setSaveStatus('unsaved')

    if (!skipHistory) {
      // Gelecekteki redo geçmişini sil, yeni snapshot ekle
      const MAX_HISTORY = 100
      const curr = historyIdx
      const trimmed = historyRef.current.slice(0, curr + 1)
      trimmed.push(newData)
      if (trimmed.length > MAX_HISTORY) trimmed.shift()
      historyRef.current = trimmed
      setHistoryIdx(trimmed.length - 1)
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveDraft(newData), 2000)
  }

  // ── Undo / Redo ────────────────────────────────────────────────────
  function undo() {
    if (historyIdx <= 0) return
    const newIdx  = historyIdx - 1
    const prevData = historyRef.current[newIdx]
    setHistoryIdx(newIdx)
    setStudioData(prevData)
    setSaveStatus('unsaved')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveDraft(prevData), 2000)
  }

  function redo() {
    if (historyIdx >= historyRef.current.length - 1) return
    const newIdx  = historyIdx + 1
    const nextData = historyRef.current[newIdx]
    setHistoryIdx(newIdx)
    setStudioData(nextData)
    setSaveStatus('unsaved')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveDraft(nextData), 2000)
  }

  const canUndo = historyIdx > 0
  const canRedo = historyIdx < historyRef.current.length - 1

  // ── Onaylama ──────────────────────────────────────────────────────
  async function handleApprove() {
    setApproving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const now = new Date().toISOString()
      if (draftVersionId) {
        await supabase.from('project_versions').update({
          approved: true, approved_at: now, approved_by: user?.id,
        }).eq('id', draftVersionId)
        setJsonVersions(prev => prev.map(v => v.id === draftVersionId ? { ...v, approved: true, approved_at: now } : v))
      }
      setApproved(true)
      setDraftVersionId(null)
      setShowApprove(false)
    } catch (e) {
      alert('Onay hatası: ' + e.message)
    } finally {
      setApproving(false)
    }
  }

  // ── Element seçimi senkronizasyonu ────────────────────────────────
  function handleSelectEl(el) {
    setSelectedEl(el)
    if (el) setRightTab('yapisal')
  }

  // ── Render ────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Stüdyo yükleniyor…
      </div>
    )
  }

  if (status === 'no_data') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">📐</div>
          <h3 className="font-semibold text-slate-700 mb-2">Henüz Analiz Yok</h3>
          <p className="text-slate-400 text-sm">Input sekmesinde rölöve yükleyip Vision analizi çalıştırın.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── 3 Kolon Layout ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* SOL PANEL — %25, orijinal görsel */}
        <div className="w-1/4 flex flex-col flex-shrink-0 border-r overflow-hidden" style={{ borderColor: 'var(--portal-border)' }}>
          <div className="px-3 py-2 bg-slate-900 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-white/70">Orijinal Rölöve</span>
            {inputVersion?.ai_metadata?.original_name && (
              <span className="text-[10px] text-white/30 truncate ml-2">{inputVersion.ai_metadata.original_name}</span>
            )}
          </div>
          <div className="flex-1 bg-slate-900 overflow-hidden">
            {imageUrl ? (
              <TransformWrapper
                initialScale={1}
                minScale={0.2}
                maxScale={5}
                centerOnInit
              >
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <img
                    src={imageUrl}
                    alt="Rölöve"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    draggable={false}
                  />
                </TransformComponent>
              </TransformWrapper>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/25 text-xs">
                <span className="text-3xl mb-2">🖼️</span>
                <span>{inputVersion?.file_url?.includes('.dxf') ? 'DXF — Önizleme yok' : 'Görsel yükleniyor…'}</span>
              </div>
            )}
          </div>
        </div>

        {/* ORTA PANEL — %45, Konva canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CanvasPanel
            studioData={studioData}
            onUpdate={updateData}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            selectedEl={selectedEl}
            onSelectEl={handleSelectEl}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>

        {/* SAĞ PANEL — %30, düzenleme sekmeleri */}
        <div className="w-[30%] flex flex-col flex-shrink-0 border-l overflow-hidden bg-white" style={{ borderColor: 'var(--portal-border)', minWidth: 260 }}>
          {/* Sekme çubuğu */}
          <div className="flex border-b overflow-x-auto flex-shrink-0" style={{ borderColor: 'var(--portal-border)' }}>
            {RIGHT_TABS.map(t => (
              <button key={t.key} onClick={() => setRightTab(t.key)}
                className={`flex-shrink-0 px-3 py-2 text-[11px] font-medium transition-colors border-b-2 ${
                  rightTab === t.key ? 'border-[#00C4CC] text-[#00C4CC]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Sekme içeriği */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightTab === 'yapisal'    && <YapisalTab data={studioData} onChange={updateData} selectedEl={selectedEl} />}
            {rightTab === 'meta'       && <MetaTab data={studioData} onChange={updateData} />}
            {rightTab === 'tesisat'    && <TesisatTab data={studioData} onChange={updateData} />}
            {rightTab === 'notlar'     && <NotlarTab data={studioData} onChange={updateData} userEmail={userEmail} />}
            {rightTab === 'fotograflar' && <FotoğraflarTab data={studioData} onChange={updateData} project={project} userId={userId} />}
            {rightTab === 'ai'         && <AITab data={studioData} onChange={updateData} project={project} inputVersionId={inputVersion?.id} imageUrl={imageUrl} />}
          </div>
        </div>
      </div>

      {/* ── ALT BAR ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t bg-white px-4 py-2 flex items-center gap-4" style={{ borderColor: 'var(--portal-border)' }}>
        {/* Güven skoru */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">Güven</span>
          <div className="w-24">
            <ConfBar score={studioData.guven_skoru} />
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 flex-shrink-0" />

        {/* Versiyonlar */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setShowVersions(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium">
            <span>Versiyonlar ({jsonVersions.length})</span>
            <svg className={`w-3 h-3 transition-transform ${showVersions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showVersions && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-xl shadow-lg z-10 min-w-52 overflow-hidden" style={{ borderColor: 'var(--portal-border)' }}>
              {jsonVersions.map(v => (
                <button key={v.id} onClick={() => switchVersion(v)}
                  className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 flex items-center justify-between ${v.id === activeVersionId ? 'bg-[#E0FAF9]' : ''}`}>
                  <span className="text-slate-700">
                    v{v.version_no} — {new Date(v.created_at).toLocaleDateString('tr-TR')}
                  </span>
                  {v.approved && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Onaylı</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Kayıt durumu */}
        <SaveStatus status={saveStatus} />

        {/* AI Tekrar Analiz (AI sekmesine kısa yol) */}
        <button onClick={() => setRightTab('ai')}
          className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors text-slate-600 hover:border-[#00C4CC] hover:text-[#00C4CC]"
          style={{ borderColor: 'var(--portal-border)' }}>
          AI ile Tekrar Analiz
        </button>

        {/* Onayla butonu */}
        {!approved ? (
          <button onClick={() => setShowApprove(true)}
            className="text-xs px-4 py-1.5 rounded-lg font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #00C4CC 0%, #0099A8 100%)' }}>
            Onayla ve 2D Çizime Geç →
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold">
            ✓ Onaylandı
          </span>
        )}
      </div>

      {/* ── Onay Modal ─────────────────────────────────────────── */}
      {showApprove && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowApprove(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">✅</div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Rölöveyi Onayla</h3>
            <p className="text-sm text-slate-500 mb-1">Bu rölöve onaylanacak ve Sprint 3'te DXF üretimine geçilecek.</p>
            <p className="text-xs text-slate-400 mb-5">Onay sonrası düzenlemeleriniz yeni bir taslak olarak kaydedilir.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowApprove(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium border text-slate-600"
                style={{ borderColor: 'var(--portal-border)' }}>
                İptal
              </button>
              <button onClick={handleApprove} disabled={approving}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00C4CC 0%, #0099A8 100%)' }}>
                {approving ? 'Onaylanıyor…' : 'Evet, Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

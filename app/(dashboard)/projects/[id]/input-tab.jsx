'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCEPTED_TYPES = {
  'image/jpeg':       '.jpg',
  'image/png':        '.png',
  'application/pdf':  '.pdf',
  'image/vnd.dxf':    '.dxf',
  'application/dxf':  '.dxf',
}
const ACCEPTED_EXT  = ['.jpg', '.jpeg', '.png', '.pdf', '.dxf']
const MAX_SIZE_MB   = 20
const POLL_INTERVAL = 3000

function fileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf')  return '📄'
  if (ext === 'dxf')  return '📐'
  return '🖼️'
}

function fmtSize(bytes) {
  if (bytes < 1024)        return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const map = {
    queued:  { label: 'Sıraya alındı', cls: 'bg-slate-100 text-slate-500' },
    running: { label: 'Analiz ediliyor…', cls: 'bg-blue-100 text-blue-600 animate-pulse' },
    done:    { label: 'Tamamlandı',    cls: 'bg-green-100 text-green-700' },
    failed:  { label: 'Hata',          cls: 'bg-red-100 text-red-600' },
  }
  const s = map[status]
  if (!s) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  )
}

function ConfidenceBar({ score }) {
  const pct   = Math.round(score * 100)
  const color = score >= 0.8 ? '#22c55e' : score >= 0.5 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-700 w-24">Güven skoru</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold w-10 text-right" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function InputTab({ project }) {
  const supabase = createClient()

  const [versions,       setVersions]       = useState([])
  const [jobs,           setJobs]           = useState({})       // version_id → job
  const [jsonResults,    setJsonResults]     = useState({})       // version_id → parsed JSON
  const [expandedId,     setExpandedId]     = useState(null)     // hangi versiyonun sonucu açık
  const [isDragging,     setIsDragging]     = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [uploadError,    setUploadError]    = useState('')
  const [analyzingId,    setAnalyzingId]    = useState(null)
  const [analyzeError,   setAnalyzeError]   = useState({})       // version_id → hata
  const [copied,         setCopied]         = useState(false)
  const fileInputRef = useRef(null)
  const pollRef      = useRef(null)

  // ── İlk yükleme ──────────────────────────────────────────────
  const loadVersions = useCallback(async () => {
    const { data } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', project.id)
      .eq('stage', 'input')
      .order('created_at', { ascending: false })
    setVersions(data ?? [])
  }, [project.id, supabase])

  const loadJobs = useCallback(async (versionIds) => {
    if (!versionIds.length) return
    const { data } = await supabase
      .from('ai_jobs')
      .select('*')
      .in('version_id', versionIds)
      .order('created_at', { ascending: false })

    const map = {}
    for (const job of (data ?? [])) {
      if (!map[job.version_id]) map[job.version_id] = job
    }
    setJobs(map)
    return map
  }, [supabase])

  const loadJsonResults = useCallback(async (versionIds) => {
    if (!versionIds.length) return
    const { data } = await supabase
      .from('project_versions')
      .select('id, parent_version_id, ai_metadata')
      .eq('project_id', project.id)
      .eq('stage', 'json')
      .in('parent_version_id', versionIds)

    const map = {}
    for (const v of (data ?? [])) {
      if (v.parent_version_id && v.ai_metadata) {
        map[v.parent_version_id] = v.ai_metadata
      }
    }
    setJsonResults(map)
  }, [project.id, supabase])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  useEffect(() => {
    if (!versions.length) return
    const ids = versions.map((v) => v.id)
    loadJobs(ids)
    loadJsonResults(ids)
  }, [versions, loadJobs, loadJsonResults])

  // ── Polling ───────────────────────────────────────────────────
  useEffect(() => {
    const activeJobs = Object.values(jobs).filter(
      (j) => j.status === 'queued' || j.status === 'running'
    )
    if (!activeJobs.length) {
      clearInterval(pollRef.current)
      return
    }
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const ids = versions.map((v) => v.id)
      const newJobs = await loadJobs(ids)
      // Her turda JSON sonuçlarını da kontrol et
      // Vercel timeout durumunda job 'running' kalsa bile sonuç gelmiş olabilir
      await loadJsonResults(ids)
      const stillActive = Object.values(newJobs ?? {}).some(
        (j) => j.status === 'queued' || j.status === 'running'
      )
      if (!stillActive) {
        clearInterval(pollRef.current)
      }
    }, POLL_INTERVAL)

    return () => clearInterval(pollRef.current)
  }, [jobs, versions, loadJobs, loadJsonResults])

  // ── Dosya yükleme ─────────────────────────────────────────────
  async function uploadFile(file) {
    setUploadError('')

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_EXT.includes(ext)) {
      setUploadError(`Desteklenmeyen format. İzin verilenler: ${ACCEPTED_EXT.join(', ')}`)
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`Dosya ${MAX_SIZE_MB} MB'dan büyük olamaz.`)
      return
    }

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ts       = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path     = `${user.id}/${project.id}/${ts}-${safeName}`

      const { error: upErr } = await supabase.storage
        .from('rolove-input')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (upErr) throw new Error(upErr.message)

      // version_no hesapla
      const { data: maxVer } = await supabase
        .from('project_versions')
        .select('version_no')
        .eq('project_id', project.id)
        .order('version_no', { ascending: false })
        .limit(1)
        .single()

      const nextNo = (maxVer?.version_no ?? 0) + 1

      const { data: ver, error: insertErr } = await supabase
        .from('project_versions')
        .insert({
          project_id:  project.id,
          stage:       'input',
          version_no:  nextNo,
          file_url:    path,
          created_by:  user.id,
          ai_metadata: {
            original_name: file.name,
            size_bytes:    file.size,
            mime:          file.type || 'application/octet-stream',
          },
        })
        .select()
        .single()

      if (insertErr) throw new Error(insertErr.message)

      setVersions((prev) => [ver, ...prev])
    } catch (err) {
      setUploadError('Yükleme hatası: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function onFileChange(e) {
    const file = e.target.files[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  // ── Vision analizi başlat ─────────────────────────────────────
  async function startAnalyze(version) {
    setAnalyzingId(version.id)
    setAnalyzeError((p) => ({ ...p, [version.id]: '' }))
    try {
      const res  = await fetch('/api/vision/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ project_id: project.id, version_id: version.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Polling tetiklensin diye jobs'u güncelle
      setJobs((prev) => ({
        ...prev,
        [version.id]: { version_id: version.id, status: 'queued', id: data.job_id },
      }))
      setExpandedId(version.id)
    } catch (err) {
      setAnalyzeError((p) => ({ ...p, [version.id]: err.message }))
    } finally {
      setAnalyzingId(null)
    }
  }

  // ── JSON kopyala ─────────────────────────────────────────────
  function copyJson(data) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const job = expandedId ? jobs[expandedId] : null
  const result = expandedId ? jsonResults[expandedId] : null

  return (
    <div className="p-8 space-y-6 max-w-4xl overflow-y-auto h-full">

      {/* Drag-Drop Yükleme Alanı */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[#00C4CC] bg-[#E0FAF9]'
            : 'border-slate-200 bg-white hover:border-[#00C4CC] hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf,.dxf"
          onChange={onFileChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-[#00C4CC]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-500 text-sm">Yükleniyor…</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl" style={{ background: '#E0FAF9' }}>
              📐
            </div>
            <p className="font-medium text-slate-700 text-sm mb-1">Rölöve dosyasını buraya sürükleyin</p>
            <p className="text-slate-400 text-xs">
              JPG · PNG · PDF · DXF &nbsp;·&nbsp; Maks {MAX_SIZE_MB} MB
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{uploadError}</p>
      )}

      {/* Yüklenen Dosyalar Listesi */}
      {versions.length > 0 && (
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--portal-border)' }}>
          <div className="px-5 py-3 border-b text-xs font-semibold text-slate-400 uppercase tracking-wider" style={{ borderColor: 'var(--portal-border)' }}>
            Yüklenen Dosyalar
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--portal-border)' }}>
            {versions.map((ver) => {
              const meta    = ver.ai_metadata ?? {}
              const name    = meta.original_name ?? ver.file_url?.split('/').pop() ?? 'dosya'
              const size    = meta.size_bytes ? fmtSize(meta.size_bytes) : '—'
              const jobItem = jobs[ver.id]
              const busy    = analyzingId === ver.id || (jobItem?.status === 'queued' || jobItem?.status === 'running') && !jsonResults[ver.id]
              // Vercel timeout sonrası: job 'running' takılsa bile sonuç varsa göster
              const done    = jobItem?.status === 'done' || !!jsonResults[ver.id]

              return (
                <div key={ver.id} className="px-5 py-4 flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{fileIcon(name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {size} &nbsp;·&nbsp; {fmtDate(ver.created_at)}
                      &nbsp;·&nbsp; v{ver.version_no}
                    </p>
                    {analyzeError[ver.id] && (
                      <p className="text-xs text-red-500 mt-1">{analyzeError[ver.id]}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {jobItem && <StatusBadge status={jobItem.status} />}

                    {done && (
                      <button
                        onClick={() => setExpandedId(expandedId === ver.id ? null : ver.id)}
                        className="text-xs px-3 py-1 rounded-lg font-medium border transition-colors"
                        style={{
                          borderColor: 'var(--portal-border)',
                          color: expandedId === ver.id ? '#00C4CC' : '#64748b'
                        }}
                      >
                        {expandedId === ver.id ? 'Gizle' : 'Sonucu Gör'}
                      </button>
                    )}

                    {!done && (
                      <button
                        onClick={() => startAnalyze(ver)}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
                        style={{ background: 'var(--portal-sidebar)' }}
                      >
                        {busy ? '…' : 'Vision ile Analiz Et'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sonuç Paneli — job status'undan bağımsız, result varsa göster */}
      {expandedId && result && (
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--portal-border)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--portal-border)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-sm font-semibold text-slate-800">Analiz Tamamlandı</span>
            </div>
            <span className="text-xs text-slate-400">
              {versions.find((v) => v.id === expandedId)?.ai_metadata?.original_name ?? ''}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Güven skoru */}
            <ConfidenceBar score={result.guven_skoru} />

            {/* Okunamayan alanlar */}
            {result.okunamayan_alanlar?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">Okunamayan Alanlar</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {result.okunamayan_alanlar.map((s, i) => (
                    <li key={i} className="text-xs text-yellow-700">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Özet istatistikler */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Duvar', val: result.duvarlar?.length ?? 0 },
                { label: 'Kapı',  val: result.kapilar?.length ?? 0 },
                { label: 'Oda',   val: result.odalar?.length ?? 0 },
                { label: 'Kolon', val: result.kolonlar?.length ?? 0 },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#F8FAFC' }}>
                  <p className="text-2xl font-bold text-slate-800">{s.val}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* JSON Viewer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ham JSON</p>
                <button
                  onClick={() => copyJson(result)}
                  className="text-xs px-3 py-1 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--portal-border)', color: copied ? '#22c55e' : '#64748b' }}
                >
                  {copied ? '✓ Kopyalandı' : 'Kopyala'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 text-xs rounded-xl p-4 overflow-auto max-h-72 leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <p className="text-xs text-slate-400 italic text-center">
              S2'de bu JSON'dan görsel önizleme ve düzenleme arayüzü gelecek.
            </p>
          </div>
        </div>
      )}

      {/* Analiz sırasında placeholder — sadece sonuç yokken göster */}
      {expandedId && !result && (job?.status === 'queued' || job?.status === 'running') && (
        <div className="bg-white border rounded-2xl p-8 flex flex-col items-center gap-3" style={{ borderColor: 'var(--portal-border)' }}>
          <svg className="animate-spin w-8 h-8 text-[#00C4CC]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500 text-sm">Claude Opus 4.7 rölöveyi analiz ediyor…</p>
          <p className="text-slate-400 text-xs">Ortalama 20–40 saniye sürer</p>
        </div>
      )}

      {expandedId && !result && job?.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-sm font-medium text-red-700 mb-1">Analiz başarısız oldu</p>
          <p className="text-xs text-red-500">{job.error}</p>
        </div>
      )}
    </div>
  )
}

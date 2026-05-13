'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import InputTab from './input-tab'
import StudioTab from './studio-tab'

const TABS = [
  { key: 'input',       label: 'Input',       icon: '📐', desc: 'Rölöve & Analiz' },
  { key: '2d',          label: '2D',          icon: '📄', desc: 'Plan Çizimi' },
  { key: '3d',          label: '3D',          icon: '🧊', desc: 'Model' },
  { key: 'render',      label: 'Render',      icon: '🎨', desc: 'Görsel' },
  { key: 'versiyonlar', label: 'Versiyonlar', icon: '🗂️', desc: 'Geçmiş' },
]

const STATUS_LABELS = {
  taslak:     'Taslak',
  aktif:      'Aktif',
  tamamlandi: 'Tamamlandı',
  iptal:      'İptal',
}

export default function ProjectDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const [project,   setProject]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('input')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()
      if (error || !data) { router.replace('/projects'); return }
      setProject(data)
      setLoading(false)
    }
    load()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Yükleniyor…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Üst Bar */}
      <div
        className="flex items-center gap-4 px-8 py-4 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--portal-border)' }}
      >
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Projeler
        </button>
        <svg className="w-3 h-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1B3D4F 0%, #2a5570 100%)' }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight">{project.name}</h1>
            <p className="text-slate-400 text-xs">👤 {project.customer_name}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            project.status === 'aktif'       ? 'bg-blue-100 text-blue-700' :
            project.status === 'tamamlandi'  ? 'bg-green-100 text-green-700' :
            project.status === 'iptal'       ? 'bg-red-100 text-red-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
      </div>

      {/* Sekme Çubuğu */}
      <div
        className="flex gap-1 px-6 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--portal-border)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex flex-col items-center gap-0.5 px-5 py-4 transition-all group ${
              activeTab === tab.key ? '' : 'hover:opacity-80'
            }`}
          >
            <span className={`text-xl transition-transform ${activeTab === tab.key ? 'scale-110' : 'group-hover:scale-105'}`}>
              {tab.icon}
            </span>
            <span className={`text-xs font-semibold transition-colors ${
              activeTab === tab.key ? 'text-[#1B3D4F]' : 'text-slate-400'
            }`}>
              {tab.label}
            </span>
            <span className={`text-[10px] transition-colors hidden sm:block ${
              activeTab === tab.key ? 'text-[#00C4CC]' : 'text-slate-300'
            }`}>
              {tab.desc}
            </span>
            {/* Alt çizgi göstergesi */}
            <span
              className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full transition-all ${
                activeTab === tab.key ? 'opacity-100 bg-[#00C4CC]' : 'opacity-0'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Sekme İçeriği */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'input' && <InputTab project={project} />}
        {activeTab === '2d'    && <StudioTab project={project} />}
        {activeTab !== 'input' && activeTab !== '2d' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl"
                style={{ background: '#E0FAF9' }}
              >
                {TABS.find((t) => t.key === activeTab)?.icon}
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">
                {TABS.find((t) => t.key === activeTab)?.label} Sekmesi
              </h3>
              <p className="text-slate-400 text-sm">Bu sekme ilerleyen sprintlerde gelecek.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

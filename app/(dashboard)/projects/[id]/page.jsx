'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import InputTab from './input-tab'

const TABS = [
  { key: 'input',       label: 'Input',       icon: '📐' },
  { key: '2d',          label: '2D',          icon: '📄' },
  { key: '3d',          label: '3D',          icon: '🧊' },
  { key: 'render',      label: 'Render',      icon: '🎨' },
  { key: 'versiyonlar', label: 'Versiyonlar', icon: '🗂️' },
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
        className="flex items-center gap-4 px-8 py-5 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--portal-border)' }}
      >
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Projeler
        </button>
        <span className="text-slate-200">/</span>
        <div>
          <h1 className="font-semibold text-slate-900 text-sm leading-tight">{project.name}</h1>
          <p className="text-slate-400 text-xs">👤 {project.customer_name}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
      </div>

      {/* Sekme Çubuğu */}
      <div
        className="flex gap-0 px-8 bg-white border-b flex-shrink-0"
        style={{ borderColor: 'var(--portal-border)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'text-[#1B3D4F] border-[#00C4CC]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sekme İçeriği */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'input' ? (
          <InputTab project={project} />
        ) : (
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

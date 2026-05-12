'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATUS_COLORS = {
  taslak:      'bg-slate-100 text-slate-600',
  aktif:       'bg-blue-100 text-blue-700',
  tamamlandi:  'bg-green-100 text-green-700',
  iptal:       'bg-red-100 text-red-600',
}

const STATUS_LABELS = {
  taslak:     'Taslak',
  aktif:      'Aktif',
  tamamlandi: 'Tamamlandı',
  iptal:      'İptal',
}

export default function ProjectsPage() {
  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState({ name: '', customer_name: '' })
  const [creating, setCreating]     = useState(false)
  const [formError, setFormError]   = useState('')
  const router = useRouter()

  const fetchProjects = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  async function createProject(e) {
    e.preventDefault()
    setCreating(true)
    setFormError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name:          form.name.trim(),
        customer_name: form.customer_name.trim(),
        created_by:    user.id,
      })
      .select()
      .single()

    if (error) {
      setFormError(error.message)
    } else {
      setProjects((prev) => [data, ...prev])
      closeModal()
      router.push(`/projects/${data.id}`)
    }
    setCreating(false)
  }

  function closeModal() {
    setShowModal(false)
    setForm({ name: '', customer_name: '' })
    setFormError('')
  }

  return (
    <div className="p-8">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projeler</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {loading ? '...' : `${projects.length} proje`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--portal-sidebar)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Proje
        </button>
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
          Yükleniyor...
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#E0FAF9' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--portal-cyan)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Henüz proje yok</p>
          <p className="text-slate-400 text-sm mt-1">İlk projeyi oluşturmak için "Yeni Proje"ye tıklayın.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="bg-white border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'var(--portal-border)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 flex-1">
                  {project.name}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[project.status] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>
              <p className="text-slate-500 text-xs truncate mb-3">👤 {project.customer_name}</p>
              <p className="text-slate-300 text-xs">
                {new Date(project.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Yeni Proje Modalı */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--portal-border)' }}>
              <h2 className="text-base font-semibold text-slate-900">Yeni Proje</h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Proje Adı</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Proje adını girin"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#00C4CC] transition-colors"
                  style={{ borderColor: 'var(--portal-border)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Müşteri Adı</label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Müşteri adını girin"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#00C4CC] transition-colors"
                  style={{ borderColor: 'var(--portal-border)' }}
                />
              </div>

              {formError && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                  style={{ borderColor: 'var(--portal-border)' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--portal-sidebar)' }}
                >
                  {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

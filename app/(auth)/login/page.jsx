'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setLoading(true)
      const hp = new URLSearchParams(hash.slice(1))
      const accessToken  = hp.get('access_token')
      const refreshToken = hp.get('refresh_token')
      if (accessToken && refreshToken) {
        getSupabase()
          .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error: err }) => {
            if (err) {
              setError('Oturum açılamadı: ' + err.message)
              setLoading(false)
            } else {
              window.location.replace('/projects')
            }
          })
      }
      return
    }
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError) setError(`Giriş hatası: ${decodeURIComponent(urlError)}`)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })

      let data
      try { data = await res.json() }
      catch { setError(`Sunucu hatası (HTTP ${res.status})`); return }

      if (data.error) { setError(data.error); return }

      if (data.redirect) {
        window.location.href = data.redirect
        return
      }

      if (data.sent) setSent(true)
    } catch (err) {
      setError('Bağlantı hatası: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f2132 0%, #1B3D4F 50%, #0f2a38 100%)' }}>

      {/* Sol panel — marka */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12">
        <div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl mb-10 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #00C4CC 0%, #0099A8 100%)' }}
          >
            ND
          </div>
          <h1 className="text-white text-4xl font-black leading-tight tracking-tight mb-4">
            Nokta Dizayn<br />
            <span style={{ color: '#00C4CC' }}>Portal</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Mimari proje yönetimi, rölöve analizi ve ekipman planlama platformu.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: '📐', text: 'Rölöve yükle & Claude Vision ile analiz et' },
            { icon: '🧊', text: '3D model ve render süreçlerini takip et' },
            { icon: '🗂️', text: 'Versiyon geçmişini yönet' },
          ].map((f) => (
            <div key={f.icon} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-white/45 text-sm">{f.text}</span>
            </div>
          ))}
          <p className="text-white/20 text-xs pt-4">© 2026 ND Group — Nokta Dizayn</p>
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobilde logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex w-16 h-16 rounded-2xl items-center justify-center font-black text-white text-xl mb-4 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #00C4CC 0%, #0099A8 100%)' }}
            >
              ND
            </div>
            <h1 className="text-white text-2xl font-bold">Nokta Dizayn Portal</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {sent ? (
              <div className="p-10 text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, #E0FAF9 0%, #ccf7f8 100%)' }}
                >
                  <svg className="w-10 h-10" style={{ color: '#00C4CC' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Bağlantı Gönderildi</h2>
                <p className="text-slate-500 text-sm mb-1">
                  <span className="font-semibold text-slate-700">{email}</span> adresine giriş bağlantısı gönderildi.
                </p>
                <p className="text-slate-400 text-xs mb-6">
                  E-postanızdaki bağlantıya tıklayarak giriş yapabilirsiniz.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#00C4CC' }}
                >
                  ← Farklı e-posta dene
                </button>
              </div>
            ) : (
              <>
                {/* Form başlığı */}
                <div className="px-10 pt-10 pb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Giriş Yap</h2>
                  <p className="text-slate-400 text-sm">
                    E-posta adresinizi girin, size bağlantı gönderelim.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@sirket.com"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 text-slate-800 placeholder-slate-300 transition-all text-sm focus:border-[#00C4CC] focus:ring-4 focus:ring-[#00C4CC]/10"
                      style={{ borderColor: '#E2E8F0' }}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-60 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    style={{ background: 'linear-gradient(135deg, #1B3D4F 0%, #0f2a38 100%)' }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Kontrol ediliyor…
                      </span>
                    ) : 'Giriş Yap →'}
                  </button>

                  <p className="text-center text-xs text-slate-400 pt-1">
                    İlk girişte e-postanıza bağlantı gönderilir — sonrasında direkt giriş yapılır.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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

    // Hash-based magic link /login adresine düştüyse yakala
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

    // URL'deki hata mesajını göster
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

      // Yanıt JSON değilse (500 HTML sayfası gibi) hata yakala
      let data
      try {
        data = await res.json()
      } catch {
        setError(`Sunucu hatası (HTTP ${res.status})`)
        return
      }

      if (data.error) {
        setError(data.error)
        return
      }

      if (data.redirect) {
        // Kayıtlı kullanıcı: Supabase verify URL'e yönlendir (e-posta gitmez)
        window.location.href = data.redirect
        return
      }

      if (data.sent) {
        // Yeni kullanıcı: magic link gönderildi
        setSent(true)
      }
    } catch (err) {
      setError('Bağlantı hatası: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--portal-page)' }}
    >
      <div className="w-full max-w-md">
        {/* ND Logosu */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'var(--portal-sidebar)' }}
          >
            <span className="text-white text-3xl font-bold tracking-tight">ND</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--portal-sidebar)' }}>
            Nokta Dizayn Portal
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Mimari Proje Yönetim Platformu</p>
        </div>

        {/* Kart */}
        <div
          className="bg-white rounded-2xl shadow-sm border p-8"
          style={{ borderColor: 'var(--portal-border)' }}
        >
          {sent ? (
            /* Yeni kullanıcı: magic link gönderildi */
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#e0fafa' }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: 'var(--portal-cyan)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Bağlantı Gönderildi</h2>
              <p className="text-slate-500 text-sm mb-1">
                <strong>{email}</strong> adresine giriş bağlantısı gönderildi.
              </p>
              <p className="text-slate-400 text-xs mb-4">
                Bağlantıya tıklayın — bir sonraki girişte sadece e-postanızı yazmanız yeterli.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-xs underline"
                style={{ color: 'var(--portal-cyan)' }}
              >
                Farklı e-posta dene
              </button>
            </div>
          ) : (
            /* Giriş formu */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  className="w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 transition-colors focus:ring-2 focus:ring-[#00C4CC]"
                  style={{ borderColor: 'var(--portal-border)' }}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-60 hover:opacity-90"
                style={{ background: 'var(--portal-sidebar)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Kontrol ediliyor...
                  </span>
                ) : (
                  'Giriş Yap'
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                İlk girişte e-postanıza bağlantı gönderilir — sonrasında doğrudan giriş yapılır.
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 ND Group — Nokta Dizayn
        </p>
      </div>
    </div>
  )
}

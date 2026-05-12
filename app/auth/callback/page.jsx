'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default function AuthCallbackPage() {
  useEffect(() => {
    async function handle() {
      const sb = getSupabase()
      const hash   = window.location.hash
      const search = new URLSearchParams(window.location.search)
      const code      = search.get('code')
      const tokenHash = search.get('token_hash')
      const type      = search.get('type') ?? 'email'
      const next      = search.get('next') ?? '/projects'

      let err = null

      if (hash && hash.includes('access_token')) {
        // Implicit / hash flow — Supabase döndürdüğü token'ları hash'e koyuyor
        const hp = new URLSearchParams(hash.slice(1))
        const { error } = await sb.auth.setSession({
          access_token:  hp.get('access_token'),
          refresh_token: hp.get('refresh_token'),
        })
        err = error
      } else if (code) {
        // PKCE flow
        const { error } = await sb.auth.exchangeCodeForSession(code)
        err = error
      } else if (tokenHash) {
        // OTP / magic-link flow
        const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type })
        err = error
      }

      if (err) {
        window.location.replace(
          `/login?error=${encodeURIComponent(err.message)}`
        )
      } else {
        window.location.replace(next)
      }
    }

    handle()
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--portal-page)' }}
    >
      <p className="text-slate-500 text-sm">Oturum açılıyor…</p>
    </div>
  )
}

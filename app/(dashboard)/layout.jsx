import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignoutButton } from '@/components/signout-button'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Kenar Çubuğu */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: 'var(--portal-sidebar)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ background: 'var(--portal-cyan)' }}
            >
              ND
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Nokta Dizayn</p>
              <p className="text-white/40 text-xs">Portal v6</p>
            </div>
          </div>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 p-4 space-y-1">
          <a
            href="/projects"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            Projeler
          </a>
        </nav>

        {/* Kullanıcı */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: 'rgba(0,196,204,0.2)', color: 'var(--portal-cyan)' }}
            >
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs truncate">{user.email}</p>
            </div>
            <SignoutButton />
          </div>
        </div>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 overflow-auto" style={{ background: 'var(--portal-page)' }}>
        {children}
      </main>
    </div>
  )
}

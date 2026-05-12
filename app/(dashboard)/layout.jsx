import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignoutButton } from '@/components/signout-button'

const NAV = [
  {
    href: '/projects',
    label: 'Projeler',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
]

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const initials = user.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* ── Kenar Çubuğu ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col" style={{ background: 'var(--portal-sidebar)' }}>

        {/* Logo Alanı */}
        <div className="px-6 pt-8 pb-7">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #00C4CC 0%, #0099A8 100%)' }}
            >
              ND
            </div>
            <div>
              <p className="text-white text-base font-bold leading-tight tracking-tight">Nokta Dizayn</p>
              <p className="text-[#00C4CC]/70 text-xs font-medium mt-0.5">Portal v6</p>
            </div>
          </div>
        </div>

        <div className="mx-6 h-px bg-white/8 mb-4" />

        {/* Navigasyon */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menü</p>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-white/65 hover:text-white hover:bg-white/10 transition-all text-sm font-medium group"
            >
              <span className="text-white/40 group-hover:text-[#00C4CC] transition-colors flex-shrink-0">
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Kullanıcı Alanı */}
        <div className="p-4 mx-3 mb-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow"
              style={{ background: 'linear-gradient(135deg, #00C4CC22 0%, #00C4CC44 100%)', color: '#00C4CC' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-medium truncate">{user.email}</p>
              <p className="text-white/30 text-[10px] mt-0.5">Giriş yapıldı</p>
            </div>
            <SignoutButton />
          </div>
        </div>
      </aside>

      {/* ── Ana İçerik ── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

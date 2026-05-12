'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignoutButton() {
  const router = useRouter()

  async function handleSignout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignout}
      className="text-xs text-white/40 hover:text-white/80 transition-colors"
    >
      Çıkış
    </button>
  )
}

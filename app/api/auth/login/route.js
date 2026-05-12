import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Her zaman yetkili admin e-postaları (authorized_emails tablosuna ek güvence)
const ALWAYS_ALLOWED = [
  'ndgroupcompnies@gmail.com',
  'adnan.ipekli@gmail.com',
  'gozdeipekli@gmail.com',
  'turnaertan@gmail.com',
]

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function POST(request) {
  try {
    const body   = await request.json()
    const email  = (body.email ?? '').trim().toLowerCase()
    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    if (!email) {
      return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 })
    }

    const serviceRoleOk =
      process.env.SUPABASE_SERVICE_ROLE &&
      !process.env.SUPABASE_SERVICE_ROLE.startsWith('your-')

    if (serviceRoleOk) {
      const admin = adminClient()

      // ── 1. Halihazırda doğrulanmış portal kullanıcısı → direkt giriş ──
      const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({
        page: 1, perPage: 1000,
      })

      if (!listErr) {
        const authUser = users?.find(u => u.email === email)

        if (authUser?.email_confirmed_at) {
          // Onaylı kullanıcı → e-posta göndermeden magic link oluştur
          const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: `${origin}/auth/callback` },
          })

          if (linkErr || !linkData?.properties?.action_link) {
            console.error('[auth/login] generateLink:', linkErr?.message)
            return NextResponse.json(
              { error: 'Giriş bağlantısı oluşturulamadı' },
              { status: 500 }
            )
          }

          return NextResponse.json({ redirect: linkData.properties.action_link })
        }
      }

      // ── 2. Yeni kullanıcı → CRM yetki kontrolü ──
      const isAdmin = ALWAYS_ALLOWED.includes(email)

      if (!isAdmin) {
        const { data: authRow } = await admin
          .from('authorized_emails')
          .select('id')
          .eq('email', email)
          .eq('is_active', true)
          .maybeSingle()

        if (!authRow) {
          return NextResponse.json(
            { error: 'Bu e-posta portala erişim yetkisine sahip değil. CRM üzerinden yetkilendirme talep edin.' },
            { status: 403 }
          )
        }
      }
    }

    // ── 3. Yetkili yeni kullanıcı → magic link e-postası gönder ──
    const { error: otpErr } = await anonClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    })

    if (otpErr) {
      return NextResponse.json({ error: otpErr.message }, { status: 400 })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[auth/login] beklenmeyen hata:', err)
    return NextResponse.json({ error: 'Sunucu hatası: ' + err.message }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'

// Servis rolü istemcisi — yalnızca sunucu tarafında çağır, istemciye verme
export function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key || key === 'your-service-role-key-here') {
    throw new Error('SUPABASE_SERVICE_ROLE env değişkeni ayarlanmamış')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

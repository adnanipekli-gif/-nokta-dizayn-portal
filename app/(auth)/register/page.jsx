import { redirect } from 'next/navigation'

// Magic link ile kayıt ve giriş tek adımda gerçekleşir.
// Kayıt sayfası giriş sayfasına yönlendirir.
export default function RegisterPage() {
  redirect('/login')
}

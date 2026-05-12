import { redirect } from 'next/navigation'

// Kök rota doğrudan /projects'e yönlendirir;
// oturum yoksa middleware /login'e atar.
export default function RootPage() {
  redirect('/projects')
}

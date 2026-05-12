import './globals.css'

export const metadata = {
  title: 'Nokta Dizayn Portal',
  description: 'ND Group Mimari Proje Yönetim Platformu v6',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}

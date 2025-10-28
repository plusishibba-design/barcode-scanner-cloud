import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'バーコードスキャナー',
  description: 'クラウド対応バーコードスキャンシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

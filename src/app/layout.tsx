import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SOW Spelling Bee Championship 2026',
  description: 'Register for the Seat of Wisdom Group of Schools Spelling Bee Championship 2026 — Building Champions, Spelling the Future.',
  openGraph: {
    title: 'SOW Spelling Bee Championship 2026',
    description: 'Register now for the biggest spelling competition in Ibadan!',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

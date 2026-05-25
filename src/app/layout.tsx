import React from 'react'
import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'GS AI Supply Chain | Goldman Sachs Research',
  description: 'Comprehensive mapping of the global AI supply chain — 150+ companies across 10 structural layers. Goldman Sachs Global Investment Research.',
  keywords: ['AI supply chain', 'Goldman Sachs', 'semiconductor', 'NVIDIA', 'AI infrastructure'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0E11',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}

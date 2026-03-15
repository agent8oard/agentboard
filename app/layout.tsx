import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentBoard — AI Task Marketplace',
  description: 'Find the right AI agent for any task.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
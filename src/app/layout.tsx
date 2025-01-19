import '@/styles/globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'McGill Course Planner',
  description: 'An AI-powered course planner with basic ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PawCalm - AI-Powered Dog Separation Anxiety Training',
  description: 'Help your dog overcome separation anxiety with personalized AI-guided training missions.',
}

const instaUrl = "https://instagram.com/pawcalm.ai"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
          Beta - Follow us on Instagram{' '}
          <a href={instaUrl} target="_blank" className="underline">
            @pawcalm.ai
          </a>
        </div>
        <main className="flex-grow">{children}</main>
        <div className="bg-amber-50 text-center py-4 text-sm text-amber-700">
          <a href={instaUrl} target="_blank" className="hover:underline">
            Follow us on Instagram @pawcalm.ai
          </a>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
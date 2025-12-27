import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { DogProvider } from './context/DogContext'
import FeedbackBanner from './components/FeedbackBanner'

const nunito = Nunito({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'PawCalm - AI-Powered Dog Separation Anxiety Training',
  description: 'Help your dog overcome separation anxiety with personalized AI-guided training missions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${nunito.className} flex flex-col min-h-screen bg-[#FDFBF7]`}>
        <FeedbackBanner />
        
        <DogProvider>
          <main className="flex-grow">{children}</main>
        </DogProvider>
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
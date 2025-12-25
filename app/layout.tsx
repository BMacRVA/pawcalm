import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { DogProvider } from './context/DogContext'

const nunito = Nunito({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

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
      <body className={`${nunito.className} flex flex-col min-h-screen bg-[#FDFBF7]`}>
        {/* Beta Banner */}
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
          Beta - Follow us on Instagram{' '}
          <a href={instaUrl} target="_blank" className="underline">
            @pawcalm.ai
          </a>
        </div>
        
        <DogProvider>
          <main className="flex-grow">{children}</main>
        </DogProvider>
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
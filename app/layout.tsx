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
  title: 'PawCalm - Dog Separation Anxiety Training App | Free',
  description: 'Help your anxious dog in 5 minutes a day. Free app for separation anxiety training with daily desensitization practice, progress tracking, and AI coaching.',
  keywords: ['dog separation anxiety', 'separation anxiety training', 'dog anxiety app', 'dog anxiety when left alone', 'separation anxiety help', 'dog desensitization', 'anxious dog help', 'dog panic when leaving'],
  authors: [{ name: 'PawCalm' }],
  creator: 'PawCalm',
  metadataBase: new URL('https://pawcalm.ai'),
  openGraph: {
    title: 'PawCalm - Dog Separation Anxiety Training App',
    description: 'Help your anxious dog in 5 minutes a day. Free daily practice, progress tracking, and AI coaching.',
    url: 'https://pawcalm.ai',
    siteName: 'PawCalm',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PawCalm - Dog Separation Anxiety Training App',
    description: 'Help your anxious dog in 5 minutes a day. Free daily practice, progress tracking, and AI coaching.',
    creator: '@pawcalm',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here later
    // google: 'your-verification-code',
  },
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
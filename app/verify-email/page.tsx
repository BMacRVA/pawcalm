'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../supabase'
import { Suspense } from 'react'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check if this is a verification callback
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.email_confirmed_at) {
        setStatus('success')
        setEmail(session.user.email || null)
      }
    }

    // Check for error in URL
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (error) {
      console.error('Verification error:', errorDescription)
      setStatus('error')
    } else {
      checkVerification()
    }
  }, [searchParams])

  const resendVerification = async () => {
    const emailInput = prompt('Enter your email address:')
    if (!emailInput) return

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailInput,
    })

    if (error) {
      alert('Failed to resend verification email. Please try again.')
    } else {
      alert('Verification email sent! Check your inbox.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Nav */}
      <nav className="bg-[#FDFBF7] border-b border-amber-900/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🐾</span>
            </div>
            <span className="font-semibold text-amber-950 text-xl tracking-tight">PawCalm</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {status === 'pending' && (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Check your email
              </h1>
              <p className="text-gray-600 mb-6">
                We sent you a verification link. Click it to activate your account and start helping your dog.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Didn&apos;t get the email?</strong> Check your spam folder, or click below to resend.
                </p>
              </div>
              <button
                onClick={resendVerification}
                className="text-amber-600 hover:text-amber-700 font-medium text-sm"
              >
                Resend verification email
              </button>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Email verified!
              </h1>
              <p className="text-gray-600 mb-6">
                {email && <>Welcome, <strong>{email}</strong>! </>}
                Your account is ready. Let&apos;s get started.
              </p>
              <Link
                href="/onboarding"
                className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-semibold transition"
              >
                Add Your Dog →
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Verification failed
              </h1>
              <p className="text-gray-600 mb-6">
                The verification link may have expired or already been used.
              </p>
              <button
                onClick={resendVerification}
                className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-semibold transition mb-4"
              >
                Resend Verification Email
              </button>
              <div>
                <Link
                  href="/login"
                  className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
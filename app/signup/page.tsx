'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../supabase'
import { ArrowLeft } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleGoogleSignup = async () => {
    if (!agreed) {
      setMessage('You must agree to the Terms, Privacy Policy, and Disclaimer')
      return
    }
    
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })
    
    if (error) {
      setMessage(error.message)
      setGoogleLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreed) {
      setMessage('You must agree to the Terms, Privacy Policy, and Disclaimer')
      return
    }
    
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/onboarding')
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-amber-900/5 p-8">
      <h1 className="text-3xl font-bold text-amber-950 mb-2">
        Create Account
      </h1>
      <p className="text-amber-800/70 mb-8">
        Start your dog&apos;s calm journey today
      </p>

      {/* Consent checkbox - FIRST */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="terms" className="text-sm text-amber-900">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-amber-700 font-semibold hover:underline">Terms of Service</a>
            ,{' '}
            <a href="/privacy" target="_blank" className="text-amber-700 font-semibold hover:underline">Privacy Policy</a>
            , and{' '}
            <a href="/disclaimer" target="_blank" className="text-amber-700 font-semibold hover:underline">Disclaimer</a>.
            <span className="block mt-2 text-amber-700">
              I understand this is a <strong>beta service</strong> that provides AI-generated suggestions, 
              <strong> not professional veterinary or dog training advice</strong>.
            </span>
          </label>
        </div>
      </div>

      {/* Google Sign Up Button */}
      <button
        onClick={handleGoogleSignup}
        disabled={googleLoading || !agreed}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? 'Connecting...' : 'Continue with Google'}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-amber-900 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none text-amber-950 bg-white placeholder-amber-300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-900 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none text-amber-950 bg-white placeholder-amber-300"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !agreed}
          className="w-full bg-amber-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-amber-700 transition-all hover:scale-[1.02] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Creating Account...' : 'Create Account →'}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-center text-sm text-red-600">{message}</p>
        </div>
      )}

      <p className="mt-6 text-center text-amber-800/70">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-700 font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Nav */}
      <nav className="bg-[#FDFBF7] border-b border-amber-900/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="p-2 -ml-2 hover:bg-amber-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-amber-700" />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🐾</span>
              </div>
              <span className="font-semibold text-amber-950 text-xl tracking-tight">PawCalm</span>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">BETA</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-amber-900/5 p-8 text-center">
            <p className="text-amber-800/70">Loading...</p>
          </div>
        }>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
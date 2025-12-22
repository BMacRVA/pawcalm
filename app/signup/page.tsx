'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../supabase'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Pre-fill email from landing page
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

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
      window.location.href = '/onboarding'
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Nav */}
      <nav className="bg-[#FDFBF7] border-b border-amber-900/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🐾</span>
            </div>
            <span className="font-semibold text-amber-950 text-xl tracking-tight">PawCalm</span>
            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">BETA</span>
          </Link>
        </div>
      </nav>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-amber-900/5 p-8">
          <h1 className="text-3xl font-bold text-amber-950 mb-2">
            Create Account
          </h1>
          <p className="text-amber-800/70 mb-8">
            Start your dog's calm journey today
          </p>

          <form onSubmit={handleSignup} className="space-y-6">
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

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
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
            <a href="/login" className="text-amber-700 font-semibold hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
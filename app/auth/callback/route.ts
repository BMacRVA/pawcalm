'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        // No session, send to login
        router.push('/login')
        return
      }

      // Check if user has any dogs (existing user)
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)

      if (dogs && dogs.length > 0) {
        // Existing user with dogs → dashboard
        router.push('/dashboard')
      } else {
        // New user without dogs → onboarding
        router.push('/onboarding')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
      <p className="text-gray-600">Setting up your account...</p>
    </div>
  )
}
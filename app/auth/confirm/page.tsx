'use client'

import { useEffect } from 'react'
import { supabase } from '../../supabase'

export default function AuthConfirm() {
  useEffect(() => {
    const handleAuth = async () => {
      // Get session from URL hash (Supabase puts tokens there)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Check if user has a dog profile
        const { data: dogs } = await supabase
          .from('dogs')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
        
        if (dogs && dogs.length > 0) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/onboarding'
        }
      } else {
        // No session, go to onboarding anyway
        window.location.href = '/onboarding'
      }
    }

    handleAuth()
  }, [])

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-amber-800">Setting up your account...</p>
      </div>
    </div>
  )
}
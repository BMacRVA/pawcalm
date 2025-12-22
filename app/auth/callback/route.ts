import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Exchange code for session
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (session?.user) {
      // Check if user has a dog profile
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
      
      // If they have a dog, go to dashboard. Otherwise, onboarding.
      if (dogs && dogs.length > 0) {
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
      }
    }
  }

  // New user or no dogs → onboarding
  return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
}
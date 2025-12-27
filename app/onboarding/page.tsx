'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { Button } from '../components/ui/Button'
import { Loader2 } from 'lucide-react'

// Default cues - no API needed
const DEFAULT_CUES = [
  'Pick up your keys',
  'Put on your shoes',
  'Grab your bag',
  'Touch the door handle',
  'Put on your jacket',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [dogName, setDogName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!dogName.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Create dog
    const { data: newDog, error } = await supabase
      .from('dogs')
      .insert([{
        name: dogName.trim(),
        user_id: user.id,
        severity: 'moderate',
        baseline: 5,
        guidance_level: 'moderate',
      }])
      .select()

    if (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    if (newDog && newDog[0]) {
      // Auto-select this dog
      localStorage.setItem('selectedDogId', newDog[0].id)
console.log('Set selectedDogId:', newDog[0].id)
      
 // Create default cues immediately
const cuesToInsert = DEFAULT_CUES.map(name => ({
  dog_id: newDog[0].id,
  name: name,
  instructions: 'Do this action calmly while your dog watches',
  success_looks_like: 'Your dog stays relaxed',
  if_struggling: 'Try doing it more slowly or from further away',
}))

const { error: cueError } = await supabase.from('custom_cues').insert(cuesToInsert)
if (cueError) console.error('Cue insert error:', cueError)
    }

    // Go straight to practice
    router.push('/practice')
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          
          <div className="text-center mb-8">
            <span className="text-7xl">🐕</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
            What&apos;s your dog&apos;s name?
          </h1>

          <input
            type="text"
            value={dogName}
            onChange={(e) => setDogName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Luna"
            autoFocus
            className="w-full px-6 py-4 text-xl text-center border-2 border-gray-200 rounded-2xl focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-300"
          />

          <Button
            onClick={handleStart}
            disabled={!dogName.trim() || loading}
            fullWidth
            size="lg"
            className="mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up...
              </>
            ) : (
              "Let's start →"
            )}
          </Button>

          <p className="text-center text-gray-400 text-sm mt-6">
            Takes about 2 minutes a day
          </p>

        </div>
      </main>
    </div>
  )
}
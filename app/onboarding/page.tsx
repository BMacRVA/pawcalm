'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { Button } from '../components/ui/Button'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

const DEFAULT_CUES = [
  { name: 'Pick up keys', icon: '🔑', instructions: 'Pick up your keys, hold them for a moment, then put them down. Don\'t make eye contact with your dog. Repeat 10 times.' },
  { name: 'Put on shoes', icon: '👟', instructions: 'Put on your shoes slowly while your dog watches. Then sit back down. Repeat 10 times.' },
  { name: 'Grab jacket', icon: '🧥', instructions: 'Pick up your jacket or coat, hold it, then hang it back up. Repeat 10 times.' },
  { name: 'Touch door handle', icon: '🚪', instructions: 'Walk to the door, touch the handle, then walk away. Repeat 10 times.' },
  { name: 'Pick up bag', icon: '👜', instructions: 'Pick up your work bag or purse, hold it briefly, set it down. Repeat 10 times.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dogName, setDogName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    if (!dogName.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Create the dog
    const { data: dog, error } = await supabase
      .from('dogs')
      .insert({
        user_id: user.id,
        name: dogName.trim(),
      })
      .select()
      .single()

    if (error || !dog) {
      console.error('Error creating dog:', error)
      setLoading(false)
      return
    }

    // Create default cues
    const cuesToInsert = DEFAULT_CUES.map(cue => ({
      dog_id: dog.id,
      name: cue.name,
      icon: cue.icon,
      instructions: cue.instructions,
      success_looks_like: `${dogName} stays relaxed and doesn't react`,
      if_struggling: 'Try doing it more slowly, or from further away from your dog',
    }))

    await supabase.from('custom_cues').insert(cuesToInsert)

    // Store selected dog in localStorage
    localStorage.setItem('selectedDogId', dog.id)

    router.push('/dashboard')
  }

  const nextStep = () => setStep(s => Math.min(s + 1, 4))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Progress dots */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-amber-500' : i < step ? 'bg-amber-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 flex flex-col">
        
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">🐕</span>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Your dog can learn to be calm alone
              </h1>
              <p className="text-gray-600 text-lg">
                Separation anxiety is treatable. We'll show you how.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: The Problem */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">😰</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Why does this happen?
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                Your dog has learned that certain things—keys, shoes, your jacket—mean you're leaving.
              </p>
              <p className="text-gray-600 text-lg">
                This triggers panic. Not bad behavior. <strong>Panic.</strong>
              </p>
            </div>
            
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-red-800 text-sm">
                <strong>What doesn't work:</strong> Crating, ignoring, punishment, or "letting them cry it out." These make anxiety worse.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: The Solution */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">💡</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                The solution: Desensitization
              </h1>
              <p className="text-gray-600 text-lg">
                We break down "leaving" into tiny steps and practice each one until your dog stops reacting.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <span className="text-2xl">🔑</span>
                <div>
                  <p className="font-medium text-gray-900">Pick up keys</p>
                  <p className="text-sm text-gray-500">Then put them down. Repeat.</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <span className="text-2xl">🚪</span>
                <div>
                  <p className="font-medium text-gray-900">Touch door handle</p>
                  <p className="text-sm text-gray-500">Then walk away. Repeat.</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <span className="text-2xl">👟</span>
                <div>
                  <p className="font-medium text-gray-900">Put on shoes</p>
                  <p className="text-sm text-gray-500">Then take them off. Repeat.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: How PawCalm Helps */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">📱</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                How PawCalm helps
              </h1>
              <p className="text-gray-600 text-lg">
                We guide you through daily practice and track your dog's progress.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Daily guided practice</p>
                  <p className="text-sm text-gray-500">5 minutes a day is all it takes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Track what's working</p>
                  <p className="text-sm text-gray-500">See which cues your dog has mastered</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI coach</p>
                  <p className="text-sm text-gray-500">Get personalized advice when you're stuck</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Dog Name */}
        {step === 4 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">🐾</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Let's get started
              </h1>
              <p className="text-gray-600 text-lg">
                What's your dog's name?
              </p>
            </div>
            
            <input
              type="text"
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              placeholder="e.g., Bailey"
              autoFocus
              className="w-full px-4 py-4 text-xl text-center border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
            
            <p className="text-center text-gray-400 text-sm mt-4">
              We'll set up 5 common departure cues to start with. You can customize later.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-4">
        {step === 0 ? (
          <Button onClick={nextStep} fullWidth size="lg">
            Get Started
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : step < 4 ? (
          <div className="flex gap-3">
            <Button onClick={prevStep} variant="secondary" size="lg" className="px-4">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button onClick={nextStep} fullWidth size="lg">
              Continue
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button onClick={prevStep} variant="secondary" size="lg" className="px-4">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              onClick={handleComplete} 
              fullWidth 
              size="lg"
              disabled={!dogName.trim() || loading}
            >
              {loading ? 'Setting up...' : `Start helping ${dogName || 'your dog'}`}
            </Button>
          </div>
        )}
        
        {step > 0 && step < 4 && (
          <button 
            onClick={() => setStep(4)}
            className="w-full text-center text-gray-400 text-sm mt-4 py-2"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
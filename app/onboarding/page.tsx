'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../supabase'
import { Button } from '../components/ui/Button'
import { ChevronRight, ChevronLeft, Check, Plus, X, Loader2 } from 'lucide-react'

const DEFAULT_CUES = [
  { id: 'keys', name: 'Pick up keys', icon: '🔑', instructions: 'Pick up your keys, hold them for a moment, then put them down. Don\'t make eye contact with your dog. Repeat 10 times.' },
  { id: 'shoes', name: 'Put on shoes', icon: '👟', instructions: 'Put on your shoes slowly while your dog watches. Then sit back down. Repeat 10 times.' },
  { id: 'jacket', name: 'Grab jacket', icon: '🧥', instructions: 'Pick up your jacket or coat, hold it, then hang it back up. Repeat 10 times.' },
  { id: 'door', name: 'Touch door handle', icon: '🚪', instructions: 'Walk to the door, touch the handle, then walk away. Repeat 10 times.' },
  { id: 'bag', name: 'Pick up bag', icon: '👜', instructions: 'Pick up your work bag or purse, hold it briefly, set it down. Repeat 10 times.' },
  { id: 'car', name: 'Car sounds', icon: '🚗', instructions: 'Jingle your car keys or press the unlock button. Don\'t go outside. Repeat 10 times.' },
  { id: 'garage', name: 'Garage door', icon: '🏠', instructions: 'Press the garage door button, then press it again to stop. Or just hold the remote. Repeat 10 times.' },
  { id: 'alarm', name: 'Turn off alarm', icon: '⏰', instructions: 'Walk to your alarm panel or pick up your phone as if disabling an alarm. Repeat 10 times.' },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAddingDog = searchParams.get('add') === 'true'
  
  const [step, setStep] = useState(0)
  const [dogName, setDogName] = useState('')
  const [selectedCues, setSelectedCues] = useState<string[]>(['keys', 'shoes', 'door'])
  const [customCue, setCustomCue] = useState('')
  const [customCues, setCustomCues] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // If adding another dog, skip to cue selection (step 4)
  useEffect(() => {
    if (isAddingDog) {
      setStep(4)
    }
  }, [isAddingDog])

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

    // Create selected default cues
    const defaultCuesToInsert = DEFAULT_CUES
      .filter(cue => selectedCues.includes(cue.id))
      .map(cue => ({
        dog_id: dog.id,
        name: cue.name,
        icon: cue.icon,
        instructions: cue.instructions,
        success_looks_like: `${dogName} stays relaxed and doesn't react`,
        if_struggling: 'Try doing it more slowly, or from further away from your dog',
      }))

    // Create custom cues
    const customCuesToInsert = customCues.map(cueName => ({
      dog_id: dog.id,
      name: cueName,
      icon: '🎯',
      instructions: `Perform "${cueName}" while your dog watches. Don't make eye contact. Repeat 10 times.`,
      success_looks_like: `${dogName} stays relaxed and doesn't react`,
      if_struggling: 'Try doing it more slowly, or from further away from your dog',
    }))

    const allCues = [...defaultCuesToInsert, ...customCuesToInsert]
    
    if (allCues.length > 0) {
      await supabase.from('custom_cues').insert(allCues)
    }

    // Store selected dog in localStorage
    localStorage.setItem('selectedDogId', dog.id)

    router.push('/dashboard')
  }

  const toggleCue = (cueId: string) => {
    setSelectedCues(prev => 
      prev.includes(cueId) 
        ? prev.filter(id => id !== cueId)
        : [...prev, cueId]
    )
  }

  const addCustomCue = () => {
    if (customCue.trim() && !customCues.includes(customCue.trim())) {
      setCustomCues(prev => [...prev, customCue.trim()])
      setCustomCue('')
    }
  }

  const removeCustomCue = (cue: string) => {
    setCustomCues(prev => prev.filter(c => c !== cue))
  }

  const nextStep = () => setStep(s => Math.min(s + 1, 5))
  const prevStep = () => {
    // If adding a dog and on step 4, go back to dashboard instead
    if (isAddingDog && step === 4) {
      router.push('/dashboard')
      return
    }
    setStep(s => Math.max(s - 1, 0))
  }

  const totalSelectedCues = selectedCues.length + customCues.length

  // Calculate progress dots - show fewer if adding dog
  const totalSteps = isAddingDog ? 2 : 6
  const currentStepIndex = isAddingDog ? (step === 4 ? 0 : 1) : step

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Progress dots */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStepIndex ? 'w-6 bg-amber-500' : i < currentStepIndex ? 'bg-amber-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        {isAddingDog && (
          <p className="text-center text-gray-500 text-sm mt-2">Adding another dog</p>
        )}
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

        {/* Step 4: Select Cues */}
        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <div className="text-center mb-6">
              <span className="text-5xl mb-3 block">🎯</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isAddingDog ? 'What triggers this dog?' : 'What triggers your dog?'}
              </h1>
              <p className="text-gray-600">
                Select the things that make {isAddingDog ? 'them' : 'your dog'} anxious when you're leaving
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {DEFAULT_CUES.map(cue => (
                  <button
                    key={cue.id}
                    onClick={() => toggleCue(cue.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedCues.includes(cue.id)
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cue.icon}</span>
                      <span className={`text-sm font-medium ${
                        selectedCues.includes(cue.id) ? 'text-amber-900' : 'text-gray-700'
                      }`}>
                        {cue.name.replace('Pick up ', '').replace('Put on ', '').replace('Touch ', '').replace('Grab ', '')}
                      </span>
                    </div>
                    {selectedCues.includes(cue.id) && (
                      <div className="mt-1">
                        <Check className="w-4 h-4 text-amber-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom cues */}
              {customCues.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Your custom cues:</p>
                  <div className="flex flex-wrap gap-2">
                    {customCues.map(cue => (
                      <div 
                        key={cue}
                        className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{cue}</span>
                        <button onClick={() => removeCustomCue(cue)} className="hover:text-amber-900">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom cue */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCue}
                  onChange={(e) => setCustomCue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomCue()}
                  placeholder="Add something else..."
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={addCustomCue}
                  disabled={!customCue.trim()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50 transition"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <p className="text-center text-gray-400 text-sm mt-4">
                {totalSelectedCues} cue{totalSelectedCues !== 1 ? 's' : ''} selected • You can add more later
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Dog Name */}
        {step === 5 && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">🐾</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {isAddingDog ? 'What\'s this dog\'s name?' : 'Almost there!'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isAddingDog ? 'Enter the name of your other dog' : 'What\'s your dog\'s name?'}
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
              We'll set up {totalSelectedCues} cue{totalSelectedCues !== 1 ? 's' : ''} for you to practice
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
        ) : step === 4 ? (
          <div className="flex gap-3">
            <Button onClick={prevStep} variant="secondary" size="lg" className="px-4">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              onClick={nextStep} 
              fullWidth 
              size="lg"
              disabled={totalSelectedCues === 0}
            >
              Continue with {totalSelectedCues} cue{totalSelectedCues !== 1 ? 's' : ''}
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
              {loading ? 'Setting up...' : isAddingDog ? `Add ${dogName || 'dog'}` : `Start helping ${dogName || 'your dog'}`}
            </Button>
          </div>
        )}
        
        {step > 0 && step < 4 && !isAddingDog && (
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

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
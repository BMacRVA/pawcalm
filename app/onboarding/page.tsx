'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressRing } from '../components/ui/ProgressRing'
import { ArrowLeft, Check } from 'lucide-react'

const COMMON_TRIGGERS = [
  { id: 'keys', label: 'Picking up keys', icon: '🔑' },
  { id: 'shoes', label: 'Putting on shoes', icon: '👟' },
  { id: 'jacket', label: 'Putting on jacket/coat', icon: '🧥' },
  { id: 'bag', label: 'Grabbing bag or purse', icon: '👜' },
  { id: 'door', label: 'Going near the door', icon: '🚪' },
  { id: 'morning', label: 'Morning routine', icon: '🌅' },
  { id: 'shower', label: 'Taking a shower', icon: '🚿' },
  { id: 'makeup', label: 'Getting ready/makeup', icon: '💄' },
  { id: 'coffee', label: 'Making coffee to go', icon: '☕' },
  { id: 'laptop', label: 'Packing laptop/work bag', icon: '💻' },
]

const COMMON_BEHAVIORS = [
  { id: 'barking', label: 'Barking or howling', icon: '🗣️' },
  { id: 'pacing', label: 'Pacing or restlessness', icon: '🚶' },
  { id: 'whining', label: 'Whining or crying', icon: '😢' },
  { id: 'destruction', label: 'Destructive behavior', icon: '💥' },
  { id: 'accidents', label: 'Bathroom accidents', icon: '💧' },
  { id: 'escape', label: 'Trying to escape', icon: '🏃' },
  { id: 'drooling', label: 'Excessive drooling', icon: '💦' },
  { id: 'following', label: 'Following you everywhere', icon: '👀' },
  { id: 'shaking', label: 'Trembling or shaking', icon: '😰' },
  { id: 'noteat', label: 'Won\'t eat when alone', icon: '🍽️' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Step 1: Basic info
  const [dogName, setDogName] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  
  // Step 2: Triggers
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [customTrigger, setCustomTrigger] = useState('')
  const [customTriggers, setCustomTriggers] = useState<string[]>([])
  
  // Step 3: Behaviors
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([])
  const [otherBehavior, setOtherBehavior] = useState('')
  
  // Step 4: Severity & Context
  const [severity, setSeverity] = useState('moderate')
  const [baseline, setBaseline] = useState('')
  const [ownerSchedule, setOwnerSchedule] = useState('')
  const [leaveDuration, setLeaveDuration] = useState('')

  const toggleTrigger = (id: string) => {
    setSelectedTriggers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const addCustomTrigger = () => {
    if (customTrigger.trim() && !customTriggers.includes(customTrigger.trim())) {
      setCustomTriggers([...customTriggers, customTrigger.trim()])
      setCustomTrigger('')
    }
  }

  const toggleBehavior = (id: string) => {
    setSelectedBehaviors(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Please log in first')
      router.push('/login')
      return
    }

    const behaviorLabels = selectedBehaviors.map(id => 
      COMMON_BEHAVIORS.find(b => b.id === id)?.label
    ).filter(Boolean)
    const behaviorText = [...behaviorLabels, otherBehavior].filter(Boolean).join(', ')

    const { error } = await supabase
      .from('dogs')
      .insert([{
        name: dogName,
        breed: breed,
        age: age,
        baseline: parseInt(baseline) || 5,
        behavior: behaviorText,
        triggers: selectedTriggers,
        behaviors: selectedBehaviors,
        severity: severity,
        owner_schedule: ownerSchedule,
        leave_duration: leaveDuration,
        custom_triggers: customTriggers,
        user_id: user.id,
      }])

    setLoading(false)

    if (error) {
      console.error('Error:', error)
      alert('Error saving: ' + error.message)
    } else {
      router.push('/welcome')
    }
  }

  const stepTitles = [
    { title: "Let's meet your dog", subtitle: "We'll use this to personalize everything" },
    { title: `What triggers ${dogName || 'your dog'}?`, subtitle: `Select anything that makes ${dogName || 'them'} anxious` },
    { title: `How does ${dogName || 'your dog'} react?`, subtitle: "What happens when you leave or prepare to leave?" },
    { title: "Almost done!", subtitle: `A few more details to personalize ${dogName || 'your dog'}'s plan` },
  ]

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="sticky top-0 bg-[#FDFBF7] border-b border-gray-100 px-4 py-4 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? 'w-8 bg-amber-500' : s < step ? 'w-2 bg-amber-500' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <span className="text-sm text-gray-500 w-10 text-right">{step}/4</span>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card variant="elevated" padding="lg">
              <div className="text-center mb-6">
                <span className="text-5xl mb-3 block">🐕</span>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{stepTitles[0].title}</h1>
                <p className="text-gray-600">{stepTitles[0].subtitle}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    What&apos;s your dog&apos;s name?
                  </label>
                  <input
                    type="text"
                    value={dogName}
                    onChange={(e) => setDogName(e.target.value)}
                    placeholder="e.g., Luna"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Breed
                  </label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g., Labrador Mix"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Age
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'puppy', label: 'Puppy', sub: '0-1 year' },
                      { value: 'young', label: 'Young', sub: '1-3 years' },
                      { value: 'adult', label: 'Adult', sub: '3-7 years' },
                      { value: 'senior', label: 'Senior', sub: '7+ years' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAge(opt.value)}
                        className={`p-3 rounded-xl border-2 text-left transition ${
                          age === opt.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <p className={`font-semibold ${age === opt.value ? 'text-amber-700' : 'text-gray-900'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!dogName || !breed || !age}
                  fullWidth
                  size="lg"
                  className="mt-4"
                >
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Triggers */}
          {step === 2 && (
            <Card variant="elevated" padding="lg">
              <div className="text-center mb-6">
                <span className="text-5xl mb-3 block">🔑</span>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{stepTitles[1].title}</h1>
                <p className="text-gray-600">{stepTitles[1].subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {COMMON_TRIGGERS.map(trigger => (
                  <button
                    key={trigger.id}
                    type="button"
                    onClick={() => toggleTrigger(trigger.id)}
                    className={`p-3 rounded-xl border-2 text-left transition relative ${
                      selectedTriggers.includes(trigger.id)
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    {selectedTriggers.includes(trigger.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-xl">{trigger.icon}</span>
                    <p className={`text-sm font-medium mt-1 ${
                      selectedTriggers.includes(trigger.id) ? 'text-amber-700' : 'text-gray-700'
                    }`}>
                      {trigger.label}
                    </p>
                  </button>
                ))}
              </div>

              {/* Custom triggers */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Anything else?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTrigger}
                    onChange={(e) => setCustomTrigger(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTrigger())}
                    placeholder="e.g., Starting my car"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400"
                  />
                  <Button
                    onClick={addCustomTrigger}
                    disabled={!customTrigger.trim()}
                    variant="secondary"
                  >
                    Add
                  </Button>
                </div>
                {customTriggers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {customTriggers.map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium">
                        ⭐ {t}
                        <button 
                          onClick={() => setCustomTriggers(customTriggers.filter((_, idx) => idx !== i))}
                          className="ml-1 text-amber-600 hover:text-amber-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep(3)}
                disabled={selectedTriggers.length === 0 && customTriggers.length === 0}
                fullWidth
                size="lg"
              >
                Continue
              </Button>
            </Card>
          )}

          {/* Step 3: Behaviors */}
          {step === 3 && (
            <Card variant="elevated" padding="lg">
              <div className="text-center mb-6">
                <span className="text-5xl mb-3 block">😰</span>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{stepTitles[2].title}</h1>
                <p className="text-gray-600">{stepTitles[2].subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {COMMON_BEHAVIORS.map(behavior => (
                  <button
                    key={behavior.id}
                    type="button"
                    onClick={() => toggleBehavior(behavior.id)}
                    className={`p-3 rounded-xl border-2 text-left transition relative ${
                      selectedBehaviors.includes(behavior.id)
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {selectedBehaviors.includes(behavior.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-xl">{behavior.icon}</span>
                    <p className={`text-sm font-medium mt-1 ${
                      selectedBehaviors.includes(behavior.id) ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {behavior.label}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Anything else you&apos;ve noticed?
                </label>
                <textarea
                  value={otherBehavior}
                  onChange={(e) => setOtherBehavior(e.target.value)}
                  placeholder="e.g., Scratches at the door, hides under the bed..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400 resize-none"
                  rows={2}
                />
              </div>

              <Button
                onClick={() => setStep(4)}
                disabled={selectedBehaviors.length === 0 && !otherBehavior}
                fullWidth
                size="lg"
              >
                Continue
              </Button>
            </Card>
          )}

          {/* Step 4: Severity & Context */}
          {step === 4 && (
            <Card variant="elevated" padding="lg">
              <div className="text-center mb-6">
                <span className="text-5xl mb-3 block">✨</span>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{stepTitles[3].title}</h1>
                <p className="text-gray-600">{stepTitles[3].subtitle}</p>
              </div>

              <div className="space-y-6">
                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    How severe is {dogName}&apos;s anxiety?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'mild', label: 'Mild', emoji: '😟', desc: 'Some stress' },
                      { value: 'moderate', label: 'Moderate', emoji: '😰', desc: 'Clear distress' },
                      { value: 'severe', label: 'Severe', emoji: '😱', desc: 'Extreme panic' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSeverity(opt.value)}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          severity === opt.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <p className={`font-semibold text-sm ${severity === opt.value ? 'text-amber-700' : 'text-gray-900'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Baseline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    How long can {dogName} be alone before getting anxious?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: '0', label: '0 min' },
                      { value: '5', label: '5 min' },
                      { value: '15', label: '15 min' },
                      { value: '30', label: '30+ min' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBaseline(opt.value)}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          baseline === opt.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <p className={`font-semibold text-sm ${baseline === opt.value ? 'text-amber-700' : 'text-gray-900'}`}>
                          {opt.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Owner schedule */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    What&apos;s your typical schedule?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'wfh', label: 'Work from home', desc: 'Mostly home' },
                      { value: 'hybrid', label: 'Hybrid', desc: 'Some days out' },
                      { value: 'office', label: 'Office/Away', desc: 'Out daily' },
                      { value: 'varies', label: 'Varies', desc: 'Unpredictable' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setOwnerSchedule(opt.value)}
                        className={`p-3 rounded-xl border-2 text-left transition ${
                          ownerSchedule === opt.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <p className={`font-semibold text-sm ${ownerSchedule === opt.value ? 'text-amber-700' : 'text-gray-900'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leave duration goal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    How long do you need {dogName} to be okay alone?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: '1hour', label: '1 hour', desc: 'Quick errands' },
                      { value: '4hours', label: '4 hours', desc: 'Half day' },
                      { value: '8hours', label: '8+ hours', desc: 'Full workday' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLeaveDuration(opt.value)}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          leaveDuration === opt.value
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <p className={`font-semibold text-sm ${leaveDuration === opt.value ? 'text-amber-700' : 'text-gray-900'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !baseline || !ownerSchedule || !leaveDuration}
                  loading={loading}
                  fullWidth
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 mt-2"
                >
                  {loading ? 'Creating plan...' : 'Start Training →'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
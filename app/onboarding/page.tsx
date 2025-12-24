'use client'

import { useState } from 'react'
import { supabase } from '../supabase'

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
      window.location.href = '/login'
      return
    }

    // Combine behavior descriptions
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
      window.location.href = '/welcome'
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-lg mx-auto">
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Let's meet your dog</h1>
            <p className="text-gray-600 mb-6">We'll use this to personalize everything</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  What's your dog's name?
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
                <label className="block text-sm font-semibold text-gray-800 mb-1">
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
                <label className="block text-sm font-semibold text-gray-800 mb-1">
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

              <button
                onClick={() => setStep(2)}
                disabled={!dogName || !breed || !age}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed mt-4"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Triggers */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">What triggers {dogName}?</h1>
            <p className="text-gray-600 mb-6">Select anything that makes {dogName} anxious</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {COMMON_TRIGGERS.map(trigger => (
                <button
                  key={trigger.id}
                  type="button"
                  onClick={() => toggleTrigger(trigger.id)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    selectedTriggers.includes(trigger.id)
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
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
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
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
                <button
                  type="button"
                  onClick={addCustomTrigger}
                  disabled={!customTrigger.trim()}
                  className="px-4 py-3 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Add
                </button>
              </div>
              {customTriggers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customTriggers.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
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

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedTriggers.length === 0 && customTriggers.length === 0}
                className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Behaviors */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">How does {dogName} react?</h1>
            <p className="text-gray-600 mb-6">What happens when you leave or prepare to leave?</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {COMMON_BEHAVIORS.map(behavior => (
                <button
                  key={behavior.id}
                  type="button"
                  onClick={() => toggleBehavior(behavior.id)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    selectedBehaviors.includes(behavior.id)
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <span className="text-xl">{behavior.icon}</span>
                  <p className={`text-sm font-medium mt-1 ${
                    selectedBehaviors.includes(behavior.id) ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    {behavior.label}
                  </p>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Anything else you've noticed?
              </label>
              <textarea
                value={otherBehavior}
                onChange={(e) => setOtherBehavior(e.target.value)}
                placeholder="e.g., Scratches at the door, hides under the bed..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-gray-900 placeholder:text-gray-400"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={selectedBehaviors.length === 0 && !otherBehavior}
                className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Severity & Context */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Almost done!</h1>
            <p className="text-gray-600 mb-6">A few more details to personalize {dogName}'s plan</p>

            <div className="space-y-6">
              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  How severe is {dogName}'s anxiety?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'mild', label: 'Mild', emoji: '😟', desc: 'Some stress signs' },
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
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  How long can {dogName} be alone before getting anxious?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: '0', label: '0 min', desc: 'Instantly' },
                    { value: '5', label: '5 min', desc: '' },
                    { value: '15', label: '15 min', desc: '' },
                    { value: '30', label: '30+ min', desc: '' },
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
                      <p className={`font-semibold ${baseline === opt.value ? 'text-amber-700' : 'text-gray-900'}`}>
                        {opt.label}
                      </p>
                      {opt.desc && <p className="text-xs text-gray-500">{opt.desc}</p>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner schedule */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  What's your typical schedule?
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
                <label className="block text-sm font-semibold text-gray-800 mb-1">
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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !baseline || !ownerSchedule || !leaveDuration}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating plan...' : 'Start Training →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
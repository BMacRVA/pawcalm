'use client'

import { useState } from 'react'
import { supabase } from '../supabase'

export default function OnboardingPage() {
  const [dogName, setDogName] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [baseline, setBaseline] = useState('')
  const [behavior, setBehavior] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('Please log in first')
      window.location.href = '/login'
      return
    }

    const { data, error } = await supabase
      .from('dogs')
      .insert([
        {
          name: dogName,
          breed: breed,
          age: age,
          baseline: parseInt(baseline),
          behavior: behavior,
          user_id: user.id,
        }
      ])
      .select()

    setLoading(false)

    if (error) {
      console.error('Error:', error)
      alert('Error saving: ' + error.message)
    } else {
      window.location.href = '/welcome'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tell us about your dog
          </h1>
          <p className="text-gray-600">
            This helps us create a personalized training plan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dog Name
            </label>
            <input
              type="text"
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              placeholder="e.g., Max"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Breed
            </label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="e.g., Border Collie Mix"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Age
            </label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
              required
            >
              <option value="">Select age...</option>
              <option value="puppy">Puppy (0-1 year)</option>
              <option value="young">Young Adult (1-3 years)</option>
              <option value="adult">Adult (3-7 years)</option>
              <option value="senior">Senior (7+ years)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current alone time (minutes)
            </label>
            <input
              type="number"
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              placeholder="e.g., 5"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What happens when you leave?
            </label>
            <textarea
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              placeholder="Describe your dog's behavior..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
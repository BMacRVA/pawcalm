'use client'

import { useState } from 'react'
import { useDog } from '../../context/DogContext'
import { ChevronDown, Check, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DogSelector() {
  const { dogs, selectedDog, setSelectedDog } = useDog()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  if (!selectedDog || dogs.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition"
      >
        <span className="text-lg">🐕</span>
        <span className="font-medium text-gray-900">{selectedDog.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-xs font-medium text-gray-500 uppercase px-3 py-2">Your Dogs</p>
              {dogs.map((dog) => (
                <button
                  key={dog.id}
                  onClick={() => {
                    setSelectedDog(dog)
                    setIsOpen(false)
                    // Refresh the page to load new dog's data
                    window.location.reload()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    selectedDog.id === dog.id 
                      ? 'bg-amber-50 text-amber-900' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xl">🐕</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{dog.name}</p>
                    <p className="text-xs text-gray-500">{dog.breed}</p>
                  </div>
                  {selectedDog.id === dog.id && (
                    <Check className="w-4 h-4 text-amber-600" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/onboarding')
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-medium">Add Another Dog</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
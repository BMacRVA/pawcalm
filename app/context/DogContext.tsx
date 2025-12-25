'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../supabase'

type Dog = {
  id: string
  name: string
  breed: string
  age: string
  baseline: number
  behavior: string
  severity: string
  triggers: string[]
  behaviors: string[]
  owner_schedule: string
  leave_duration: string
  custom_triggers: string[]
}

type DogContextType = {
  dogs: Dog[]
  selectedDog: Dog | null
  setSelectedDog: (dog: Dog) => void
  loading: boolean
  refreshDogs: () => Promise<void>
}

const DogContext = createContext<DogContextType | undefined>(undefined)

export function DogProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDog, setSelectedDogState] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDogs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: dogsData } = await supabase
      .from('dogs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (dogsData && dogsData.length > 0) {
      setDogs(dogsData)
      
      // Check localStorage for previously selected dog
      const savedDogId = localStorage.getItem('selectedDogId')
      const savedDog = dogsData.find(d => d.id === savedDogId)
      
      if (savedDog) {
        setSelectedDogState(savedDog)
      } else {
        // Default to first dog
        setSelectedDogState(dogsData[0])
        localStorage.setItem('selectedDogId', dogsData[0].id)
      }
    }
    
    setLoading(false)
  }

  const setSelectedDog = (dog: Dog) => {
    setSelectedDogState(dog)
    localStorage.setItem('selectedDogId', dog.id)
  }

  const refreshDogs = async () => {
    await fetchDogs()
  }

  useEffect(() => {
    fetchDogs()
  }, [])

  return (
    <DogContext.Provider value={{ dogs, selectedDog, setSelectedDog, loading, refreshDogs }}>
      {children}
    </DogContext.Provider>
  )
}

export function useDog() {
  const context = useContext(DogContext)
  if (context === undefined) {
    throw new Error('useDog must be used within a DogProvider')
  }
  return context
}
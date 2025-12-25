'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

export interface Dog {
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

interface UseSelectedDogReturn {
  dog: Dog | null
  dogs: Dog[]
  loading: boolean
  selectDog: (dog: Dog) => void
  refreshDog: () => Promise<void>
}

export function useSelectedDog(redirectIfNone: boolean = true): UseSelectedDogReturn {
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDogs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        if (redirectIfNone) router.push('/login')
        setLoading(false)
        return null
      }

      // Fetch all dogs for this user
      const { data: dogsData } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (!dogsData || dogsData.length === 0) {
        if (redirectIfNone) router.push('/onboarding')
        setLoading(false)
        return null
      }

      setDogs(dogsData)
      return dogsData
    } catch (error) {
      console.error('Error fetching dogs:', error)
      return null
    }
  }, [redirectIfNone, router])

 const selectDogFromStorage = useCallback((dogsData: Dog[]) => {
  const savedDogId = localStorage.getItem('selectedDogId')
  
  // Compare as strings since localStorage stores strings
  let selectedDog = dogsData.find(d => String(d.id) === savedDogId)

  if (!selectedDog) {
    selectedDog = dogsData[0]
    localStorage.setItem('selectedDogId', String(selectedDog.id))
  }

  setDog(selectedDog)
  setLoading(false)
}, [])

  const fetchDog = useCallback(async () => {
    const dogsData = await fetchDogs()
    if (dogsData) {
      selectDogFromStorage(dogsData)
    }
  }, [fetchDogs, selectDogFromStorage])

  const selectDog = useCallback((newDog: Dog) => {
    setDog(newDog)
    localStorage.setItem('selectedDogId', String(newDog.id))
    
    // Dispatch a custom event so other components can react
    window.dispatchEvent(new CustomEvent('selectedDogChanged', { detail: newDog }))
  }, [])

  const refreshDog = useCallback(async () => {
    setLoading(true)
    await fetchDog()
  }, [fetchDog])

  // Initial fetch
  useEffect(() => {
    fetchDog()
  }, [fetchDog])

  // Listen for dog changes from other components (like dashboard)
  useEffect(() => {
    const handleDogChange = (event: CustomEvent<Dog>) => {
      setDog(event.detail)
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'selectedDogId' && event.newValue && dogs.length > 0) {
        const newDog = dogs.find(d => d.id === event.newValue)
        if (newDog) {
          setDog(newDog)
        }
      }
    }

    window.addEventListener('selectedDogChanged', handleDogChange as EventListener)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('selectedDogChanged', handleDogChange as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [dogs])

  return { dog, dogs, loading, selectDog, refreshDog }
}
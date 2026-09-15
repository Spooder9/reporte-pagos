import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RentalWithDetails } from '../lib/database.types'

export function useRentals() {
  const [rentals, setRentals] = useState<RentalWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('rentals')
      .select('*, assigned_profile:profiles!rentals_assigned_to_fkey(*)')
      .order('created_at', { ascending: false })
    setRentals((data as RentalWithDetails[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { rentals, loading, refetch: fetch }
}

export function useUserRentals(userId: string | undefined) {
  const [rentals, setRentals] = useState<RentalWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('rentals')
      .select('*, assigned_profile:profiles!rentals_assigned_to_fkey(*)')
      .eq('assigned_to', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setRentals((data as RentalWithDetails[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])
  return { rentals, loading, refetch: fetch }
}

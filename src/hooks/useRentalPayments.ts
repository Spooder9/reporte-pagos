import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RentalPaymentWithDetails } from '../lib/database.types'

export function useRentalPayments(rentalId?: string, userId?: string) {
  const [payments, setPayments] = useState<RentalPaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('rental_payments')
      .select('*, profile:profiles(*)')
      .order('date', { ascending: false })
    if (rentalId) query = query.eq('rental_id', rentalId)
    if (userId) query = query.eq('user_id', userId)
    const { data } = await query
    setPayments((data as RentalPaymentWithDetails[]) ?? [])
    setLoading(false)
  }, [rentalId, userId])

  useEffect(() => { fetch() }, [fetch])
  return { payments, loading, refetch: fetch }
}

export function useAllRentalPayments() {
  const [payments, setPayments] = useState<RentalPaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('rental_payments')
      .select('*, profile:profiles(*)')
      .order('date', { ascending: false })
    setPayments((data as RentalPaymentWithDetails[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { payments, loading, refetch: fetch }
}

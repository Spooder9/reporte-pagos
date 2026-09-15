import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Payment, Profile } from '../lib/database.types'

export interface PaymentWithDetails extends Payment {
  profile: Profile
}

export function usePayments(debtId?: string, userId?: string) {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('payments')
      .select(`*, profile:profiles(*)`)
      .order('date', { ascending: false })

    if (debtId) query = query.eq('debt_id', debtId)
    if (userId) query = query.eq('user_id', userId)

    const { data } = await query
    setPayments((data as PaymentWithDetails[]) ?? [])
    setLoading(false)
  }, [debtId, userId])

  useEffect(() => { fetch() }, [fetch])

  return { payments, loading, refetch: fetch }
}

export function useAllPayments() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select(`*, profile:profiles(*)`)
      .order('date', { ascending: false })
    setPayments((data as PaymentWithDetails[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { payments, loading, refetch: fetch }
}

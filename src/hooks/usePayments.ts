import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Payment, Profile } from '../lib/database.types'

export interface PaymentWithDetails extends Payment {
  profile: Profile
}

async function fetchPaymentsWithProfiles(query: any): Promise<PaymentWithDetails[]> {
  const { data: rows } = await query
  if (!rows || rows.length === 0) return []
  const userIds = [...new Set(rows.map((p: any) => p.user_id).filter(Boolean))]
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
  const pm: Record<string, any> = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
  return rows.map((p: any) => ({ ...p, profile: pm[p.user_id] ?? null })) as PaymentWithDetails[]
}

export function usePayments(debtId?: string, userId?: string) {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('payments').select('*').order('date', { ascending: false })
    if (debtId) query = query.eq('debt_id', debtId)
    if (userId) query = query.eq('user_id', userId)
    setPayments(await fetchPaymentsWithProfiles(query))
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
    const query = supabase.from('payments').select('*').order('date', { ascending: false })
    setPayments(await fetchPaymentsWithProfiles(query))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { payments, loading, refetch: fetch }
}

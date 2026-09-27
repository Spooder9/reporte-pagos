import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { RentalPaymentWithDetails } from '../lib/database.types'

async function fetchRentalPaymentsWithProfiles(query: any): Promise<RentalPaymentWithDetails[]> {
  const { data: rows } = await query
  if (!rows || rows.length === 0) return []
  const userIds = [...new Set(rows.map((p: any) => p.user_id).filter(Boolean))]
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
  const pm: Record<string, any> = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
  return rows.map((p: any) => ({ ...p, profile: pm[p.user_id] ?? null })) as RentalPaymentWithDetails[]
}

export function useRentalPayments(rentalId?: string, userId?: string) {
  const [payments, setPayments] = useState<RentalPaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('rental_payments').select('*').order('date', { ascending: false })
    if (rentalId) query = query.eq('rental_id', rentalId)
    if (userId) query = query.eq('user_id', userId)
    setPayments(await fetchRentalPaymentsWithProfiles(query))
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
    const query = supabase.from('rental_payments').select('*').order('date', { ascending: false })
    setPayments(await fetchRentalPaymentsWithProfiles(query))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { payments, loading, refetch: fetch }
}

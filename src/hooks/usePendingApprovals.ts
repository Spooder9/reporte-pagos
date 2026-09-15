import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/database.types'

export interface PendingPayment {
  id: string
  type: 'credit' | 'rental'
  user_id: string
  amount: number
  date: string
  receipt_number: string
  comment: string | null
  period_label?: string | null
  created_at: string
  status: string
  // joined
  profile: Profile
  debt_id?: string
  rental_id?: string
  debt_description?: string
  debt_code?: string
  rental_name?: string
  rental_code?: string
}

export function usePendingCount() {
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    const [{ count: c1 }, { count: c2 }] = await Promise.all([
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('rental_payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    setCount((c1 ?? 0) + (c2 ?? 0))
  }, [])

  useEffect(() => {
    fetch()
    // Poll every 30 seconds
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [fetch])

  return { count, refetch: fetch }
}

export function usePendingApprovals() {
  const [items, setItems] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    const [{ data: creditPayments }, { data: rentalPayments }] = await Promise.all([
      supabase
        .from('payments')
        .select('*, profile:profiles(*), debt:debts(description, code)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('rental_payments')
        .select('*, profile:profiles(*), rental:rentals(name, code)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])

    const credits: PendingPayment[] = (creditPayments ?? []).map((p: any) => ({
      id: p.id,
      type: 'credit' as const,
      user_id: p.user_id,
      amount: p.amount,
      date: p.date,
      receipt_number: p.receipt_number,
      comment: p.comment,
      created_at: p.created_at,
      status: p.status,
      profile: p.profile,
      debt_id: p.debt_id,
      debt_description: p.debt?.description,
      debt_code: p.debt?.code,
    }))

    const rentals: PendingPayment[] = (rentalPayments ?? []).map((p: any) => ({
      id: p.id,
      type: 'rental' as const,
      user_id: p.user_id,
      amount: p.amount,
      date: p.date,
      receipt_number: p.receipt_number,
      comment: p.comment,
      period_label: p.period_label,
      created_at: p.created_at,
      status: p.status,
      profile: p.profile,
      rental_id: p.rental_id,
      rental_name: p.rental?.name,
      rental_code: p.rental?.code,
    }))

    const all = [...credits, ...rentals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setItems(all)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const approve = async (item: PendingPayment, reviewerId: string) => {
    const payload = { status: 'approved', reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }
    if (item.type === 'credit') {
      await supabase.from('payments').update(payload as any).eq('id', item.id)
    } else {
      await supabase.from('rental_payments').update(payload as any).eq('id', item.id)
    }
    await fetch()
  }

  const reject = async (item: PendingPayment, reviewerId: string, reason: string) => {
    const payload = { status: 'rejected', reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), rejection_reason: reason }
    if (item.type === 'credit') {
      await supabase.from('payments').update(payload as any).eq('id', item.id)
    } else {
      await supabase.from('rental_payments').update(payload as any).eq('id', item.id)
    }
    await fetch()
  }

  return { items, loading, refetch: fetch, approve, reject }
}

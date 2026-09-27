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

    // Fetch payments and rental_payments without joins to avoid PostgREST
    // excluding rows when joined table RLS blocks the relation
    const [cpResult, rpResult] = await Promise.all([
      supabase.from('payments').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('rental_payments').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ])

    const cp = cpResult.data ?? []
    const rp = rpResult.data ?? []

    // Collect IDs for related data
    const userIds = [...new Set([...cp, ...rp].map((p: any) => p.user_id).filter(Boolean))]
    const debtIds = [...new Set(cp.map((p: any) => p.debt_id).filter(Boolean))]
    const rentalIds = [...new Set(rp.map((p: any) => p.rental_id).filter(Boolean))]

    const [profilesRes, debtsRes, rentalsRes] = await Promise.all([
      userIds.length > 0 ? supabase.from('profiles').select('*').in('id', userIds) : Promise.resolve({ data: [] }),
      debtIds.length > 0 ? supabase.from('debts').select('id, description, code').in('id', debtIds) : Promise.resolve({ data: [] }),
      rentalIds.length > 0 ? supabase.from('rentals').select('id, name, code').in('id', rentalIds) : Promise.resolve({ data: [] }),
    ])

    const profilesMap: Record<string, any> = Object.fromEntries((profilesRes.data ?? []).map((p: any) => [p.id, p]))
    const debtsMap: Record<string, any> = Object.fromEntries((debtsRes.data ?? []).map((d: any) => [d.id, d]))
    const rentalsMap: Record<string, any> = Object.fromEntries((rentalsRes.data ?? []).map((r: any) => [r.id, r]))

    const credits: PendingPayment[] = cp.map((p: any) => ({
      id: p.id, type: 'credit' as const,
      user_id: p.user_id, amount: p.amount, date: p.date,
      receipt_number: p.receipt_number, comment: p.comment,
      created_at: p.created_at, status: p.status,
      profile: profilesMap[p.user_id],
      debt_id: p.debt_id,
      debt_description: debtsMap[p.debt_id]?.description,
      debt_code: debtsMap[p.debt_id]?.code,
    }))

    const rentals: PendingPayment[] = rp.map((p: any) => ({
      id: p.id, type: 'rental' as const,
      user_id: p.user_id, amount: p.amount, date: p.date,
      receipt_number: p.receipt_number, comment: p.comment,
      period_label: p.period_label, created_at: p.created_at, status: p.status,
      profile: profilesMap[p.user_id],
      rental_id: p.rental_id,
      rental_name: rentalsMap[p.rental_id]?.name,
      rental_code: rentalsMap[p.rental_id]?.code,
    }))

    setItems([...credits, ...rentals].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ))
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

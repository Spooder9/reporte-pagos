import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DebtWithMembers } from '../lib/database.types'

export function useDebts() {
  const [debts, setDebts] = useState<DebtWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('debts')
      .select(`*, debt_members(*, profile:profiles(*))`)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setDebts((data as DebtWithMembers[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { debts, loading, error, refetch: fetch }
}

export function useUserDebts(userId: string | undefined) {
  const [debts, setDebts] = useState<DebtWithMembers[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data: memberRows } = await supabase
      .from('debt_members')
      .select('debt_id')
      .eq('user_id', userId)

    if (!memberRows || memberRows.length === 0) {
      setDebts([])
      setLoading(false)
      return
    }

    const debtIds = memberRows.map(r => (r as { debt_id: string }).debt_id)
    const { data } = await supabase
      .from('debts')
      .select(`*, debt_members(*, profile:profiles(*))`)
      .in('id', debtIds)
      .order('created_at', { ascending: false })

    setDebts((data as DebtWithMembers[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  return { debts, loading, refetch: fetch }
}

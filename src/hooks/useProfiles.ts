import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/database.types'

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setProfiles(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { profiles, loading, refetch: fetch }
}

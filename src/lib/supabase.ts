/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Pagatón] Faltan variables de entorno: VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder'
)

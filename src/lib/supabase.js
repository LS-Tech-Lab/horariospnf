console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

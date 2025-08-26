import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PingSupabase() {
  useEffect(() => {
    ;(async () => {
      try {
        console.log('[Ping] start')

        const s = await supabase.auth.getSession()
        console.log('[Ping] session', s)

        const r = await supabase.from('profiles').select('id,email').limit(1)
        console.log('[Ping] profiles', r)
      } catch (e) {
        console.error('[Ping] error', e)
      }
    })()
  }, [])
  return null
}

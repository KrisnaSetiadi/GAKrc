// src/lib/auth.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AppUser = {
  id: string
  email: string
  role: 'admin' | 'user' | 'pending' | null
  full_name?: string | null
  division?: string | null
}

type RegisterArgs = { name: string; division: string; email: string; password: string }

type AuthContextType = {
  user: AppUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  register: (args: RegisterArgs) => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
  register: async () => 'not implemented',
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  // --- helpers -------------------------------------------------------------

  // SET USER dari auth user (langsung), tapi JANGAN default role='user'
  const setUserFromAuth = (u: any | null) => {
    if (!u) { setUser(null); return }
    setUser({
      id: u.id,
      email: u.email ?? '',
      role: (u.user_metadata?.role as any) ?? null, // ← CHANGED: fallback null
      full_name: u.user_metadata?.full_name ?? null,
      division: u.user_metadata?.division ?? null,
    })
  }

  // Refresh profil (role, nama, dll) di background
  const refreshProfile = async (uid: string) => {
    const { data: p, error } = await supabase
      .from('profiles')
      .select('email, full_name, division, role')
      .eq('id', uid)
      .maybeSingle()

    if (error) {
      console.warn('[Auth] refreshProfile error:', error)
      return
    }

    if (p) {
      setUser(cur =>
        cur && cur.id === uid
          ? {
              ...cur,
              email: p.email ?? cur.email,
              full_name: p.full_name ?? cur.full_name,
              division: p.division ?? cur.division,
              role: (p.role as any) ?? cur.role, // kalau role ada → isi; kalau tidak → biarkan apa adanya
            }
          : cur
      )
    }
  }

  // ------------------------------------------------------------------------

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) console.warn('[Auth] getSession error:', error)

        if (alive) setUserFromAuth(session?.user ?? null)      // isi cepat dari auth
        if (session?.user?.id) refreshProfile(session.user.id) // lalu lengkapi dari profiles
      } catch (e) {
        console.error('[Auth] bootstrap fatal:', e)
        if (alive) setUser(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (evt, sess) => {
      if (!alive) return
      if (evt === 'SIGNED_OUT') { setUser(null); return }

      // INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED → set cepat, lalu lengkapi
      setUserFromAuth(sess?.user ?? null)
      if (sess?.user?.id) refreshProfile(sess.user.id)
    })

    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return error.message

  const u = data.user ?? data.session?.user
  if (!u) return 'Gagal masuk.'

  // Ambil role dari profiles
  const { data: profile } = await supabase
  .from('profiles')
  .select('email, full_name, division, role, approved')  // ⬅️ approved
  .eq('id', u.id)
  .maybeSingle()

if (!profile?.approved) {                // ⬅️ blokir yang belum approved
  await supabase.auth.signOut()
  return 'Akun Anda masih menunggu persetujuan admin.'
}


  const role = (profile?.role as any) ?? null

  // ❗ blokir user pending
  if (role === 'pending' || role == null) {
    await supabase.auth.signOut()
    return 'Akun Anda masih menunggu persetujuan admin.'
  }

  // kalau bukan pending → set user dan lanjut
  setUser({
    id: u.id,
    email: u.email ?? '',
    role,
    full_name: profile?.full_name ?? u.user_metadata?.full_name ?? null,
    division: profile?.division ?? u.user_metadata?.division ?? null,
  })

  return null
}

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const register = async ({ name, division, email, password }: RegisterArgs) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, division, role: 'pending' } },
  })
  if (error) return error.message

  // upsert profil (best-effort)
  if (data.user) {
    try {
      await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, email, full_name: name, division, role: 'pending' },
          { onConflict: 'id' }
        )
    } catch (e) {
      console.warn('[Auth] upsert profiles error:', e)
    }
  }

  // ❗ penting: paksa keluar agar user tidak otomatis login setelah daftar
  await supabase.auth.signOut()
  return null
}

  const value = useMemo(() => ({ user, loading, login, logout, register }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

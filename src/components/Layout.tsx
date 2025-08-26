// src/components/Layout.tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4 p-3">
          <NavLink to="/submissions">Submissions</NavLink>
          <NavLink to="/users">Users</NavLink>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {user ? user.email : 'Guest'}
            </span>
            {user && (
              <button onClick={handleLogout} className="px-3 py-1 rounded bg-slate-800 text-white">
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">{children}</main>
    </div>
  )
}

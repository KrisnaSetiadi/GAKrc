import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import UserPage from '@/pages/User'
import Submissions from '@/pages/Submissions'
import Users from '@/pages/Users'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="p-6">Memuat...</div>
if (user && !user.role) return <div className="p-6">Menyiapkan sesi…</div> // ← WAJIB


  const home =
    user ? (user.role === 'admin' ? '/submissions' : '/dashboard/user') : '/login'

  console.log('[App] user?', !!user, 'role=', user?.role, 'home=', home)

  return (
    <Routes>
      {/* root */}
      <Route path="/" element={<Navigate to={home} replace />} />

      {/* Auth pages (tanpa Layout) */}
      <Route path="/login" element={user ? <Navigate to={home} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={home} replace /> : <Register />} />

      {/* User */}
      <Route
        path="/dashboard/user"
        element={user ? <Layout><UserPage /></Layout> : <Navigate to="/login" replace />}
      />

      {/* Admin */}
      <Route
        path="/submissions"
        element={user?.role === 'admin'
          ? <Layout><Submissions /></Layout>
          : <Navigate to="/login" replace />}
      />
      <Route
        path="/users"
        element={user?.role === 'admin'
          ? <Layout><Users /></Layout>
          : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// src/pages/Login.tsx
import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"        // ⬅️ tambahkan ini

export default function Login() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // kalau user sudah ada (mis. reload), langsung redirect
  useEffect(() => {
    if (!user) return
    const next = user.role === "admin" ? "/submissions" : "/dashboard/user"
    nav(next, { replace: true })
  }, [user, nav])

  // flash dari navigate(state)
  useEffect(() => {
    const s = (location.state as { flash?: string } | null)?.flash
    if (s) {
      setFlash(s)
      nav(location.pathname, { replace: true, state: {} })
    }
  }, [location, nav])

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setBusy(true)
  setErr(null)
  try {
    console.log('[Login] submit', email)
    const msg = await login(email, password)
    if (msg) setErr(msg)
  } catch (e) {
    console.error('[Login] fatal', e)
    setErr('Gagal masuk, coba lagi.')
  } finally {
    setBusy(false)
  }
}


  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <img src="/bg-cibodas.jpg" alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="w-full max-w-md z-10">
        <div className="rounded-lg border bg-white/90 backdrop-blur text-gray-900 shadow-xl">
          <div className="flex flex-col space-y-1.5 p-6 items-center text-center">
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-7 9a7 7 0 0 1 14 0v1H5Z" />
              </svg>
            </div>
            <div className="font-semibold tracking-tight text-2xl">Masuk</div>
            <div className="text-sm text-gray-600">Masuk untuk mengakses dasbor Anda.</div>
          </div>

          <div className="p-6 pt-0">
            {flash && <div className="mb-3 text-sm text-green-700">{flash}</div>}
            {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Kata sandi</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full h-10 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? "Masuk..." : "Masuk"}
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              Belum punya akun?{" "}
              <Link to="/register" className="underline text-blue-700">Daftar</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}


import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { supabase } from '@/lib/supabase'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState("")
  const [division, setDivision] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

 const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setErr(null)
  const msg = await register({ name, division, email, password })
  if (msg) {
    setErr(msg)
  } else {
    // tampilkan flash di halaman login
    nav('/login', {
      replace: true,
      state: { flash: 'Registrasi berhasil. Akun Anda menunggu persetujuan admin.' },
    })
  }
}



  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background */}
      <img
        src="/bg-cibodas.jpg"
        alt="Background"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />

      {/* Card Register */}
      <div className="w-full max-w-md z-10">
        <div className="rounded-lg border bg-white/90 backdrop-blur text-gray-900 shadow-xl">
          <div className="flex flex-col space-y-1.5 p-6 items-center text-center">
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-7 9a7 7 0 0 1 14 0v1H5Z"/>
              </svg>
            </div>
            <div className="font-semibold tracking-tight text-2xl">Daftar Akun</div>
            <div className="text-sm text-gray-600">Buat akun untuk mulai mengunggah data.</div>
          </div>

          <div className="p-6 pt-0">
            {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
            {ok && <div className="mb-3 text-sm text-green-700">{ok}</div>}
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Nama</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Divisi</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Kata Sandi</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Daftar
              </button>
            </form>
            <div className="mt-4 text-center text-sm">
              Sudah punya akun?{" "}
              <Link className="underline text-blue-700" to="/login">
                Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

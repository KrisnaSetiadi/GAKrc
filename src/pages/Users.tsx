import {
  fetchAllUsers,
  fetchPendingUsers,
  approveUser,
  promoteToAdmin,
  setPending,
  deleteUser,            // ⬅️ tambah ini
} from '@/lib/storage'
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"

export default function UsersAdmin() {
  const { user } = useAuth()
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState("")

  useEffect(() => { (async () => { const data = await fetchAllUsers(); setRows(data) })() }, [])

  const filtered = rows.filter((r) => {
    const s = (r.name + " " + r.email + " " + r.division).toLowerCase()
    return s.includes(q.toLowerCase())
  })

  return (
    <main className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <img src="/bg-admin.jpg" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10">
        <div className="rounded-lg border bg-white/90 backdrop-blur shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-2xl font-semibold leading-none">Manajemen Pengguna</div>
            <div className="text-sm text-gray-600">Setujui atau hapus akun.</div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-center gap-3 py-3">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari nama/email/divisi..." className="h-10 px-3 border rounded-md bg-white/80 w-full sm:w-[320px]" />
            </div>
            <div className="rounded-md border bg-white/80 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="[&_tr]:border-b"><tr className="border-b">
                  <th className="h-12 px-4 text-left">Nama</th>
                  <th className="h-12 px-4 text-left">Email</th>
                  <th className="h-12 px-4 text-left">Divisi</th>
                  <th className="h-12 px-4 text-left">Status</th>
                  <th className="h-12 px-4 text-left">Peran</th>
                  <th className="h-12 px-4 text-left">Tindakan</th>
                </tr></thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filtered.map((r:any) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2">{r.email}</td>
                      <td className="px-4 py-2">{r.division}</td>
                      <td className="px-4 py-2">{r.approved ? "Disetujui" : "Tertunda"}</td>
                      <td className="px-4 py-2 capitalize">{r.role}</td>
                      <td className="px-4 py-2">
                        {!r.approved && <button className="btn btn-outline mr-2" onClick={async()=>{await approveUser(r.id); const d = await fetchAllUsers(); setRows(d)}}>Setujui</button>}
                        <button className="btn btn-outline" onClick={async()=>{ if(confirm('Hapus pengguna ini?')) { await deleteUser(r.id); const d = await fetchAllUsers(); setRows(d) } }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

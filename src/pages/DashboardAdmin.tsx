
import { Link } from 'react-router-dom'
import { getUsers, getSubmissions } from '@/lib/storage'

export default function DashboardAdmin() {
  const users = getUsers()
  const subs = getSubmissions()

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="font-semibold">Ringkasan</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div>Total Pengguna: <b>{users.length}</b></div>
          <div>Menunggu Persetujuan: <b>{users.filter(u=>u.status==='pending' && u.role!=='admin').length}</b></div>
          <div>Total Upload: <b>{subs.length}</b></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="font-semibold">Aksi Cepat</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="btn btn-primary" to="/users">Kelola Pengguna</Link>
          <Link className="btn btn-outline" to="/submissions">Kelola Submissions</Link>
        </div>
      </div>
    </div>
  )
}

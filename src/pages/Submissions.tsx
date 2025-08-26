import { useEffect, useMemo, useState } from 'react'
import type { Submission } from '@/types'
import {
  fetchAllSubmissions,
  updateSubmissionDescription,
  deleteSubmission,
  deleteManySubmissions,
  getSignedImageUrl, // kalau dipakai
} from '@/lib/storage'
import { toCSV, download, exportWordFromHTML, formatDate } from '@/lib/utils'

// Normalizer: coba ambil bucket & path dari berbagai kemungkinan field
function normalizeImageRef(raw: any): { id: string; bucket?: string; path?: string; url?: string } {
  const id = raw.id ?? raw.image_id ?? raw.path ?? raw.url ?? Math.random().toString(36).slice(2)

  // Sudah sesuai?
  if (raw.bucket && raw.path) return { id, bucket: raw.bucket, path: raw.path }

  // Kadang nama field beda:
  const bucket = raw.bucket_id || raw.bucketName || raw.storage_bucket || raw.bucket
  const path =
    raw.path ||
    raw.file_path ||
    raw.storage_path ||
    raw.filePath ||
    raw.name || // kalau hanya nama file
    undefined

  if (bucket && path) return { id, bucket, path }

  // Terakhir: mungkin disimpan langsung URL publik
  if (raw.url) return { id, url: raw.url }

  return { id } // tidak ada info bisa dipakai
}
export default function Submissions() {
  const [rows, setRows] = useState<Submission[]>([])
  const [q, setQ] = useState('')
  const [dateRange, setDateRange] = useState<'7d'|'30d'|'all'>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [sort, setSort] = useState<{key: keyof Submission, dir: 'asc'|'desc'}>({ key: 'created_at', dir: 'desc' })
  const [open, setOpen] = useState(false)
  const [imgs, setImgs] = useState<any[]>([])
  const [loadingImgs, setLoadingImgs] = useState(false)

  const openPreview = (s: Submission) => {
  setOpen(true)
  const arr = (s.images || [])
    .map(i => ({ id: i.id, url: i.url }))
    .filter(x => !!x.url)
  setImgs(arr)
}


  useEffect(() => { (async() => { const all = await fetchAllSubmissions(); setRows(all) })() }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    const lower = q.toLowerCase()
    const start = dateRange==='7d' ? new Date(now.getTime()-7*86400000) :
                  dateRange==='30d' ? new Date(now.getTime()-30*86400000) : null
    return rows.filter(s => {
      if (start && new Date(s.created_at) < start) return false
      if (!lower) return true
      return [s.user_name, s.division, s.description].some(v => v.toLowerCase().includes(lower))
    })
  }, [rows, q, dateRange])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a:any,b:any)=> {
      const A = String(a[sort.key])
      const B = String(b[sort.key])
      return sort.dir==='asc' ? A.localeCompare(B) : B.localeCompare(A)
    })
    return arr
  }, [filtered, sort])

  function toggleAll(sel: boolean) { setSelected(sel ? sorted.map(s=>s.id) : []) }
  function toggleOne(id: string) { setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]) }

  const exportCSVAll = () => {
    const data = sorted.map(s => ({ id: s.id, tanggal: s.created_at, nama: s.user_name, divisi: s.division, deskripsi: s.description, jumlah_gambar: s.images?.length || 0 }))
    download('data-terfilter.csv', toCSV(data), 'text/csv')
  }
  const exportDOCAll = () => {
    const html = `
      <h2>Data Upload (Terfilter)</h2>
      <table border="1" cellspacing="0" cellpadding="4">
        <tr><th>ID</th><th>Tanggal</th><th>Nama</th><th>Divisi</th><th>Deskripsi</th><th>Jumlah Gambar</th></tr>
        ${sorted.map(s => `<tr>
          <td>${s.id}</td><td>${formatDate(s.created_at)}</td><td>${s.user_name}</td>
          <td>${s.division}</td><td>${s.description}</td><td>${s.images?.length || 0}</td>
        </tr>`).join('')}
      </table>`
    exportWordFromHTML(html, 'data-terfilter.doc')
  }

  const bulkDelete = async () => {
    if (!selected.length) return
    if (!confirm('Hapus data terpilih?')) return
    await deleteManySubmissions(selected)
    const all = await fetchAllSubmissions(); setRows(all); setSelected([])
  }

  const editDesc = async (s: Submission) => {
    const val = prompt('Ubah deskripsi:', s.description)
    if (val == null) return
    await updateSubmissionDescription(s.id, val)
    const all = await fetchAllSubmissions(); setRows(all)
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <img src="/bg-admin.jpg" className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-10">
        <div className="rounded-lg border bg-white/90 backdrop-blur shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-2xl font-semibold leading-none tracking-tight">Data upload</div>
            <div className="text-sm text-gray-600">Daftar semua data upload dari pengguna.</div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
              <div className="relative flex-1 w-full sm:w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                <input className="flex h-10 rounded-md border bg-white/80 pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-[300px] w-full" placeholder="Filter data upload..." type="search" value={q} onChange={e=>setQ(e.target.value)} />
              </div>
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <select value={dateRange} onChange={e=>setDateRange(e.target.value as any)} className="h-10 rounded-md border px-3 text-sm bg-white/80">
                  <option value="all">Semua tanggal</option>
                  <option value="7d">7 hari terakhir</option>
                  <option value="30d">30 hari terakhir</option>
                </select>
                <button className="h-10 px-4 rounded-md border text-sm bg-white/80 disabled:opacity-50" onClick={bulkDelete} disabled={!selected.length}>Hapus</button>
              </div>
              <div className="flex gap-2 ml-auto w-full sm:w-auto flex-wrap">
                <button className="h-10 px-4 rounded-md border text-sm bg-white/80" onClick={exportCSVAll}>Download CSV</button>
                <button className="h-10 px-4 rounded-md border text-sm bg-white/80" onClick={exportDOCAll}>Download Word</button>
              </div>
            </div>
            <div className="rounded-md border overflow-x-auto bg-white/80">
              <table className="w-full text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left"><input type="checkbox" onChange={e=>toggleAll(e.target.checked)} /></th>
                    <th className="h-12 px-4 text-left">Tanggal</th>
                    <th className="h-12 px-4 text-left">Nama</th>
                    <th className="h-12 px-4 text-left">Divisi</th>
                    <th className="h-12 px-4 text-left">Deskripsi</th>
                    <th className="h-12 px-4 text-left">Gambar</th>
                    <th className="h-12 px-4 text-left">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {sorted.length === 0 && (
                    <tr className="border-b">
                      <td className="p-4 h-24 text-center" colSpan={7}>Tidak ada data upload yang ditemukan.</td>
                    </tr>
                  )}
                  {sorted.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2"><input type="checkbox" checked={selected.includes(s.id)} onChange={()=>toggleOne(s.id)} /></td>
                      <td className="px-4 py-2">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-2">{s.user_name}</td>
                      <td className="px-4 py-2">{s.division}</td>
                      <td className="px-4 py-2">{s.description}</td>
                      <td className="px-4 py-2">
                      <button className="btn btn-outline" onClick={() => openPreview(s)}>Lihat</button>
                      </td>
                      <td className="px-4 py-2">
                        <button className="btn btn-outline mr-2" onClick={()=>editDesc(s)}>Edit</button>
                        <button className="btn btn-outline" onClick={async()=>{ if(confirm('Hapus data ini?')) { await deleteSubmission(s.id); const all = await fetchAllSubmissions(); setRows(all) } }}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {open && (
  <div
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
    onClick={() => setOpen(false)}
  >
    <div
      className="bg-white rounded-xl p-4 max-w-5xl w-[92vw] md:w-[900px] max-h-[85vh] overflow-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">Pratinjau Gambar</div>
        <button className="text-sm px-3 py-1 rounded border" onClick={() => setOpen(false)}>Tutup</button>
      </div>

      {loadingImgs && (
        <div className="p-6 text-center">Memuat gambar…</div>
      )}

      {!loadingImgs && imgs.length === 0 && (
        <div className="p-6 text-center">Tidak ada gambar / gagal memuat.</div>
      )}

      {!loadingImgs && imgs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {imgs.map((img: any) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-full h-48 object-cover rounded-lg border"
            />
          ))}
        </div>
      )}
    </div>
  </div>
)}

    </main>
  )
}

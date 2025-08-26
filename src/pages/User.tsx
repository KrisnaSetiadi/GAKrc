// src/pages/User.tsx
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { createSubmission, fetchMySubmissions } from "@/lib/storage" // ⬅️ pastikan keduanya diexport dari storage.ts
import { download, toCSV, exportWordFromHTML, formatDate } from "@/lib/utils"

type PickerImage = { id: string; file: File; url: string }

export default function UserPage() {
  const { user } = useAuth()
  const [userName, setUserName] = useState(user?.full_name || user?.email || "")
  const [userDivision, setUserDivision] = useState(user?.division || "")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<PickerImage[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [rows, setRows] = useState<any[]>([])

  // kalau user berubah (mis. selesai bootstrap), isi ulang nama/divisi + tarik data saya
  useEffect(() => {
    setUserName(user?.full_name || user?.email || "")
    setUserDivision(user?.division || "")
    if (user?.id) (async () => setRows(await fetchMySubmissions(user.id)))()
  }, [user?.id, user?.full_name, user?.division, user?.email])

  const onPick = (files: FileList | null) => {
    if (!files) return
    const list = Array.from(files)
    const next = [...images]
    for (const f of list) {
      if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) continue
      if (f.size > 5 * 1024 * 1024) continue
      if (next.length >= 5) break
      const url = URL.createObjectURL(f)
      next.push({ id: `${Date.now()}-${f.name}-${Math.random()}`, file: f, url })
    }
    setImages(next)
  }

  const removeImage = (id: string) => setImages(prev => prev.filter(i => i.id !== id))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!user) { setMsg("Sesi tidak ditemukan. Coba login ulang."); return }
    if (!userName || !userDivision || !description) { setMsg("Lengkapi nama, divisi, dan deskripsi."); return }
    if (images.length === 0) { setMsg("Unggah minimal 1 gambar."); return }

    setBusy(true)
    try {
      // ❗ gunakan properti yang benar: user_id, user_name, files
      await createSubmission({
        user_id: user.id,
        user_name: userName,
        division: userDivision,
        description,
        files: images.map(i => i.file),
      })
      setMsg("Berhasil mengirim formulir!")
      setImages([]); setDescription("")
      setRows(await fetchMySubmissions(user.id))
    } catch (err) {
      console.error(err)
      setMsg("Gagal mengirim. Coba lagi.")
    } finally {
      setBusy(false)
    }
  }

  const exportCSV = () => {
    const data = rows.map((s:any)=>({
      id: s.id,
      tanggal: s.created_at,
      deskripsi: s.description,
      jumlah_gambar: s.images?.length || 0
    }))
    download("riwayat-saya.csv", toCSV(data), "text/csv")
  }

  const exportDOC = () => {
    const html = `
      <h2>Riwayat Upload Saya</h2>
      <table border="1" cellspacing="0" cellpadding="4">
        <tr><th>ID</th><th>Tanggal</th><th>Deskripsi</th><th>Jumlah Gambar</th></tr>
        ${rows.map((s:any)=>`<tr>
          <td>${s.id}</td>
          <td>${formatDate(s.created_at)}</td>
          <td>${s.description}</td>
          <td>${s.images?.length||0}</td>
        </tr>`).join("")}
      </table>`
    exportWordFromHTML(html, "riwayat-saya.doc")
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <img src="/bg-user.jpg" alt="Background" className="absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-10 container mx-auto space-y-8">
        <div className="rounded-lg border shadow-sm w-full bg-white/85 backdrop-blur-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-2xl font-semibold leading-none tracking-tight">Buat Data Upload</div>
            <div className="text-sm text-gray-600">Isi formulir di bawah ini untuk mengirimkan entri Anda.</div>
          </div>
          <div className="p-6 pt-0">
            {msg && <div className="mb-4 text-sm">{msg}</div>}
            <form className="space-y-8" onSubmit={onSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <input className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                         placeholder="cth. John Doe"
                         value={userName}
                         onChange={(e)=>setUserName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Divisi</label>
                  <input className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                         placeholder="cth. Pemasaran"
                         value={userDivision}
                         onChange={(e)=>setUserDivision(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gambar</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-white/70 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Klik untuk mengunggah</span> atau seret dan lepas</p>
                      <p className="text-xs text-gray-500">PNG, JPG, atau WEBP (maks. 5MB, hingga 5 gambar)</p>
                    </div>
                    <input className="hidden" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={(e)=>onPick(e.target.files)} />
                  </label>
                </div>
                {images.length>0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={img.url} alt={img.file.name} className="h-32 w-full object-cover rounded-md border" />
                        <button type="button" onClick={()=>removeImage(img.id)} className="absolute top-1 right-1 bg-white/90 border rounded px-2 py-0.5 text-xs opacity-0 group-hover:opacity-100">Hapus</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deskripsi Gambar</label>
                <textarea className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
                          placeholder="Ceritakan sedikit tentang gambar-gambar itu"
                          rows={5}
                          value={description}
                          onChange={(e)=>setDescription(e.target.value)} />
              </div>

              <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full sm:w-auto disabled:opacity-50"
                      type="submit"
                      disabled={busy}>
                {busy ? "Mengirim..." : "Kirim Formulir"}
              </button>
            </form>
          </div>
        </div>

        {/* Riwayat Upload */}
        <div className="rounded-lg border shadow-sm w-full bg-white/90 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div>
              <div className="text-2xl font-semibold leading-none tracking-tight">Riwayat Data Upload</div>
              <div className="text-sm text-gray-600">Semua entri yang Anda unggah.</div>
            </div>
            <div className="flex gap-2">
              <button className="h-10 px-4 rounded-md border text-sm bg-white/80" onClick={exportCSV}>Download CSV</button>
              <button className="h-10 px-4 rounded-md border text-sm bg-white/80" onClick={exportDOC}>Download Word</button>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="rounded-md border overflow-x-auto bg-white/80">
              <table className="w-full text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left">Tanggal</th>
                    <th className="h-12 px-4 text-left">Deskripsi</th>
                    <th className="h-12 px-4 text-left">Gambar</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {(!rows || rows.length===0) && (
                    <tr className="border-b"><td className="p-4 text-center" colSpan={3}>Belum ada data.</td></tr>
                  )}
                  {rows.map((r:any) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-2">{r.description}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 flex-wrap">
                          {(r.images || []).map((i:any) => (
                            <img key={i.id} src={i.url} className="h-12 w-12 object-cover rounded border" />
                          ))}
                        </div>
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

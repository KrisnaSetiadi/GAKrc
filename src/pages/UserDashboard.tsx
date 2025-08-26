
import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { createSubmission } from "@/lib/storage"

type PickerImage = { id: string; file: File; url: string }

export default function UserUploadPage() {
  const { user } = useAuth()
  const [userName, setUserName] = useState(user?.name || "")
  const [userDivision, setUserDivision] = useState(user?.division || "")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<PickerImage[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

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
    if (!user) return
    if (!userName || !userDivision || !description) {
      setMsg("Lengkapi nama, divisi, dan deskripsi."); return
    }
    if (images.length === 0) {
      setMsg("Unggah minimal 1 gambar."); return
    }
    setBusy(true)
    try {
      // Convert to dataURL for prototype storage
      const readAsDataURL = (file: File) => new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(String(r.result))
        r.onerror = () => rej(r.error)
        r.readAsDataURL(file)
      })
      const imgs = []
      for (const item of images) {
        const dataUrl = await readAsDataURL(item.file)
        imgs.push({ id: item.id, name: item.file.name, dataUrl })
      }
      createSubmission({
        userId: user.id,
        userName,
        division: userDivision,
        description,
        images: imgs,
      })
      setMsg("Berhasil mengirim formulir!")
      setImages([])
      setDescription("")
    } catch (err) {
      console.error(err)
      setMsg("Gagal mengirim. Coba lagi.")
    } finally {
      setBusy(false)
    }
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
                  <input
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="cth. John Doe"
                    value={userName}
                    onChange={(e)=>setUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Divisi</label>
                  <input
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="cth. Pemasaran"
                    value={userDivision}
                    onChange={(e)=>setUserDivision(e.target.value)}
                  />
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
                    <input className="hidden" id="dropzone-file" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={(e)=>onPick(e.target.files)} />
                  </label>
                </div>
                {/* Previews */}
                {images.length>0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3">
                    {images.map(img => (
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
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
                  placeholder="Ceritakan sedikit tentang gambar-gambar itu"
                  rows={5}
                  value={description}
                  onChange={(e)=>setDescription(e.target.value)}
                />
              </div>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full sm:w-auto disabled:opacity-50"
                type="submit"
                disabled={busy}
              >
                {busy ? "Mengirim..." : "Kirim Formulir"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

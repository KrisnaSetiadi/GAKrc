import { useEffect, useState } from 'react'
import { getSignedImageUrl } from '@/lib/storage'

type Props = {
  open: boolean
  onClose: () => void
  // sesuaikan dengan struktur data kamu:
  bucket: string
  path: string   // contoh: 'submissions/2025/08/foo.jpg'
}

export default function ImageModal({ open, onClose, bucket, path }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let alive = true
    const load = async () => {
      setLoading(true); setErr(null)
      const signed = await getSignedImageUrl(bucket, path, 300) // 5 menit
      if (!alive) return
      if (!signed) setErr('Gagal membuat tautan gambar.')
      setUrl(signed ?? null)
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [open, bucket, path])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-5xl w-full p-3" onClick={e => e.stopPropagation()}>
        {loading && <div className="p-8 text-center">Memuat gambar…</div>}
        {err && <div className="p-8 text-center text-red-600">{err}</div>}
        {url && (
          <img
            src={url}
            alt="Preview"
            className="max-h-[80vh] w-full object-contain rounded-lg"
          />
        )}
      </div>
    </div>
  )
}

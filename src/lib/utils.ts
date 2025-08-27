
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } from "docx"
import type { Submission } from "@/types"

export function toCSV(rows: any[]) {
  if (!rows.length) return ""
  const head = Object.keys(rows[0])
  const esc = (v:any) => {
    if (v == null) return ""
    const s = String(v).replace(/"/g,'""')
    return /[",\n]/.test(s) ? `"${s}"` : s
  }
  return [head.join(","), ...rows.map(r => head.map(h => esc(r[h])).join(","))].join("\n")
}

export function download(filename: string, content: string|Blob, mime = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function exportWordFromHTML(html: string, filename: string) {
  const blob = new Blob([`<html><meta charset='utf-8'><body>${html}</body></html>`], { type: "application/msword" })
  download(filename, blob, "application/msword")
}

export function formatDate(iso?: string|null) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function escapeHtml(s: string = "") {
  return s.replace(/&/g,"&amp;")
          .replace(/</g,"&lt;")
          .replace(/>/g,"&gt;");
}

// OPTIONAL: kalau mau file lebih kecil, gunakan versi "scaled" di catatan bawah dan ganti pemanggilan.
async function urlToDataUrlScaled(url: string, maxW = 1000): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const bmp = await createImageBitmap(blob)
    const ratio = Math.min(1, maxW / bmp.width)
    const w = Math.round(bmp.width * ratio)
    const h = Math.round(bmp.height * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bmp, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch (e) {
    console.warn('[utils] urlToDataUrlScaled error:', e, url)
    return null
  }
}

export async function exportWordSubmissionsWithImages(
  subs: Submission[],
  opts?: { columns?: number; imgWidth?: number }
) {
  const columns = opts?.columns ?? 3
  const imgWidth = opts?.imgWidth ?? 220

  const parts: string[] = []
  parts.push(`<h1 style="font-size:20pt;margin:0 0 12px 0;">Data Upload</h1>`)

  for (const s of subs) {
    parts.push(`<div style="page-break-inside:avoid;margin:18px 0;">`)
    parts.push(`<h3 style="font-size:12pt;margin:0 0 6px 0;">${escapeHtml(s.user_name)} — ${formatDate(s.created_at)}</h3>`)
    parts.push(`<div style="color:#444;font-size:11pt;margin:0 0 4px 0;"><b>Divisi:</b> ${escapeHtml(s.division || "")}</div>`)
    if (s.description) parts.push(`<div style="margin:0 0 6px 0;">${escapeHtml(s.description)}</div>`)

    const imgs = (s.images || []).filter(i => i?.url)
    if (imgs.length) {
      // pecah jadi baris-baris dengan N kolom
      const rows: any[][] = []
      for (let i = 0; i < imgs.length; i += columns) rows.push(imgs.slice(i, i + columns))

      parts.push(`<table style="width:100%;border-collapse:collapse;margin:8px 0 4px 0;">`)
      for (const row of rows) {
        parts.push(`<tr>`)
        for (let c = 0; c < columns; c++) {
          const img = row[c]
          if (img) {
            // pilih salah satu helper: urlToDataUrl (tanpa resize) ATAU urlToDataUrlScaled (lebih kecil)
            const durl = await urlToDataUrlScaled(img.url!)  // atau: await urlToDataUrl(img.url!)
            const inner = durl
              ? `<img src="${durl}" alt="" style="width:${imgWidth}px;height:auto;border:1px solid #ccc;border-radius:6px;display:block;margin:0 auto 4px;" />`
              : `<span style="color:#c00">[gambar gagal]</span>`
            parts.push(`<td style="width:${(100 / columns).toFixed(2)}%;padding:6px;text-align:center;vertical-align:top;">${inner}</td>`)
          } else {
            parts.push(`<td style="width:${(100 / columns).toFixed(2)}%;padding:6px;"></td>`)
          }
        }
        parts.push(`</tr>`)
      }
      parts.push(`</table>`)
    } else {
      parts.push(`<i>Tidak ada gambar</i>`)
    }

    parts.push(`</div>`)
    // page break di akhir tiap entri
    parts.push(`<div style="page-break-after:always;"></div>`)
  }

  const html =
`<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 2cm; }
  </style>
</head>
<body>
  ${parts.join('\n')}
</body>
</html>`

  exportWordFromHTML(html, 'data-dengan-gambar.doc')
}

import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } from "docx"

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

// src/lib/storage.ts
import { supabase } from '@/lib/supabase'
import type { Submission, SubmissionImage } from '@/types'

// Ganti sesuai nama bucket Storage Anda
const BUCKET_NAME = 'uploads'

// ==== UTIL GAMBAR ============================================================
export function getPublicImageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getSignedImageUrl(
  bucket: string,
  path: string,
  expiresInSec = 300
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec)
  if (error) {
    console.warn('[storage] createSignedUrl error:', error)
    return null
  }
  return data?.signedUrl ?? null
}

// ==== CRUD SUBMISSION ========================================================
type CreateSubmissionArgs = {
  user_id: string
  user_name: string
  division: string
  description: string
  files: File[]
}

/** Insert submission + upload file ke Storage + insert ke submission_images */
export async function createSubmission(args: CreateSubmissionArgs): Promise<{ id: string | null; error?: string }> {
  const { user_id, user_name, division, description, files } = args

  // 1) submission
  const { data: sub, error: subErr } = await supabase
    .from('submissions')
    .insert({ user_id, user_name, division, description })
    .select('id')
    .single()

  if (subErr) {
    console.warn('[storage] insert submissions error:', subErr)
    return { id: null, error: subErr.message }
  }
  const submissionId = sub.id as string

  // 2) upload semua file + catat di submission_images (HANYA url)
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${user_id}/${submissionId}/${Date.now()}_${i}.${ext}`

    const { error: upErr } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(path, f, { upsert: true, contentType: f.type || 'application/octet-stream' })

    if (upErr) {
      console.warn('[storage] upload gagal:', upErr)
      continue
    }

    const publicUrl = getPublicImageUrl(BUCKET_NAME, path)

    // SIMPAN HANYA url (tanpa bucket/path)
    await supabase
  .from('submission_images')
  .insert({
    submission_id: submissionId,
    bucket: BUCKET_NAME, // ⬅️ WAJIB
    path,                 // ⬅️ WAJIB
    url: publicUrl,       // opsional (tetap oke disimpan)
  })
  }

  return { id: submissionId }
}

/** Ambil semua submission + gambar (untuk Admin) */
// Admin
export async function fetchAllSubmissions(): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id, created_at, user_id, user_name, division, description,
      images:submission_images ( id, bucket, path, url )
    `)
    .order('created_at', { ascending: false })

  if (error) { console.warn('[storage] fetchAllSubmissions error:', error); return [] }

  return (data || []).map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    user_id: row.user_id,
    user_name: row.user_name,
    division: row.division,
    description: row.description,
    images: (row.images || []) as SubmissionImage[],
  }))
}

// Riwayat user
export async function fetchMySubmissions(userId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id, created_at, user_id, user_name, division, description,
      images:submission_images ( id, bucket, path, url )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { console.warn('[storage] fetchMySubmissions error:', error); return [] }
  return (data as any[]) || []
}


/** Ubah deskripsi 1 submission */
export async function updateSubmissionDescription(id: string, description: string) {
  const { error } = await supabase
    .from('submissions')
    .update({ description })
    .eq('id', id)
  if (error) console.warn('[storage] update desc error:', error)
}

/** Hapus 1 submission + file-file-nya (best effort) */
export async function deleteSubmission(id: string) {
  // ambil list gambar untuk coba hapus file di storage
  const { data: imgs } = await supabase
  .from('submission_images')
  .select('bucket, path, url')
  .eq('submission_id', id)

if (imgs?.length) {
  const byBucket: Record<string, string[]> = {}

  for (const it of imgs as Array<{ bucket: string | null; path: string | null; url: string | null }>) {
    if (it.bucket && it.path) {
      // data baru: pakai bucket+path langsung
      byBucket[it.bucket] ||= []
      byBucket[it.bucket].push(it.path)
      continue
    }
    // fallback data lama: parse dari public URL
    const url = it.url || ''
    const m = url.match(/\/object\/public\/([^/]+)\/(.+)$/)
    if (m) {
      const [, bucket, path] = m
      byBucket[bucket] ||= []
      byBucket[bucket].push(path)
    }
  }

  for (const [bucket, paths] of Object.entries(byBucket)) {
    if (paths.length) await supabase.storage.from(bucket).remove(paths)
  }
  }

  await supabase.from('submission_images').delete().eq('submission_id', id)
  const { error } = await supabase.from('submissions').delete().eq('id', id)
  if (error) console.warn('[storage] deleteSubmission error:', error)
}

/** Bulk delete */
export async function deleteManySubmissions(ids: string[]) {
  for (const id of ids) await deleteSubmission(id)
}



// ====== Admin: Manajemen User ======
export type Profile = {
  id: string
  email: string
  full_name: string | null
  division: string | null
  role: 'admin' | 'user' | 'pending' | null
  approved: boolean | null           // ⬅️ tambah ini
}

// ---- fetchAllUsers: ikutkan kolom approved
export async function fetchAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, division, role, approved')  // ⬅️ approved
    .order('email', { ascending: true })
  if (error) { console.warn('[storage] fetchAllUsers error:', error); return [] }
  return (data as Profile[]) ?? []
}

// Ambil user yang masih pending (opsional)
export async function fetchPendingUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, division, role, approved')
    .eq('approved', false)                      // ← ini kunci pending
    .order('email', { ascending: true });
  return (data as Profile[]) ?? [];
}




// Set role user secara umum
export async function setUserRole(
  userId: string,
  role: 'admin' | 'user' | 'pending'
): Promise<string | null> {
  const approved = role === 'pending' ? false : true
  const { error } = await supabase
    .from('profiles')
    .update({ role, approved })          // ⬅️ approved ikut diupdate
    .eq('id', userId)
  return error ? (console.warn('[storage] setUserRole error:', error), error.message) : null
}

// shorthand tetap:
export async function approveUser(userId: string) { return setUserRole(userId, 'user') }
export async function promoteToAdmin(userId: string) { return setUserRole(userId, 'admin') }
export async function setPending(userId: string) { return setUserRole(userId, 'pending') }


export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
}


export type Role = "admin" | "user"
export type Profile = {
  id: string
  email: string
  name: string
  division: string
  role: Role
  approved: boolean
  created_at: string
}

// export type SubmissionImage = {
//   id: string
//   url?: string | null
//   // (jika sebelumnya ada bucket/path, biarkan opsional)
//   bucket?: string | null
//   path?: string | null
// }
export type SubmissionImage = {
  id: string
  bucket: string | null
  path: string | null
  url: string | null
}


export type Submission = {
  id: string
  created_at: string
  user_id: string
  user_name: string
  division: string
  description: string
  images?: SubmissionImage[]
}

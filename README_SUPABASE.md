
# KRC Apps – Supabase + Vercel

Frontend: Vite + React + TS + Tailwind  
Backend: Supabase (Auth, Postgres, Storage)

## Fitur
- Register/Login (email + password). Akun **user** berstatus **Tertunda** sampai disetujui admin.
- **Admin allowlist** via `src/config/admins.ts`: email yang ada di list ini otomatis role=admin & approved.
- Redirect role: `/dashboard/user` atau `/dashboard/admin` (atur di router-mu).
- **Dashboard User**: Form upload (≤5 gambar, ≤5MB, preview, hapus) + Riwayat upload (export CSV/Word).
- **Dashboard Admin**:
  - `/users` kelola pengguna: approve & delete
  - `/submissions` kelola data upload: search/filter, edit deskripsi, hapus, bulk delete, preview gambar, export CSV/Word.
- Background halaman sesuai aset `public/bg-*.jpg`.

## Setup Supabase
1. Buat project di https://supabase.com.
2. Buka **SQL Editor** dan jalankan file [`supabase.sql`](./supabase.sql).
3. (Opsional) Tambahkan email admin ke tabel `admin_emails`:
   ```sql
   insert into admin_emails(email) values ('email-admin@domain.com');
   ```
   Atau isi di `src/config/admins.ts` agar admin langsung approved saat register.
4. Ambil **Project URL** dan **Anon Key** dari Settings → API.

## Konfigurasi Environment
Copy `.env.example` menjadi `.env` dan isi:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Jalankan Lokal
```
npm install
npm run dev
```

## Deploy ke Vercel
1. Push repo ini ke GitHub.
2. Import ke Vercel → pilih **Framework: Vite**.
3. Di **Environment Variables**, masukkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build Command: `npm run build`  
   Output: `dist`
5. Deploy.

> Catatan: semua upload gambar disimpan di **bucket `uploads`** dan bersifat **public read** (agar bisa ditampilkan). Tulis/hapus dibatasi pengguna login & admin via policy.

## Routing
- Login: `/login`
- Register: `/register`
- Admin: `/users`, `/submissions`
- User: `/dashboard/user` (pastikan route ini me-render `src/pages/User.tsx`)

## Ubah Branding
Ganti gambar di folder `public/`:
- `bg-cibodas.jpg` (login/register)
- `bg-admin.jpg` (admin)
- `bg-user.jpg` (user)

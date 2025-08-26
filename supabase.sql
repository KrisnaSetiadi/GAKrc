
-- Run this in Supabase SQL editor

-- 1) Admin allowlist
create table if not exists public.admin_emails (
  email text primary key
);

-- 2) Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  division text,
  role text check (role in ('admin','user')) default 'user',
  approved boolean default false,
  created_at timestamp with time zone default now()
);
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "profiles select own or admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (select 1 from public.admin_emails a where a.email = auth.email())
  );

create policy "profiles insert self" on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles update self or admin" on public.profiles for update
  using (auth.uid() = id or exists (select 1 from public.admin_emails a where a.email = auth.email()))
  with check (auth.uid() = id or exists (select 1 from public.admin_emails a where a.email = auth.email()));

create policy "profiles delete admin only" on public.profiles for delete
  using (exists (select 1 from public.admin_emails a where a.email = auth.email()));

-- 3) Submissions
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  division text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);
alter table public.submissions enable row level security;

create policy "submissions select own or admin"
  on public.submissions for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.admin_emails a where a.email = auth.email())
  );

create policy "submissions insert own"
  on public.submissions for insert
  with check (user_id = auth.uid());

create policy "submissions update own or admin"
  on public.submissions for update
  using (user_id = auth.uid() or exists (select 1 from public.admin_emails a where a.email = auth.email()))
  with check (user_id = auth.uid() or exists (select 1 from public.admin_emails a where a.email = auth.email()));

create policy "submissions delete own or admin"
  on public.submissions for delete
  using (user_id = auth.uid() or exists (select 1 from public.admin_emails a where a.email = auth.email()));

-- 4) Submission images
create table if not exists public.submission_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  path text not null,
  url text not null
);
alter table public.submission_images enable row level security;

create policy "images select own or admin"
  on public.submission_images for select
  using (
    exists (select 1 from public.submissions s where s.id = submission_id and (s.user_id = auth.uid() or exists (select 1 from public.admin_emails a where a.email = auth.email())))
  );

create policy "images insert own"
  on public.submission_images for insert
  with check (
    exists (select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid())
  );

create policy "images delete own or admin"
  on public.submission_images for delete
  using (
    exists (select 1 from public.submissions s where s.id = submission_id and (s.user_id = auth.uid() or exists (select 1 from public.admin_emails a where a.email = auth.email())))
  );

-- 5) Storage bucket for uploads
insert into storage.buckets (id, name, public) values ('uploads','uploads', true)
  on conflict (id) do nothing;

-- Make public read, but restrict write/delete to authenticated users
create policy "Public read uploads" on storage.objects for select
  using (bucket_id = 'uploads');

create policy "Authenticated can upload" on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

create policy "Owner or admin can delete"
  on storage.objects for delete
  using (
    bucket_id = 'uploads' and (owner = auth.uid() or exists (select 1 from public.admin_emails a where a.email = auth.email()))
  );

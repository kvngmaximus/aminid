-- Aminid — Supabase Auth & Profiles bootstrap
-- Run this in your Supabase project's SQL editor.

-- Extensions
create extension if not exists pgcrypto;

-- Helper to read current auth uid
create or replace function public.uid() returns uuid
language sql stable as $$
  select auth.uid();
$$;

-- Profiles: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  user_type text not null default 'reader' check (user_type in ('reader','author','admin')),
  status text not null default 'active' check (status in ('active','suspended','disabled')),
  created_at timestamptz not null default now()
);

-- Authors table (linked to profiles)
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.authors enable row level security;

-- Profiles policies: user can read/update own profile
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = public.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = public.uid())
  with check (id = public.uid());

-- Authors policies: public read; inserts are done by trigger (privileged)
drop policy if exists authors_select_public on public.authors;
create policy authors_select_public on public.authors
  for select using (true);

-- Bootstrap trigger: create profile (and author) on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
  name_text text;
begin
  -- Read metadata provided at sign-up
  role_text := coalesce(new.raw_user_meta_data ->> 'role', 'reader');
  name_text := new.raw_user_meta_data ->> 'name';

  -- Upsert profile with user_type and status=active
  insert into public.profiles (id, name, user_type, status)
  values (new.id, name_text, role_text, 'active')
  on conflict (id) do update set
    name = excluded.name,
    user_type = excluded.user_type;

  -- If author, ensure an authors row exists
  if role_text = 'author' then
    insert into public.authors (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Optional helper view: current user profile
create or replace view public.my_profile as
select * from public.profiles where id = public.uid();
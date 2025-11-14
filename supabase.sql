-- Aminid Supabase setup: schema, RLS policies, storage buckets
-- Run this in Supabase SQL editor.

-- Enable extensions if needed
create extension if not exists pgcrypto;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  username text unique,
  bio text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Authors
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  premium boolean default false,
  badge text,
  followers_count int default 0,
  created_at timestamptz default now()
);

-- Articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  title text not null,
  excerpt text,
  content_blocks jsonb,
  image_url text,
  category text,
  is_premium boolean default false,
  is_featured boolean default false,
  read_time int default 0,
  likes_count int default 0,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Engagement
create table if not exists public.article_reads (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  seconds_read int default 0,
  created_at timestamptz default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (article_id, user_id)
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (author_id, user_id)
);

-- Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  is_premium boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  order_index int default 0,
  duration_minutes int default 0
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress_percent int default 0,
  created_at timestamptz default now(),
  unique (user_id, course_id)
);

-- Monetization
create table if not exists public.plans (
  id text primary key,
  amount_cents int not null,
  currency text not null default 'USD',
  interval text not null default 'month',
  description text,
  active boolean default true
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id) on update cascade,
  status text not null check (status in ('active','expired','canceled','pending')),
  renews_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'flutterwave',
  provider_ref text,
  amount_cents int not null,
  currency text not null default 'USD',
  status text not null,
  event jsonb,
  created_at timestamptz default now()
);

-- Recognition
create table if not exists public.recognitions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('author_month','author_year','article_month')),
  target_id uuid not null,
  month int,
  year int,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Storage bucket (images)
insert into storage.buckets (id, name, public)
  values ('images','images', true)
on conflict (id) do nothing;

-- Indexes (performance)
create index if not exists idx_articles_author on public.articles(author_id);
create index if not exists idx_reads_article on public.article_reads(article_id);
create index if not exists idx_likes_article on public.likes(article_id);
create index if not exists idx_follows_author on public.follows(author_id);
create index if not exists idx_courses_author on public.courses(author_id);
create index if not exists idx_enrollments_user on public.enrollments(user_id);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

-- RLS enable
alter table public.profiles enable row level security;
alter table public.authors enable row level security;
alter table public.articles enable row level security;
alter table public.article_reads enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.enrollments enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.recognitions enable row level security;

-- Helpers: auth uid shortcut
create or replace function public.uid() returns uuid language sql stable as $$
  select auth.uid();
$$;

-- Profiles policies
create policy if not exists profiles_select_self on public.profiles
  for select using (id = public.uid());
create policy if not exists profiles_update_self on public.profiles
  for update using (id = public.uid());

-- Authors policies
create policy if not exists authors_select_public on public.authors
  for select using (true);
create policy if not exists authors_insert_self on public.authors
  for insert with check (user_id = public.uid());
create policy if not exists authors_update_self on public.authors
  for update using (user_id = public.uid());

-- Articles policies
create policy if not exists articles_select_published on public.articles
  for select using (
    published_at is not null
    and (
      is_premium = false
      or (is_premium = true and exists (
        select 1 from public.subscriptions s
        where s.user_id = public.uid() and s.status = 'active'
      ))
    )
  );
create policy if not exists articles_insert_author on public.articles
  for insert with check (exists (
    select 1 from public.authors a
    where a.id = author_id and a.user_id = public.uid()
  ));
create policy if not exists articles_update_author on public.articles
  for update using (exists (
    select 1 from public.authors a
    where a.id = author_id and a.user_id = public.uid()
  ));

-- Reads policies
create policy if not exists reads_select_self on public.article_reads
  for select using (user_id = public.uid());
create policy if not exists reads_insert_self on public.article_reads
  for insert with check (user_id = public.uid());

-- Likes policies
create policy if not exists likes_select_self on public.likes
  for select using (user_id = public.uid());
create policy if not exists likes_insert_self on public.likes
  for insert with check (user_id = public.uid());
create policy if not exists likes_delete_self on public.likes
  for delete using (user_id = public.uid());

-- Follows policies
create policy if not exists follows_select_self on public.follows
  for select using (user_id = public.uid());
create policy if not exists follows_insert_self on public.follows
  for insert with check (user_id = public.uid());
create policy if not exists follows_delete_self on public.follows
  for delete using (user_id = public.uid());

-- Courses policies
create policy if not exists courses_select_public on public.courses
  for select using (true);
create policy if not exists courses_insert_author on public.courses
  for insert with check (exists (
    select 1 from public.authors a where a.id = author_id and a.user_id = public.uid()
  ));
create policy if not exists courses_update_author on public.courses
  for update using (exists (
    select 1 from public.authors a where a.id = author_id and a.user_id = public.uid()
  ));

-- Course modules policies
create policy if not exists modules_select_public on public.course_modules
  for select using (true);
create policy if not exists modules_cud_author on public.course_modules
  for all using (exists (
    select 1 from public.courses c join public.authors a on c.author_id = a.id
    where c.id = course_id and a.user_id = public.uid()
  )) with check (exists (
    select 1 from public.courses c join public.authors a on c.author_id = a.id
    where c.id = course_id and a.user_id = public.uid()
  ));

-- Enrollments policies
create policy if not exists enrollments_select_self on public.enrollments
  for select using (user_id = public.uid());
create policy if not exists enrollments_insert_self on public.enrollments
  for insert with check (user_id = public.uid());
create policy if not exists enrollments_update_self on public.enrollments
  for update using (user_id = public.uid());

-- Plans policies (public read)
create policy if not exists plans_select_public on public.plans
  for select using (true);

-- Subscriptions policies
create policy if not exists subs_select_self on public.subscriptions
  for select using (user_id = public.uid());
create policy if not exists subs_insert_self_pending on public.subscriptions
  for insert with check (user_id = public.uid());
create policy if not exists subs_update_self on public.subscriptions
  for update using (user_id = public.uid());

-- Payments policies
create policy if not exists payments_select_self on public.payments
  for select using (user_id = public.uid());
create policy if not exists payments_insert_self on public.payments
  for insert with check (user_id = public.uid());

-- Recognitions policies (public read; admin writes via service role)
create policy if not exists rec_select_public on public.recognitions
  for select using (true);

-- Admin notes:
-- Admin-only operations (e.g., setting recognitions, forcing premium) should use service role via backend.

-- Triggers (optional): maintain likes_count on articles
create or replace function public.update_article_likes()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set likes_count = coalesce(likes_count,0) + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles set likes_count = greatest(coalesce(likes_count,0) - 1,0) where id = old.article_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_article_likes on public.likes;
create trigger trg_article_likes
after insert or delete on public.likes
for each row execute procedure public.update_article_likes();

-- Seed plans
insert into public.plans (id, amount_cents, currency, interval, description, active) values
  ('reader_month', 500, 'USD', 'month', 'Premium Reader monthly subscription', true),
  ('author_month', 1200, 'USD', 'month', 'Premium Author monthly subscription', true)
on conflict (id) do nothing;

-- Done
-- Aminid — Supabase Auth & Profiles bootstrap
-- Run this in your Supabase project's SQL editor.

-- Extensions
create extension if not exists pgcrypto;
-- Optional: scheduler for periodic jobs
create extension if not exists pg_cron;

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

-- Mirror of subscription status for quick gating on the client
alter table public.profiles
  add column if not exists subscription_status text default 'none';
alter table public.profiles
  add column if not exists subscription_expires_at timestamptz;

-- Auto-expire active subscriptions based on expiry timestamp (runs daily at 00:10)
do $ddl$
begin
  perform cron.schedule('expire_profile_subscriptions_daily', '10 0 * * *', $job$
    update public.profiles
    set subscription_status = 'expired'
    where subscription_status = 'active'
      and subscription_expires_at is not null
      and subscription_expires_at <= now();
  $job$);
exception when others then null; -- ignore if pg_cron not available
end;
$ddl$;

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

-- Allow authors to update their own record (bank details, metadata)
drop policy if exists authors_update_self on public.authors;
create policy authors_update_self on public.authors
  for update using (user_id = public.uid())
  with check (user_id = public.uid());

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

-- =====================================
-- Content & Moderation Schema
-- =====================================

-- Helpers
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists(
    select 1 from public.profiles p
    where p.id = public.uid() and p.user_type = 'admin'
  );
$$;

create or replace function public.is_author() returns boolean
language sql stable as $$
  select exists(
    select 1 from public.profiles p
    where p.id = public.uid() and p.user_type in ('author','admin')
  );
$$;

-- Articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique,
  excerpt text,
  content text,
  cover_url text,
  category text,
  premium boolean not null default false,
  status text not null default 'draft' check (status in ('draft','pending_review','published','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-manage updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists articles_touch_updated on public.articles;
create trigger articles_touch_updated
before update on public.articles
for each row execute procedure public.touch_updated_at();

-- Article interactions
create table if not exists public.article_likes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (article_id, user_id)
);

create table if not exists public.article_bookmarks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (article_id, user_id)
);

create table if not exists public.article_views_daily (
  article_id uuid not null references public.articles(id) on delete cascade,
  view_date date not null default current_date,
  views integer not null default 1,
  primary key (article_id, view_date)
);

-- Recognitions & Bulletins (Admin-published)
create table if not exists public.recognitions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text,
  type text not null check (type in (
    'bulletin',
    'author_of_month',
    'article_of_month',
    'author_of_year',
    'article_of_year'
  )),
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);


-- Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','pending_review','published','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists courses_touch_updated on public.courses;
create trigger courses_touch_updated
before update on public.courses
for each row execute procedure public.touch_updated_at();

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_course_modules_course_pos on public.course_modules(course_id, position);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  position integer not null,
  title text not null,
  content text,
  video_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_course_lessons_module_pos on public.course_lessons(module_id, position);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed')),
  progress numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);

-- Enable RLS
alter table public.articles enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_bookmarks enable row level security;
alter table public.article_views_daily enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.recognitions enable row level security;

-- Article policies
drop policy if exists articles_select_published on public.articles;
create policy articles_select_published on public.articles
  for select using (status = 'published');

drop policy if exists articles_select_own on public.articles;
create policy articles_select_own on public.articles
  for select using (author_id = public.uid());

drop policy if exists articles_select_admin on public.articles;
create policy articles_select_admin on public.articles
  for select using (public.is_admin());

drop policy if exists articles_insert_author on public.articles;
create policy articles_insert_author on public.articles
  for insert with check (author_id = public.uid() and public.is_author());

drop policy if exists articles_update_author on public.articles;
create policy articles_update_author on public.articles
  for update using (author_id = public.uid() and status in ('draft','pending_review'))
  with check (author_id = public.uid());

drop policy if exists articles_update_admin on public.articles;
create policy articles_update_admin on public.articles
  for update using (public.is_admin());

drop policy if exists articles_delete_author on public.articles;

-- Recognitions policies
drop policy if exists recognitions_select_published on public.recognitions;
create policy recognitions_select_published on public.recognitions
  for select using (status = 'published');

drop policy if exists recognitions_select_admin on public.recognitions;
create policy recognitions_select_admin on public.recognitions
  for select using (public.is_admin());

drop policy if exists recognitions_insert_admin on public.recognitions;
create policy recognitions_insert_admin on public.recognitions
  for insert with check (public.is_admin());

drop policy if exists recognitions_update_admin on public.recognitions;
create policy recognitions_update_admin on public.recognitions
  for update using (public.is_admin());

drop policy if exists recognitions_delete_admin on public.recognitions;
create policy recognitions_delete_admin on public.recognitions
  for delete using (public.is_admin());
create policy articles_delete_author on public.articles
  for delete using (author_id = public.uid() and status != 'published');

-- Interaction policies
drop policy if exists likes_rw_self on public.article_likes;
create policy likes_rw_self on public.article_likes
  for all using (user_id = public.uid()) with check (user_id = public.uid());

drop policy if exists bookmarks_rw_self on public.article_bookmarks;
create policy bookmarks_rw_self on public.article_bookmarks
  for all using (user_id = public.uid()) with check (user_id = public.uid());

drop policy if exists views_insert_public on public.article_views_daily;
create policy views_insert_public on public.article_views_daily
  for insert with check (true);
drop policy if exists views_select_public on public.article_views_daily;
create policy views_select_public on public.article_views_daily
  for select using (true);

-- Author follows (for following/unfollowing authors)
create table if not exists public.author_follows (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (author_id, follower_id)
);

alter table public.author_follows enable row level security;

-- Public can read follow counts; users can only modify their own follow relations
drop policy if exists author_follows_select_public on public.author_follows;
create policy author_follows_select_public on public.author_follows
  for select using (true);

drop policy if exists author_follows_rw_self on public.author_follows;
create policy author_follows_rw_self on public.author_follows
  for all using (follower_id = public.uid()) with check (follower_id = public.uid());

create index if not exists idx_author_follows_author on public.author_follows(author_id);
create index if not exists idx_author_follows_follower on public.author_follows(follower_id);

-- Course policies
drop policy if exists courses_select_published on public.courses;
create policy courses_select_published on public.courses
  for select using (status = 'published');

drop policy if exists courses_select_own on public.courses;
create policy courses_select_own on public.courses
  for select using (author_id = public.uid());

drop policy if exists courses_select_admin on public.courses;
create policy courses_select_admin on public.courses
  for select using (public.is_admin());

drop policy if exists courses_insert_author on public.courses;
create policy courses_insert_author on public.courses
  for insert with check (author_id = public.uid() and public.is_author());

drop policy if exists courses_update_author on public.courses;
create policy courses_update_author on public.courses
  for update using (author_id = public.uid() and status in ('draft','pending_review'))
  with check (author_id = public.uid());

drop policy if exists courses_update_admin on public.courses;
create policy courses_update_admin on public.courses
  for update using (public.is_admin());

drop policy if exists courses_delete_author on public.courses;
create policy courses_delete_author on public.courses
  for delete using (author_id = public.uid() and status != 'published');

-- Modules and lessons: authors can manage within their own courses; readers select published only
drop policy if exists modules_select_public on public.course_modules;
create policy modules_select_public on public.course_modules
  for select using (exists (
    select 1 from public.courses c where c.id = course_id and c.status = 'published'
  ) or exists (
    select 1 from public.courses c where c.id = course_id and c.author_id = public.uid()
  ) or public.is_admin());

drop policy if exists modules_write_author on public.course_modules;
create policy modules_write_author on public.course_modules
  for all using (exists (
    select 1 from public.courses c where c.id = course_id and c.author_id = public.uid()
  )) with check (exists (
    select 1 from public.courses c where c.id = course_id and c.author_id = public.uid()
  ));

drop policy if exists lessons_select_public on public.course_lessons;
create policy lessons_select_public on public.course_lessons
  for select using (exists (
    select 1 from public.course_modules m
    join public.courses c on c.id = m.course_id
    where m.id = module_id and (c.status = 'published' or c.author_id = public.uid())
  ) or public.is_admin());

drop policy if exists lessons_write_author on public.course_lessons;
create policy lessons_write_author on public.course_lessons
  for all using (exists (
    select 1 from public.course_modules m
    join public.courses c on c.id = m.course_id
    where m.id = module_id and c.author_id = public.uid()
  )) with check (exists (
    select 1 from public.course_modules m
    join public.courses c on c.id = m.course_id
    where m.id = module_id and c.author_id = public.uid()
  ));

-- Enrollments: readers manage their own
drop policy if exists enrollments_rw_self on public.course_enrollments;
create policy enrollments_rw_self on public.course_enrollments
  for all using (user_id = public.uid()) with check (user_id = public.uid());

-- Moderation helpers: set status transitions via simple checks
create or replace function public.request_article_review(article_id uuid)
returns void language plpgsql as $$
begin
  update public.articles set status = 'pending_review'
  where id = article_id and author_id = public.uid();
end; $$;

create or replace function public.approve_article(article_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve articles';
  end if;
  update public.articles set status = 'published' where id = article_id;
end; $$;

create or replace function public.reject_article(article_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject articles';
  end if;
  update public.articles set status = 'rejected' where id = article_id;
end; $$;

-- Similar helpers for courses
create or replace function public.request_course_review(course_id uuid)
returns void language plpgsql as $$
begin
  update public.courses set status = 'pending_review'
  where id = course_id and author_id = public.uid();
end; $$;

create or replace function public.approve_course(course_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve courses';
  end if;
  update public.courses set status = 'published' where id = course_id;
end; $$;

create or replace function public.reject_course(course_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject courses';
  end if;
  update public.courses set status = 'rejected' where id = course_id;
end; $$;

-- Indexes for performance
create index if not exists idx_articles_author_status on public.articles(author_id, status);
create index if not exists idx_articles_created_at on public.articles(created_at desc);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_courses_author_status on public.courses(author_id, status);
create index if not exists idx_courses_created_at on public.courses(created_at desc);

-- =====================================
-- Payments & Subscriptions
-- =====================================

-- Plans catalog
create table if not exists public.plans (
  id text primary key,
  amount_cents integer not null,
  currency text not null default 'NGN',
  interval text not null default 'month',
  description text,
  active boolean not null default true
);

-- Subscriptions per user
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active','expired','canceled')),
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, plan_id)
);

-- Payments log
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'flutterwave',
  provider_ref text,
  amount_cents integer not null,
  currency text not null default 'NGN',
  status text not null,
  event jsonb,
  created_at timestamptz not null default now()
);

-- Premium Author flag (MVP gating)
do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='authors' and column_name='premium'
  ) then
    alter table public.authors add column premium boolean not null default false;
  end if;
end $$;

-- Enable RLS
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- Plans: public read
drop policy if exists plans_select_public on public.plans;
create policy plans_select_public on public.plans for select using (true);

-- Subscriptions: user can read own; inserts/updates are via server role
drop policy if exists subs_select_self on public.subscriptions;
create policy subs_select_self on public.subscriptions
  for select using (user_id = public.uid());

-- Payments: user can read own records; writes via server role
drop policy if exists payments_select_self on public.payments;
create policy payments_select_self on public.payments
  for select using (user_id = public.uid());

-- Seed default plans (safe to re-run)
insert into public.plans (id, amount_cents, currency, interval, description, active)
values
  ('reader_monthly', 250000, 'NGN', 'month', 'Premium Reader monthly subscription', true),
  ('author_monthly', 1000000, 'NGN', 'month', 'Premium Author monthly subscription', true)
on conflict (id) do update set
  amount_cents = excluded.amount_cents,
  currency = excluded.currency,
  interval = excluded.interval,
  description = excluded.description,
  active = excluded.active;

-- =====================================
-- Demo Seed Data (safe to re-run)
-- Uses your existing profiles:
--   admin:  1fc519e2-f429-4da3-b431-a3540dddc9ea
--   author: 80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc
--   reader: b59acc06-d34f-4f78-8bc6-72236d8a4363
-- =====================================

-- Ensure an authors row exists for the author profile
insert into public.authors (user_id)
select '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
where not exists (
  select 1 from public.authors where user_id = '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
);

-- Articles: two published, one pending_review
insert into public.articles (author_id, title, slug, excerpt, content, cover_url, category, premium, status)
values (
  '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc',
  'The Art of Deep Work in a Distracted World',
  'deep-work',
  'Maintain focus and productivity in an increasingly digital world.',
  '[{"id":"1","type":"paragraph","content":"Deep work is the ability to focus without distraction on demanding tasks."},{"id":"2","type":"image","content":"https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop"},{"id":"3","type":"paragraph","content":"Practical strategies for reclaiming your focus."}]',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop',
  'Productivity',
  false,
  'published'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  cover_url = excluded.cover_url,
  category = excluded.category,
  premium = excluded.premium,
  status = excluded.status;

insert into public.articles (author_id, title, slug, excerpt, content, cover_url, category, premium, status)
values (
  '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc',
  'Building a Personal Brand as a Writer',
  'brand-for-writers',
  'Strategies to establish yourself as a thought leader in your niche.',
  '[{"id":"1","type":"paragraph","content":"Your brand is your promise to readers."},{"id":"2","type":"paragraph","content":"Align your topics, visuals, and voice."}]',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop',
  'Business',
  true,
  'published'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  cover_url = excluded.cover_url,
  category = excluded.category,
  premium = excluded.premium,
  status = excluded.status;

insert into public.articles (author_id, title, slug, excerpt, content, cover_url, category, premium, status)
values (
  '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc',
  'Ethical AI in Content Creation',
  'ai-ethics',
  'Navigate the future of AI while maintaining authenticity.',
  '[{"id":"1","type":"paragraph","content":"AI can amplify creativity when used responsibly."}]',
  'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&h=600&fit=crop',
  'Technology',
  true,
  'pending_review'
)
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  cover_url = excluded.cover_url,
  category = excluded.category,
  premium = excluded.premium,
  status = excluded.status;

-- Courses: one published, one pending_review
insert into public.courses (author_id, title, description, price, status)
select '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc', 'Content Strategy Masterclass',
       'Plan, produce, and promote content that builds authority.', 49.00, 'published'
where not exists (
  select 1 from public.courses where title = 'Content Strategy Masterclass' and author_id = '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
);

insert into public.courses (author_id, title, description, price, status)
select '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc', 'Learning Psychology 101',
       'Understand how people learn and design materials effectively.', 0, 'pending_review'
where not exists (
  select 1 from public.courses where title = 'Learning Psychology 101' and author_id = '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
);

-- Modules for the published course
insert into public.course_modules (course_id, position, title, description)
select c.id, 1, 'Foundations', 'Core principles of content strategy'
from public.courses c
where c.title = 'Content Strategy Masterclass' and c.author_id = '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
and not exists (
  select 1 from public.course_modules m where m.course_id = c.id and m.position = 1
);

insert into public.course_modules (course_id, position, title, description)
select c.id, 2, 'Distribution', 'Systems for publishing and measuring impact'
from public.courses c
where c.title = 'Content Strategy Masterclass' and c.author_id = '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
and not exists (
  select 1 from public.course_modules m where m.course_id = c.id and m.position = 2
);

-- Lessons for module 1
insert into public.course_lessons (module_id, position, title, content, video_url)
select m.id, 1, 'Define Audience', 'Identify who you serve and why', null
from public.course_modules m
join public.courses c on c.id = m.course_id
where c.title = 'Content Strategy Masterclass' and m.position = 1 and c.author_id = '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
and not exists (
  select 1 from public.course_lessons l where l.module_id = m.id and l.position = 1
);

insert into public.course_lessons (module_id, position, title, content, video_url)
select m.id, 2, 'Messaging Pillars', 'Create consistent themes to guide content', null
from public.course_modules m
join public.courses c on c.id = m.course_id
where c.title = 'Content Strategy Masterclass' and m.position = 1 and c.author_id = '80ac6fd9-7615-4a4d-bfeb-6bf9923ad8cc'
and not exists (
  select 1 from public.course_lessons l where l.module_id = m.id and l.position = 2
);

-- =====================================
-- Additions: Engagement, Follows, Progress, Subscriptions, Storage
-- =====================================

-- Profiles: optional bio for author pages
alter table public.profiles add column if not exists bio text;

-- Authors: premium flag, badge, followers counter
alter table public.authors add column if not exists premium boolean default false;
alter table public.authors add column if not exists badge text;
alter table public.authors add column if not exists followers_count integer not null default 0;

-- Authors: payout/bank details
alter table public.authors add column if not exists bank_name text;
alter table public.authors add column if not exists bank_code text;
alter table public.authors add column if not exists account_name text;
alter table public.authors add column if not exists account_number text;
alter table public.authors add column if not exists payout_currency text default 'NGN';
alter table public.authors add column if not exists payout_method text default 'bank_transfer';
alter table public.authors add column if not exists country text;
alter table public.authors add column if not exists tax_id text;
alter table public.authors add column if not exists paypal_email text;
alter table public.authors add column if not exists mobile_money_number text;

-- Articles: counters and published timestamp
alter table public.articles add column if not exists likes_count integer not null default 0;
alter table public.articles add column if not exists bookmarks_count integer not null default 0;
alter table public.articles add column if not exists comments_count integer not null default 0;
alter table public.articles add column if not exists views_total integer not null default 0;
alter table public.articles add column if not exists reads_seconds_total integer not null default 0;
alter table public.articles add column if not exists published_at timestamptz;

-- Courses: enrollment counter for public display
alter table public.courses add column if not exists enrollments_count integer not null default 0;

-- Profiles: allow authenticated users to read names/avatars
drop policy if exists profiles_select_all_auth on public.profiles;
create policy profiles_select_all_auth on public.profiles
  for select using (auth.role() = 'authenticated');

-- =======================
-- Follows (authors)
-- =======================
create table if not exists public.author_follows (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (author_id, follower_id)
);
alter table public.author_follows enable row level security;
drop policy if exists follows_select_public on public.author_follows;
create policy follows_select_public on public.author_follows
  for select using (true);
drop policy if exists follows_write_self on public.author_follows;
create policy follows_write_self on public.author_follows
  for all using (follower_id = public.uid()) with check (follower_id = public.uid());

-- =======================
-- Article Comments
-- =======================
create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.article_comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.article_comments enable row level security;
drop policy if exists comments_select_public on public.article_comments;
create policy comments_select_public on public.article_comments
  for select using (exists (
    select 1 from public.articles a where a.id = article_id and a.status = 'published'
  ) or user_id = public.uid() or public.is_admin());
drop policy if exists comments_insert_self on public.article_comments;
create policy comments_insert_self on public.article_comments
  for insert with check (user_id = public.uid());
drop policy if exists comments_update_self on public.article_comments;
create policy comments_update_self on public.article_comments
  for update using (user_id = public.uid()) with check (user_id = public.uid());
drop policy if exists comments_delete_self_admin on public.article_comments;
create policy comments_delete_self_admin on public.article_comments
  for delete using (user_id = public.uid() or public.is_admin());

-- =======================
-- Reading time aggregation
-- =======================
create table if not exists public.article_reads_daily (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_date date not null default current_date,
  seconds integer not null default 0,
  sessions integer not null default 1,
  primary key (article_id, user_id, read_date)
);
alter table public.article_reads_daily enable row level security;
drop policy if exists reads_rw_self on public.article_reads_daily;
create policy reads_rw_self on public.article_reads_daily
  for all using (user_id = public.uid()) with check (user_id = public.uid());

-- =======================
-- Course lesson progress
-- =======================
create table if not exists public.lesson_progress (
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);
alter table public.lesson_progress enable row level security;
drop policy if exists lesson_progress_rw_self on public.lesson_progress;
create policy lesson_progress_rw_self on public.lesson_progress
  for all using (user_id = public.uid()) with check (user_id = public.uid());

-- Enrollments: allow select for published courses (counts)
drop policy if exists enrollments_select_published on public.course_enrollments;
create policy enrollments_select_published on public.course_enrollments
  for select using (exists (
    select 1 from public.courses c where c.id = course_id and c.status = 'published'
  ) or public.is_admin());

-- =======================
-- Subscriptions & Payments
-- =======================
create table if not exists public.plans (
  id text primary key,
  amount_cents integer not null,
  currency text not null default 'NGN',
  interval text not null default 'month',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;
drop policy if exists plans_select_public on public.plans;
create policy plans_select_public on public.plans
  for select using (true);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id) on delete restrict,
  status text not null default 'active' check (status in ('active','expired','canceled')),
  renews_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_rw_self on public.subscriptions;
create policy subscriptions_rw_self on public.subscriptions
  for all using (user_id = public.uid()) with check (user_id = public.uid());
drop policy if exists subscriptions_select_admin on public.subscriptions;
create policy subscriptions_select_admin on public.subscriptions
  for select using (public.is_admin());

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_ref text,
  amount_cents integer not null,
  currency text not null default 'NGN',
  status text not null,
  event jsonb,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
drop policy if exists payments_select_self on public.payments;
create policy payments_select_self on public.payments
  for select using (user_id = public.uid());
drop policy if exists payments_select_admin on public.payments;
create policy payments_select_admin on public.payments
  for select using (public.is_admin());

-- =======================
-- Storage buckets and policies
-- =======================
insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (select 1 from storage.buckets where id = 'avatars');

-- =======================
-- Currency Migration: USD → NGN (₦) at 1 USD = ₦1500
-- Converts any existing USD amounts to NGN kobo and updates currency to 'NGN'.
do $$
begin
  -- Convert plan prices if any plans still in USD
  update public.plans
    set amount_cents = amount_cents * 1500,
        currency = 'NGN'
  where currency = 'USD';

  -- Convert payment records stored in USD
  update public.payments
    set amount_cents = amount_cents * 1500,
        currency = 'NGN'
  where currency = 'USD';
end $$;

insert into storage.buckets (id, name, public)
select 'covers', 'covers', true
where not exists (select 1 from storage.buckets where id = 'covers');

insert into storage.buckets (id, name, public)
select 'course-assets', 'course-assets', true
where not exists (select 1 from storage.buckets where id = 'course-assets');

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (bucket_id in ('avatars','covers','course-assets'));

drop policy if exists storage_write_own on storage.objects;
create policy storage_write_own on storage.objects
  for insert with check (
    bucket_id in ('avatars','covers','course-assets') and (
      owner = auth.uid() or name like (auth.uid()::text || '/%')
    )
  );
drop policy if exists storage_update_delete_own on storage.objects;
create policy storage_update_delete_own on storage.objects
  for all using (
    bucket_id in ('avatars','covers','course-assets') and (
      owner = auth.uid() or name like (auth.uid()::text || '/%')
    )
  ) with check (
    bucket_id in ('avatars','covers','course-assets') and (
      owner = auth.uid() or name like (auth.uid()::text || '/%')
    )
  );

-- =======================
-- Trigger Functions to keep counters in sync
-- =======================

-- Likes counter
create or replace function public.t_articles_likes_counter() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set likes_count = likes_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles set likes_count = greatest(0, likes_count - 1) where id = old.article_id;
  end if;
  return null;
end; $$;
drop trigger if exists articles_likes_counter on public.article_likes;
create trigger articles_likes_counter
after insert or delete on public.article_likes
for each row execute procedure public.t_articles_likes_counter();

-- Bookmarks counter
create or replace function public.t_articles_bookmarks_counter() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set bookmarks_count = bookmarks_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles set bookmarks_count = greatest(0, bookmarks_count - 1) where id = old.article_id;
  end if;
  return null;
end; $$;
drop trigger if exists articles_bookmarks_counter on public.article_bookmarks;
create trigger articles_bookmarks_counter
after insert or delete on public.article_bookmarks
for each row execute procedure public.t_articles_bookmarks_counter();

-- Comments counter
create or replace function public.t_articles_comments_counter() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set comments_count = comments_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles set comments_count = greatest(0, comments_count - 1) where id = old.article_id;
  end if;
  return null;
end; $$;
drop trigger if exists articles_comments_counter on public.article_comments;
create trigger articles_comments_counter
after insert or delete on public.article_comments
for each row execute procedure public.t_articles_comments_counter();

-- Views total (daily rollups)
create or replace function public.t_articles_views_total() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set views_total = views_total + new.views where id = new.article_id;
  elsif tg_op = 'UPDATE' then
    update public.articles set views_total = views_total + (new.views - old.views) where id = new.article_id;
  end if;
  return null;
end; $$;
drop trigger if exists articles_views_total on public.article_views_daily;
create trigger articles_views_total
after insert or update on public.article_views_daily
for each row execute procedure public.t_articles_views_total();

-- Reads seconds total (daily rollups)
create or replace function public.t_articles_reads_total() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set reads_seconds_total = reads_seconds_total + new.seconds where id = new.article_id;
  elsif tg_op = 'UPDATE' then
    update public.articles set reads_seconds_total = reads_seconds_total + (new.seconds - old.seconds) where id = new.article_id;
  end if;
  return null;
end; $$;
drop trigger if exists articles_reads_total on public.article_reads_daily;
create trigger articles_reads_total
after insert or update on public.article_reads_daily
for each row execute procedure public.t_articles_reads_total();

-- Author followers counter
create or replace function public.t_author_followers_counter() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.authors set followers_count = followers_count + 1 where user_id = new.author_id;
  elsif tg_op = 'DELETE' then
    update public.authors set followers_count = greatest(0, followers_count - 1) where user_id = old.author_id;
  end if;
  return null;
end; $$;
drop trigger if exists author_followers_counter on public.author_follows;
create trigger author_followers_counter
after insert or delete on public.author_follows
for each row execute procedure public.t_author_followers_counter();

-- Course enrollments counter
create or replace function public.t_course_enrollments_counter() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.courses set enrollments_count = enrollments_count + 1 where id = new.course_id;
  elsif tg_op = 'DELETE' then
    update public.courses set enrollments_count = greatest(0, enrollments_count - 1) where id = old.course_id;
  end if;
  return null;
end; $$;
drop trigger if exists course_enrollments_counter on public.course_enrollments;
create trigger course_enrollments_counter
after insert or delete on public.course_enrollments
for each row execute procedure public.t_course_enrollments_counter();

-- Recalculate enrollment progress when lesson progress changes
create or replace function public.recalc_enrollment_progress(p_lesson_id uuid, p_user_id uuid) returns void language plpgsql as $$
declare
  v_module uuid;
  v_course uuid;
  v_total int;
  v_completed int;
begin
  select m.id, m.course_id into v_module, v_course
  from public.course_lessons l
  join public.course_modules m on m.id = l.module_id
  where l.id = p_lesson_id;
  if v_course is null then return; end if;
  select count(*) into v_total
  from public.course_lessons l2
  join public.course_modules m2 on m2.id = l2.module_id
  where m2.course_id = v_course;
  select count(*) into v_completed
  from public.lesson_progress lp
  join public.course_lessons l3 on l3.id = lp.lesson_id
  join public.course_modules m3 on m3.id = l3.module_id
  where lp.user_id = p_user_id and lp.status = 'completed' and m3.course_id = v_course;
  if v_total > 0 then
    update public.course_enrollments
    set progress = round((v_completed::numeric / v_total::numeric) * 100.0, 2)
    where course_id = v_course and user_id = p_user_id;
  end if;
end; $$;

create or replace function public.t_recalc_on_lesson_progress() returns trigger language plpgsql as $$
begin
  perform public.recalc_enrollment_progress(new.lesson_id, new.user_id);
  return null;
end; $$;
drop trigger if exists lesson_progress_recalc on public.lesson_progress;
create trigger lesson_progress_recalc
after insert or update on public.lesson_progress
for each row execute procedure public.t_recalc_on_lesson_progress();

-- =======================
-- RPC helpers
-- =======================
create or replace function public.record_article_view(p_article_id uuid, p_views int default 1) returns void
language plpgsql as $$
begin
  insert into public.article_views_daily(article_id, view_date, views)
  values (p_article_id, current_date, p_views)
  on conflict (article_id, view_date) do update set views = public.article_views_daily.views + excluded.views;
end; $$;

create or replace function public.record_article_read(p_article_id uuid, p_seconds int default 30) returns void
language plpgsql as $$
begin
  insert into public.article_reads_daily(article_id, user_id, read_date, seconds, sessions)
  values (p_article_id, public.uid(), current_date, p_seconds, 1)
  on conflict (article_id, user_id, read_date) do update set
    seconds = public.article_reads_daily.seconds + excluded.seconds,
    sessions = public.article_reads_daily.sessions + 1;
end; $$;
-- Admin and public read RLS policies
-- Helper: is_admin() checks if current auth uid has user_type = 'admin'
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.user_type = 'admin'
  );
$$;

-- Profiles: everyone can read basic profile info, users can modify their own profile, admins full access
alter table public.profiles enable row level security;
drop policy if exists app_profiles_select_all_users on public.profiles;
create policy app_profiles_select_all_users
  on public.profiles for select
  to authenticated
  using (true);
drop policy if exists app_profiles_owner_modify on public.profiles;
create policy app_profiles_owner_modify
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
drop policy if exists app_profiles_admin_all on public.profiles;
create policy app_profiles_admin_all
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Articles: published visible to all authenticated; owners can manage; admins full access
alter table public.articles enable row level security;
drop policy if exists app_articles_select_published on public.articles;
create policy app_articles_select_published
  on public.articles for select
  to authenticated
  using (status = 'published');
drop policy if exists app_articles_owner_manage on public.articles;
create policy app_articles_owner_manage
  on public.articles for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
drop policy if exists app_articles_admin_all on public.articles;
create policy app_articles_admin_all
  on public.articles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Article comments: readable by all authenticated; owners can write/update/delete; admins full access
alter table public.article_comments enable row level security;
drop policy if exists app_comments_select_all on public.article_comments;
create policy app_comments_select_all
  on public.article_comments for select
  to authenticated
  using (true);
drop policy if exists app_comments_owner_write on public.article_comments;
create policy app_comments_owner_write
  on public.article_comments for insert
  to authenticated
  with check (user_id = auth.uid());
drop policy if exists app_comments_owner_update on public.article_comments;
create policy app_comments_owner_update
  on public.article_comments for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists app_comments_owner_delete on public.article_comments;
create policy app_comments_owner_delete
  on public.article_comments for delete
  to authenticated
  using (user_id = auth.uid());
drop policy if exists app_comments_admin_all on public.article_comments;
create policy app_comments_admin_all
  on public.article_comments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Article likes: readable by all authenticated; owners can like/unlike; admins full access
alter table public.article_likes enable row level security;
drop policy if exists app_likes_select_all on public.article_likes;
create policy app_likes_select_all
  on public.article_likes for select
  to authenticated
  using (true);
drop policy if exists app_likes_owner_insert on public.article_likes;
create policy app_likes_owner_insert
  on public.article_likes for insert
  to authenticated
  with check (user_id = auth.uid());
drop policy if exists app_likes_owner_delete on public.article_likes;
create policy app_likes_owner_delete
  on public.article_likes for delete
  to authenticated
  using (user_id = auth.uid());
drop policy if exists app_likes_admin_all on public.article_likes;
create policy app_likes_admin_all
  on public.article_likes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Author follows: readable by all authenticated; owners can follow/unfollow; admins full access
alter table public.author_follows enable row level security;
drop policy if exists app_follows_select_all on public.author_follows;
create policy app_follows_select_all
  on public.author_follows for select
  to authenticated
  using (true);
drop policy if exists app_follows_owner_insert on public.author_follows;
create policy app_follows_owner_insert
  on public.author_follows for insert
  to authenticated
  with check (follower_id = auth.uid());
drop policy if exists app_follows_owner_delete on public.author_follows;
create policy app_follows_owner_delete
  on public.author_follows for delete
  to authenticated
  using (follower_id = auth.uid());
drop policy if exists app_follows_admin_all on public.author_follows;
create policy app_follows_admin_all
  on public.author_follows for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Courses: published visible to all authenticated; owners manage; admins full access
alter table public.courses enable row level security;
drop policy if exists app_courses_select_published on public.courses;
create policy app_courses_select_published
  on public.courses for select
  to authenticated
  using (status = 'published');
drop policy if exists app_courses_owner_manage on public.courses;
create policy app_courses_owner_manage
  on public.courses for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
drop policy if exists app_courses_admin_all on public.courses;
create policy app_courses_admin_all
  on public.courses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lesson progress: visible to owner; admins full access
alter table public.lesson_progress enable row level security;
drop policy if exists app_lesson_progress_owner on public.lesson_progress;
create policy app_lesson_progress_owner
  on public.lesson_progress for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists app_lesson_progress_admin_all on public.lesson_progress;
create policy app_lesson_progress_admin_all
  on public.lesson_progress for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Plans: readable to all authenticated; admins manage
alter table public.plans enable row level security;
drop policy if exists app_plans_select_all on public.plans;
create policy app_plans_select_all
  on public.plans for select
  to authenticated
  using (true);
drop policy if exists app_plans_admin_all on public.plans;
create policy app_plans_admin_all
  on public.plans for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Subscriptions: visible to owner and admins
alter table public.subscriptions enable row level security;
drop policy if exists app_subscriptions_owner on public.subscriptions;
create policy app_subscriptions_owner
  on public.subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists app_subscriptions_admin_all on public.subscriptions;
create policy app_subscriptions_admin_all
  on public.subscriptions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Payments: visible to owner and admins
alter table public.payments enable row level security;
drop policy if exists app_payments_owner on public.payments;
create policy app_payments_owner
  on public.payments for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists app_payments_admin_all on public.payments;
create policy app_payments_admin_all
  on public.payments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

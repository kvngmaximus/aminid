# Aminid — Product Requirements Document (PRD)

## 1. Overview
- Product name: Aminid
- Tagline: Where Minds Sharpen Minds
- Vision: A modern knowledge platform where authors publish articles and courses, readers learn and engage, and admins curate quality and trust.
- Summary: SPA built with React + Express API, using shared types, TailwindCSS UI, and Netlify/Vite tooling for development and deployment. Backend services will use Supabase (Auth, Postgres, Storage, Policies) and Flutterwave for payments.

## 2. Goals & Non-Goals
- Goals:
  - Enable browsing and reading high-quality articles.
  - Offer structured courses with modules and progress tracking.
  - Provide role-based dashboards (Reader, Author, Admin).
  - Ensure fast, responsive UX with modern UI components.
  - Maintain a clear API surface for future expansion (auth, payments).
- Non-Goals:
  - Full LMS feature-set (certifications, grading) in MVP.
  - Complex social graph or community features in MVP.
  - Advanced moderation/ML in MVP.

## 3. Users & Personas
- Reader: Discovers content, reads articles, enrolls in courses, tracks progress.
- Author: Publishes articles/courses, manages content and analytics.
- Admin: Oversees platform health, moderates content, manages users.

## 4. Scope (MVP)
- Content Browsing:
  - Articles list and detail pages; Authors list and profiles.
  - Courses catalog and detail pages with syllabus/feature lists.
- Authentication:
  - Supabase Auth with email OTP and OAuth. Client initializes with anon key; server functions use service role.
- Dashboards:
  - Reader: Progress, saved items, subscription status and renewal.
  - Author: Content management, stats (reads, likes, followers), premium status.
  - Admin: Users/Content overview, moderation, recognition tools, revenue reports.
- Navigation:
  - Routes defined in `client/App.tsx`: `/`, `/articles`, `/articles/:id`, `/authors`, `/authors/:id`, `/courses`, `/courses/:id`, `/login`, `/signup`, `/dashboard/reader`, `/dashboard/author`, `/dashboard/admin`, fallback `*`.

## 5. Functional Requirements
- Articles:
  - List page with cards; detail page with rich content.
  - Filter/search (phase 2) and author linking.
- Authors:
  - Directory page; profile page showing authored content.
- Courses:
  - Catalog; course detail page with modules, features, and enrollment CTA.
  - Track progress (phase 2), module completion states.
- Auth:
  - UI flows for login/signup; integrate API in phase 2.
- Dashboards:
  - Reader: View enrolled items, latest content.
  - Author: Create/edit content (UI), draft/publish states (phase 2).
  - Admin: Review content, manage users, basic actions.

## 6. Non-Functional Requirements
- Performance: Fast navigation, component-level optimizations.
- Accessibility: Semantic HTML, ARIA where necessary.
- Security: Protect sensitive server paths; avoid exposing env/certs.
- Reliability: Graceful error states and 404 handling.
- SEO: Client-side routing; consider SSR/hydration later if needed.

## 7. Architecture & Tech Stack
- Frontend: React 18, React Router 6, TypeScript, Vite, TailwindCSS.
- UI: Radix UI components, custom Navbar/Footer, shadcn-style primitives.
- Backend: Express integrated into Vite dev server; production Node server serves built SPA.
- Data & Auth: Supabase (Postgres, Auth, Storage, Row Level Security policies).
- Payments: Flutterwave (Subscriptions and one-time purchases), webhook-driven status updates.
- Shared Types: `shared/api.ts` for client-server type safety.
- Tooling: Vitest for tests, Prettier, TypeScript config with path aliases.
- Deployment: Netlify functions or Express server; Supabase-hosted Postgres; Flutterwave webhooks.
- Configs:
  - Dev server hosts both frontend and Express middleware.
  - `server.fs.allow` configured to serve root, client, shared; deny sensitive paths.

## 8. API Design (Current & Planned)
- Current example endpoints:
  - `GET /api/ping` → `{ message: string }`
  - `GET /api/demo` → `DemoResponse` (shared type)
- Planned endpoints (phase 2):
  - Articles: `GET /api/articles`, `GET /api/articles/:id`, `POST /api/articles`, `PUT /api/articles/:id`, `DELETE /api/articles/:id`
  - Authors: `GET /api/authors`, `GET /api/authors/:id`
  - Courses: `GET /api/courses`, `GET /api/courses/:id`, `POST /api/courses`, `PUT /api/courses/:id`
  - Auth: Supabase client-side auth flows; server endpoints for privileged ops (e.g., admin actions).
  - Reader progress: `GET /api/progress`, `POST /api/progress`
  - Payments: `POST /api/payments/subscribe` (Flutterwave init), `POST /api/payments/webhook` (Flutterwave events)

## 9. Data Model (Initial)
Supabase Auth provides `auth.users`. We maintain `profiles` 1:1 with `auth.users`.

- profiles: id (uuid, pk, references auth.users), name, username, bio, avatar_url, is_admin boolean, created_at.
- authors: id (uuid pk), user_id (uuid fk → profiles.id), premium boolean, badge text, followers_count int, created_at.
- articles: id (uuid), author_id (uuid fk), title, excerpt, content_blocks jsonb, image_url, category, is_premium boolean, is_featured boolean, read_time int, likes_count int, published_at timestamptz, created_at.
- article_reads: id (uuid), article_id (uuid fk), user_id (uuid fk), seconds_read int, created_at.
- likes: id (uuid), article_id (uuid fk), user_id (uuid fk), created_at.
- follows: id (uuid), author_id (uuid fk), user_id (uuid fk), created_at.
- courses: id (uuid), author_id (uuid fk), title, description, image_url, is_premium boolean, created_at.
- course_modules: id (uuid), course_id (uuid fk), title, order_index int, duration_minutes int.
- enrollments: id (uuid), user_id, course_id, progress_percent int, created_at.
- subscriptions: id (uuid), user_id, plan_id, status (active|expired|canceled), renews_at timestamptz, created_at.
- plans: id (text), amount_cents int, currency text, interval text (month), description text, active boolean.
- payments: id (uuid), user_id, provider text (flutterwave), provider_ref text, amount_cents int, currency text, status text, event jsonb, created_at.
- recognitions: id (uuid), type text (author_month|author_year|article_month), target_id uuid, month int, year int, metadata jsonb, created_at.

## 10. UX & Navigation
- Consistent Navbar and Footer; responsive layout; Tailwind utility classes.
- Route guard patterns for dashboards (phase 2 with auth).
- 404 handling via `client/pages/NotFound.tsx`.

## 11. Dependencies & Config Highlights
- `vite.config.ts`: dev server config, aliases `@` → client, `@shared` → shared, Express dev middleware.
- `vite.config.server.ts`: server build with externalized Node/Express deps.
- `tailwind.config.ts`: `content: ["./client/**/*.{ts,tsx}"]`, custom tokens and animations.
- `netlify.toml`: SPA publish folder, function redirects for `/api/*`.
- Scripts: `dev`, `build`, `build:client`, `build:server`, `start`, `test`, `typecheck`.

## 12. Milestones
- MVP:
  - Implement articles/authors/courses pages with sample data.
  - Hook basic `GET` APIs for articles/authors/courses (read-only).
  - Basic dashboards with static or mock data.
- Beta:
  - Supabase Auth and role-based route protection.
  - Author content creation/edit flows (Supabase writes with RLS).
  - Reader enrollment/progress tracking (Supabase tables).
  - Admin moderation actions (server role endpoints).
  - Flutterwave subscriptions activated; webhook updates `subscriptions` and `payments`.
- Production:
  - SEO improvements, performance tuning, analytics and telemetry.
  - Payment integration (optional), audit logging, backups.

## 13. Risks & Assumptions
- Risk: Duplicated repo structure (root and nested `aminid/`) may cause confusion; standardize on one.
- Assumption: Initial data may be mocked; real backend/storage phased in.
- Risk: Client-only routing limits SEO; SSR would be a later enhancement.

## 14. Acceptance Criteria (MVP)
- All defined routes render without errors on dev server.
- Basic article/author/course pages display real or mock data.
- Dashboards render role-specific shells.
- API `GET /api/ping` and `GET /api/demo` function.
- Build succeeds; production server serves SPA from `dist/spa`.
 - Supabase project configured (profiles, authors, articles, courses, RLS policies).
 - Flutterwave sandbox keys set, webhook endpoint receives events and updates subscription status.

---
Document owner: Product/Engineering
Last updated: Supabase + Flutterwave integration plan added
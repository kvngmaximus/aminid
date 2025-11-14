# Blueprint — Mind of Amin Platform

This blueprint aligns the brand vision with current implementation status and the execution plan using Supabase (backend) and Flutterwave (payments).

## Vision & Core Types
- Vision: A knowledge ecosystem where readers become disciplined thinkers and authors grow influence and income.
- User Types:
  - Free Reader
  - Premium Reader (subscription)
  - Free Author (Contributor)
  - Premium Author (Columnist)

## Roadmap Phases (from Brand Blueprint)
- Phase 1 — Foundation
  - Website with Free Reader + Free Author functions
  - Premium features visible but locked
  - Content seeding (3–4 articles weekly)
  - 20 free lifetime premium slots for admin
- Phase 2 — Audience Building
  - Social strategy, SEO, open community groups, debates
- Phase 3 — Premium Activation
  - Premium Reader subscriptions; Premium Author program + revenue sharing
  - First masterclass; monthly live Q&A
  - Recognition & Bulletins (Author/Article of Month)
- Phase 4 — Expansion
  - Premium-only community features, merchandise, publishing imprint, partnerships

## Current Status (Progress)
- Frontend
  - React + Vite app scaffolding with Tailwind and Radix UI: DONE
  - Core pages: Index, Articles, Article Detail, Authors, Author Profile, Courses, Course Detail, Dashboards: DONE (UI)
  - Navbar/Footer, Cards, Modals (Article/Course), Inputs: DONE
  - SafeImage fallback for external images (handles ORB): DONE
  - Login/Signup UI: DONE (backend wiring pending)
- Backend (Dev)
  - Express middleware mounted in Vite dev server: DONE
  - Netlify function example: DONE
- Documentation
  - README: DONE
  - PRD updated with Supabase + Flutterwave plan: DONE

## TODOs (Near-Term)
- Supabase
  - Create project and run `supabase.sql` to setup tables, policies: TODO
  - Integrate Supabase Auth (client init, session management, guards): TODO
  - Wire Article/Author/Course CRUD (RLS-aware): TODO
  - Storage buckets for avatars and covers; signed URL flow for private assets: TODO
- Flutterwave Payments
  - Subscription plans, payment link/charge initialization: TODO
  - Webhook endpoint to update `subscriptions` and `payments`: TODO
  - Premium Reader and Premium Author status gating: TODO
- Recognition & Bulletin
  - Admin tools to mark monthly/annual recognitions; homepage badges: TODO
- Analytics & Engagement
  - Reads, likes, follows, reading time capture; revenue share computations: TODO
- Masterclasses & Courses
  - Course module authoring; enrollment tracking; pricing split: TODO

## Supabase Architecture Overview
- Auth: Supabase Auth (email OTP, OAuth). `profiles` table maps to `auth.users`.
- Data:
  - Content: `authors`, `articles`, `courses`, `course_modules`
  - Engagement: `article_reads`, `likes`, `follows`
  - Enrollment: `enrollments`
  - Monetization: `plans`, `subscriptions`, `payments`
  - Recognition: `recognitions`
- Policies: RLS ensures readers can view published content, authors can manage their own content, and admins use server role for privileged actions.
- Storage: `images` bucket for avatars/covers (public or private with signed URLs).

## Flutterwave Integration Plan
- Payment Flows
  - Subscriptions: Initialize payment for monthly plan → webhook confirms payment → set `subscriptions.status = active` and `renews_at`.
  - Premium Authors: Charge monthly fee; similarly update premium author status.
- Webhooks
  - Validate signature → record `payments` → update `subscriptions` (and author premium status as needed).
- Env
  - `FLW_PUBLIC_KEY`, `FLW_SECRET_KEY`, `FLW_WEBHOOK_SECRET`

## Admin & Revenue Share
- Pool: 60% platform / 40% authors by engagement.
- Implementation sketch:
  - Aggregate per-article engagement (reads, read_time, likes).
  - Monthly job calculates author shares based on weights; write results to a report table.

## Next Actions
- Execute `supabase.sql` on the Supabase project.
- Configure Flutterwave sandbox, webhook to dev endpoint.
- Implement client guards and server functions for privileged operations.

---
Owner: Product/Engineering
Last updated: This revision
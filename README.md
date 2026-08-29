# סיור סליחות ירושלים — Jerusalem Interactive Walking Tour

Mobile-first PWA (Next.js + Supabase + Google Maps) for a self-guided 5-station
Selichot walking tour in Jerusalem. See [`PRODUCT_SPEC_HE.md`](./PRODUCT_SPEC_HE.md)
and [`CURSOR.md`](./CURSOR.md) for the full product/technical spec this build
follows.

## Stack

- Next.js 16 (App Router) + TypeScript (strict)
- Tailwind CSS v4
- Supabase (Postgres, Auth, Storage)
- Google Maps JavaScript API (walking routes, live navigation)
- Zod for server-side validation
- Vitest for unit tests

## Quick start (local, zero external services)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. **No Supabase project or Google Maps key is
required to get a working local build**: when `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent, the app automatically switches to
an in-memory mock backend (`lib/data/mock-store.ts`) seeded with one real
station (בית הרב קוק) and four unpublished placeholder stations. This lets
you exercise the entire flow — start → navigate (straight-line fallback) →
scan (demo tokens `<slug>-demo`, e.g. `beit-harav-kook-demo` via
`/q/beit-harav-kook-demo`) → watch (sample video) → complete — and the full
admin panel at `/admin/login` (default dev credentials printed on the login
page) without any cloud setup.

When `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` is missing, map screens fall back
to an accessible station list instead of failing — this is intentional (see
CURSOR.md §18, error/edge states).

## Connecting real services

1. **Supabase**
   - Create a project, then run the SQL in `supabase/migrations/0001_init.sql`
     and `supabase/migrations/0002_qr_image_and_upload_limits.sql` in order
     (SQL Editor or `supabase db push` if you use the Supabase CLI).
   - Optionally run `supabase/seed.sql` to seed בית הרב קוק (stations 2–5 are
     intentionally left blank/unpublished — see "Remaining product decisions"
     below).
   - Create a Storage bucket named `station-videos` (the migration does this
     for you) and upload station videos/posters/captions, or use the
     admin panel's upload form (direct-to-storage upload, up to 300MB for
     video). **Note:** Supabase's Free plan hard-caps every upload at 50MB
     regardless of bucket settings — 300MB video uploads require the Pro
     plan or higher, plus setting "Global file size limit" in
     Settings → Storage to at least 300MB.
   - Create an admin user (Authentication → Users) — any authenticated user
     can manage content; there is no public sign-up.
   - Copy the project URL / anon key / service role key into `.env.local`.
2. **Google Maps**
   - Enable the **Maps JavaScript API** and **Directions API**.
   - Create a browser API key restricted by HTTP referrer, and set it as
     `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`.
3. Fill in `SESSION_HASH_SECRET` and `QR_HASH_PEPPER` with strong random
   values (`openssl rand -base64 32`) before going to production.

See [`.env.example`](./.env.example) for the full list.

## Scripts

```bash
npm run dev         # local dev server
npm run build        # production build
npm run start        # run a production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (pure logic: geo, next-station, QR hashing, reroute)
```

## Project structure

```text
app/                  routes (see CURSOR.md §4 for the full URL map)
components/           brand/ ui/ map/ navigation/ station/ video/ scan/ admin/ complete/
lib/
  config/env.ts        typed, validated environment config (+ mock-backend switch)
  supabase/            browser / server / admin clients + generated-style types
  data/                station repository (Supabase ⇄ in-memory mock)
  session/             anonymous cookie session, progress state machine, next-station logic
  qr/                  token generation/hashing + validate/generate/revoke service
  google-maps/         loader, walking-route adapter, external Maps URL builder
  geo/                 haversine, point-to-polyline distance, reroute decision logic
  device/               wake lock + compass heading helpers
  analytics/           whitelisted event tracking (server + client) and admin summary
  admin/                admin auth + server actions (stations CRUD, reorder, QR, media upload)
proxy.ts               optimistic /admin/* auth gate (Next.js 16 renamed Middleware → Proxy)
supabase/
  migrations/0001_init.sql   schema + RLS + storage bucket (source of truth)
  seed.sql                   seed data (בית הרב קוק only — see below)
```

## Remaining product decisions (do not invent — see CURSOR.md §24 / §30)

The following still need to come from the product owner before production;
everything else in the product is implemented and working end-to-end:

- Names, addresses and coordinates for stations 2–5 (enter via `/admin/stations/new`).
- Final content order between the 5 stations.
- Real video assets (MP4 H.264) + Hebrew WebVTT captions per station.
- Final marketing/legal copy (privacy notice, terms).
- Production domain (`NEXT_PUBLIC_APP_URL`).
- Google Maps Platform billing/API key for production traffic.
- Per-station arrival radius, tuned from on-site field testing.
- Whether out-of-order QR scans should ever be blocked (currently always allowed).
- Whether video completion should strictly require 90% playback (currently:
  reaching 90% **or** tapping "סיימתי, ממשיכים" both complete a station).

## Deployment (Vercel)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel, set the environment variables from
   `.env.example`.
3. Vercel will run `npm run build` automatically. Make sure Supabase RLS
   policies and the `station-videos` bucket exist before going live.

## Testing

- `npm run test` — unit tests for pure logic (Haversine, next-station
  wrap-around, QR token hashing, off-route/reroute thresholds).
- Manual QA required for GPS, device heading/compass, and camera-based QR
  scanning — these depend on real device hardware and cannot be fully
  simulated in CI (see CURSOR.md §22).

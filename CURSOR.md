# CURSOR.md — Build Instructions for Jerusalem Interactive Walking Tour

> קובץ זה מיועד להיות מונח בשורש ה‑repository. קרא קודם את `PRODUCT_SPEC_HE.md` ואת `SUPABASE_SCHEMA.sql`.

## 0. Mission

בנה Web App / PWA בעברית, Mobile‑First, לסיור סליחות עצמאי ב‑5 נקודות בירושלים.

ה‑flow המרכזי:

`Landing → Location → Choose nearest/recommended start → Walk navigation → Arrive → Scan QR → Watch station video → Next station → Complete 5/5`

ברירת המחדל למסלול המומלץ היא **בית הרב קוק**. 4 התחנות האחרות מגיעות מה‑DB ולא hardcoded.

---

## 1. Non-negotiable stack

- Next.js (React, App Router)
- TypeScript strict
- Tailwind CSS
- Vercel deployment
- Supabase Postgres
- Supabase Auth — Admin only in MVP
- Supabase Storage — station videos/images/captions
- Google Maps JavaScript API + walking routes
- Zod for request validation
- No Redux unless a real need appears
- RTL Hebrew by default

Do not replace Supabase or Vercel with another backend/platform.

---

## 2. Product principles

1. Mobile first. Design for one-handed outdoor usage.
2. The user should never wonder “what do I do now?”. One primary CTA per state.
3. Location permission must be requested only after an explanatory user gesture.
4. GPS arrival is a UX hint, not the final unlock. QR unlocks the station.
5. Never hard-block a real visitor because GPS is inaccurate.
6. No login for visitors. Anonymous session only.
7. Admin login is required for content management.
8. Do not store raw GPS history by default.
9. Preserve tour progress across refresh/navigation.
10. All public UI must be Hebrew RTL.

---

## 3. Design system

Use the uploaded campaign flyer as the visual direction.

```ts
export const colors = {
  navy: '#001B33',
  deepBlue: '#00325A',
  mint: '#00F0A8',
  white: '#F7FBFF',
  stone: '#D8B57A',
  muted: '#93A6B5',
}
```

Font: Heebo via `next/font/google`, with system fallback.

UI:
- dark background
- bright mint CTA
- rounded cards
- subtle borders/glows
- map overlays as bottom sheets
- min button height 48px
- use `100dvh`, `env(safe-area-inset-*)`
- support `prefers-reduced-motion`

---

## 4. Route structure

Implement these routes:

```text
/                         landing
/start                    location + start choice
/tour                     all 5 stations + progress map
/navigate/[stationSlug]   live walking navigation
/scan                     in-app QR scanner
/q/[token]                QR deep link validation
/station/[slug]           unlocked station + video
/complete                 5/5 finish
/admin/login              admin auth
/admin/stations           admin list/reorder
/admin/stations/[id]      admin editor
/admin/analytics          basic funnel
```

Use route groups if useful, but keep URLs exactly understandable.

---

## 5. Suggested directory structure

```text
app/
  (public)/
    page.tsx
    start/page.tsx
    tour/page.tsx
    navigate/[stationSlug]/page.tsx
    station/[slug]/page.tsx
    complete/page.tsx
  scan/page.tsx
  q/[token]/route.ts
  admin/
    login/page.tsx
    stations/page.tsx
    stations/[id]/page.tsx
    analytics/page.tsx
  api/
    session/start/route.ts
    session/progress/route.ts
    qr/validate/route.ts
    stations/[slug]/video/route.ts
    events/route.ts
components/
  brand/
  map/
  navigation/
  station/
  video/
  admin/
  ui/
lib/
  supabase/
    browser.ts
    server.ts
    admin.ts
  google-maps/
    loader.ts
    routes.ts
  geo/
    haversine.ts
    route-distance.ts
  session/
    cookie.ts
    progress.ts
  analytics/
    track.ts
  validation/
    schemas.ts
types/
```

---

## 6. Data rules

Use `SUPABASE_SCHEMA.sql` as the DB source of truth.

### Stations

Never hardcode the 5 stations in components. Query published stations ordered by `order_index`.

`is_default_start=true` should identify בית הרב קוק.

### Visitor session

Use a random opaque session key stored in a secure HttpOnly cookie. Store only a hash in DB.

Server utility should expose:

```ts
getOrCreateTourSession()
getSessionProgress()
markArrived(stationId)
unlockByQr(stationId)
markVideoStarted(stationId)
markStationCompleted(stationId)
getNextStation(stationId)
```

### Next station logic

For published stations ordered by `order_index`:
- start at selected station
- continue forward
- wrap around
- skip completed stations
- end when all are completed

---

## 7. Location flow

Do not prompt geolocation on initial page load.

Implement:

```ts
requestCurrentPosition()
watchUserPosition()
stopWatchingPosition()
```

Recommended browser options:

```ts
{
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 5000,
}
```

For the nearest station:
1. fetch 5 station coordinates
2. compute Haversine on client
3. select minimum distance
4. calculate a real walking ETA only for nearest + default start when needed

If permission denied:
- do not show an error dead-end
- show recommended start at בית הרב קוק
- allow manual station selection

Never persist raw user coordinates to analytics.

---

## 8. Google Maps navigation

### Map loading

Load Maps JavaScript only on screens that need it.

Use a restricted browser key:

`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`

### Walking route

Use the current Google Maps Routes Library / walking mode.

Create a typed adapter so Google-specific code stays in `lib/google-maps`.

Required normalized route type:

```ts
export type WalkingRoute = {
  distanceMeters: number
  durationSeconds: number
  polyline: Array<{ lat: number; lng: number }>
  steps: Array<{
    instruction: string
    distanceMeters: number
    start: { lat: number; lng: number }
    end: { lat: number; lng: number }
  }>
}
```

### Live navigator UI

Implement:
- route polyline
- user arrow marker
- heading rotation if available
- current instruction
- distance to next step
- remaining distance + ETA
- recenter button
- north/heading toggle
- arrival sheet

### Rerouting

Do not reroute every GPS event.

Algorithm:
- measure distance from current point to active route polyline
- consider off-route when > 30m for multiple samples
- reroute with at least 20s cooldown
- do not reroute when close to destination

Keep thresholds in config, not scattered literals.

### Google Maps external fallback

Always show secondary button “פתח ב‑Google Maps”.

Build a Maps URL with:
- destination latitude/longitude
- `travelmode=walking`
- `dir_action=navigate`

Use `target="_blank"` / appropriate mobile behavior.

---

## 9. Device heading

Use heading from geolocation if provided while moving.

Optionally use DeviceOrientation for better compass behavior, but:
- request permission only after a user action on iOS
- gracefully fall back if unsupported
- never make navigation dependent on heading

If heading unavailable, show a normal location dot/arrow with no rotation.

---

## 10. Arrival behavior

Each station has `arrival_radius_m`.

When distance <= radius:
- mark `arrived` once
- show bottom sheet:
  - “הגעתם לתחנה”
  - “חפשו את קוד ה‑QR במקום”
  - button “סריקת QR”

Do NOT unlock the video from GPS arrival alone.

---

## 11. QR implementation

Support both:

1. OS camera scans printed QR and opens `/q/[token]`.
2. In-app scanner `/scan` validates without leaving the flow.

Generate tokens using cryptographically secure randomness. Store only SHA‑256 hash in `qr_codes.token_hash`.

`/q/[token]` must run server-side:
- validate token hash
- ensure `is_active`
- get station
- get/create visitor session
- mark station unlocked
- track event
- redirect to `/station/[slug]`

Rate-limit validation requests.

If QR invalid/revoked, show a branded error page with “נסו לסרוק שוב”.

---

## 12. Video

Use a private Supabase Storage bucket named `station-videos`.

Never expose the service role key.

Endpoint:

`GET /api/stations/[slug]/video`

Server checks:
- valid session
- station progress is `unlocked|watching|completed`

Then returns a short-lived signed URL.

Video player requirements:
- inline playback
- poster
- captions track if present
- track started / 25 / 50 / 90%
- when >= 90% set station completed
- also provide an accessible “סיימתי, ממשיכים” button if product owner chooses not to enforce 90%

Do not autoplay with sound.

---

## 13. Supabase security

Rules:
- service role only in server-only modules
- public clients can read published stations if RLS allows
- visitors should not directly mutate progress tables from the browser
- session mutations through Next.js server routes/actions
- admin writes require authenticated admin user

Create `server-only` imports where appropriate.

Never prefix secret keys with `NEXT_PUBLIC_`.

---

## 14. Admin

MVP admin features:

### Station editor
- name
- slug
- short/long description
- address
- lat/lng
- order index
- default start
- arrival radius
- published
- video
- poster
- captions

### QR
- generate
- revoke
- regenerate
- render printable SVG/PNG

### Reorder
Drag/drop station order and persist `order_index` transactionally.

### Analytics
Simple cards/table, no heavy BI:
- sessions started
- tours completed
- scans by station
- completion by station
- external Google Maps clicks

---

## 15. Analytics implementation

Use first-party Supabase table `analytics_events`.

Create a single helper:

```ts
trackEvent(name, { stationId?, metadata? })
```

Whitelist event names server-side.

Never include:
- exact GPS
- IP manually stored by app
- device fingerprint

---

## 16. PWA

Add:
- manifest
- icons
- theme/background colors
- standalone display
- service worker
- offline fallback route

Cache:
- app shell
- station metadata
- small static brand assets

Do not promise offline map/routing.

Consider Screen Wake Lock on `/navigate/*`, behind a user gesture and graceful feature detection.

---

## 17. Accessibility

Must pass manual keyboard/accessibility sanity checks.

Required:
- `lang="he" dir="rtl"`
- visible focus states
- minimum 48px touch target for primary map controls
- WCAG-friendly contrast
- captions for every video before production
- labels for icon-only controls
- reduced-motion support

---

## 18. Error/edge states

Implement explicit UI for:
- location denied
- location timeout
- maps failed to load
- route unavailable
- offline
- invalid QR
- revoked QR
- station not published
- video unavailable
- session recovery
- scanned already-completed station

No blank screens. Every error state has a recovery CTA.

---

## 19. Performance rules

- map code must be dynamically imported
- avoid loading Google Maps on landing
- lazy load video
- use `next/image`
- avoid giant client providers around entire app
- keep server components by default
- client components only where browser APIs/interactivity are needed

---

## 20. Environment variables

Use `.env.example`.

Required names:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
SESSION_HASH_SECRET=
QR_HASH_PEPPER=
```

Validate env at startup with a typed schema.

---

## 21. Build order for Cursor

Work in small, reviewable phases. Do not build the entire product in one giant change.

### Step 1 — Bootstrap
- create Next.js TS project if repo is empty
- Tailwind
- RTL layout
- env validation
- Supabase clients
- database types
- lint/typecheck scripts

### Step 2 — Brand shell
- landing
- responsive layout
- design tokens
- reusable CTA/card/progress components

### Step 3 — DB + station read
- run schema
- typed station queries
- seed 5 placeholders with בית הרב קוק as default

### Step 4 — Session
- secure anonymous cookie
- session start/read
- progress table integration

### Step 5 — Start flow
- location permission component
- nearest calculation
- recommended start
- manual map choice

### Step 6 — Map/tour
- 5 markers
- states
- progress

### Step 7 — Navigation
- walking route
- live GPS
- heading arrow
- instructions
- reroute
- arrival
- external Google Maps button

### Step 8 — QR
- token validation
- QR deep link
- in-app scanner
- unlock

### Step 9 — Video
- signed URL endpoint
- player
- progress
- next station

### Step 10 — Completion
- 5/5 screen
- share

### Step 11 — Admin
- auth
- CRUD
- media
- QR
- reorder
- analytics

### Step 12 — PWA + QA
- service worker
- offline
- accessibility
- mobile QA
- production checks

After every step run:

```bash
npm run lint
npm run typecheck
npm run build
```

If one of these scripts does not exist, add it.

---

## 22. Testing

Use unit tests for pure logic:
- Haversine
- next station wrap-around
- progress completion
- QR hash validation utility
- route off-course threshold utility

Use Playwright for critical flow with mocked browser APIs:
- start without location permission
- start with mocked location
- nearest station
- QR unlock
- next station
- complete 5/5

Manual device QA is required for GPS/heading/camera.

---

## 23. Definition of Done

A feature is not done unless:
- it works in RTL mobile layout
- loading state exists
- error state exists
- TypeScript has no errors
- secrets are server-only
- no raw GPS is persisted
- accessibility labels exist
- events are tracked where specified
- core flow works after refresh

---

## 24. Important product decisions — do not invent silently

If values are missing, place them in config/admin and document TODOs instead of inventing production data.

Still required from product owner:
- names/coordinates of stations 2–5
- final station order
- actual video assets
- final copy
- production domain
- per-station arrival radii from field testing

Do not invent landmark names or coordinates.

---

## 25. First implementation request to Cursor

When starting from an empty repo, execute Steps 1–5 first and stop after a working start-selection flow. Provide a short summary of changed files, env variables needed, migrations applied, and remaining TODOs before moving to navigation.

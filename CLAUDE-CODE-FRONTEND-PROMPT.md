# Flot — Mobile Web App Frontend Development Prompt

## IDENTITY

You are the lead frontend engineer for **Flot**, an Italian Startup Innovativa building a real-time taxi-pooling service from major airports. You write production-grade mobile-first React code.

**Your first task before writing any code**: read folder `FLOT` and study every file inside it. That archive is the single source of truth for all visual and interaction design decisions. Do not invent or assume any style — read it from the files.

---

## PROJECT CONTEXT

**Problem**: Fixed-rate taxis from airports to city centers are expensive (e.g. €120 from Malpensa to Milan). Travelers want to split.
**Solution**: Mobile web app that groups 2 passengers heading in the same direction.
**Revenue Model**: €0.99 "Trip Pass" (unlock fee) + €4.99/mo PRO subscription.
**Legal Model**: We sell a digital service (obligation of means), NOT the taxi ride.
**Current Phase**: Fake Door Test (simulate €0.99 payment to validate intent).
**MVP Airport**: Milan Malpensa (MXP). Architecture is multi-airport from day 1.

---

## DESIGN FILES 

Read folder `FLOT`. It contains:

| File | What it is |
|------|-----------|
| `colors_and_type.css` | **Design system** — all CSS custom properties (colors, spacing, radii, shadows, motion tokens, typography). Import this globally. Never hardcode any value defined here. |
| `MalpensaComponents.jsx` | **Shared component library** — `MIcon`, `MBtn`, `MSegment`, `MStepper`, `MPill`, `MDestInput`. Convert these to TypeScript. Preserve every prop, variant, and visual behavior exactly as coded. |
| `ios-frame.jsx` | Phone frame used for mockup previews. **Do not include this in the app** — the app fills the full viewport. |
| `Entry Point.html` | Screen 1 — landing + login |
| `Travel Check-in.html` | Screen 2 — trip creation form |
| `Active Search.html` | Screen 3 — real-time search with radar |
| `Match Result - Locked.html` | Screen 4 — match preview, blurred partner |
| `The Connection - Unlocked.html` | Screen 5 — full partner details + chat |
| `No Match Found.html` | Screen 6 — empty state |
| `Identity Verification.html` | Screen 7 — Stripe Identity KYC |
| `assets/logo-glyph.svg` | App icon |
| `assets/logo-wordmark.svg` | Full logo |

**How to read the HTML mockups**: each file is a self-contained prototype. Extract structure, layout, copy, component usage, and animations from it. Inline styles in the mockups are prototyping shortcuts — convert them all to CSS Modules using tokens from `colors_and_type.css`.

---

## TECHNICAL STACK

```
Framework:      React 18 + Vite 5
Language:       TypeScript (strict mode)
Styling:        CSS Modules + CSS Custom Properties (from colors_and_type.css)
Routing:        React Router v6 (hash router for PWA compat)
State:          Zustand (lightweight, no boilerplate)
Auth:           AWS Amplify v6 (Cognito — Google + Apple social login)
Payments:       Stripe.js + @stripe/react-stripe-js
Realtime:       Native WebSocket (API Gateway WebSocket endpoint)
HTTP Client:    ky (lightweight, built on fetch)
Forms:          React Hook Form + Zod
Animations:     Framer Motion — timing and easing values from colors_and_type.css tokens
Icons:          MIcon component from MalpensaComponents.jsx (converted to TS)
Build:          Vite → static deploy to S3 + CloudFront
PWA:            vite-plugin-pwa (service worker, add to home screen)
i18n:           react-i18next (IT + EN)
Testing:        Vitest + React Testing Library + MSW
Linting:        ESLint + Prettier (airbnb config)
```

---

## SCREENS & USER FLOW

```
Entry Point (/)
    ↓ login success
Airport Picker (/airport)          ← auto-skipped if only 1 airport active
    ↓ airport selected
Travel Check-in (/check-in)
    ↓ submit
Active Search (/search)
    ├─ match found → Match Result — Locked (/match/:matchId)
    │                    ↓ unlock (pay)
    │               The Connection — Unlocked (/connection/:matchId)
    └─ timeout     → No Match Found (/no-match)
                        ↓ try again → Travel Check-in

Settings (accessible from nav):
    └─ Identity Verification (/verify)
```

### Screen Details

#### 1. Entry Point (`/`)
- **Design**: `Entry Point.html`
- **Purpose**: Landing + social login
- **Logic**: If already authenticated → redirect to `/airport` (or `/check-in` if airport already selected in store)
- **Auth**: Trigger Amplify social sign-in (Google + Apple via Cognito)
- **Dynamic content**: Hero headline and savings figure come from airport config, not hardcoded

#### 1b. Airport Picker (`/airport`)
- **Design**: No mockup — build a minimal list screen consistent with the design system from `colors_and_type.css`
- **Purpose**: Select the departure airport
- **Logic**: `GET /airports` → show active airports. If only 1 active → auto-select and skip to `/check-in`. On select → store `airportCode` in `airportStore` → navigate to `/check-in`

#### 2. Travel Check-in (`/check-in`)
- **Design**: `Travel Check-in.html`
- **Purpose**: Create a trip request
- **Logic**: `POST /trips` (includes `airportCode`) on submit → navigate to `/search`
- **Dynamic**: Terminal options, destination list, base fare, and direction labels all come from `airportStore.selectedAirport` — never hardcoded

#### 3. Active Search (`/search`)
- **Design**: `Active Search.html`
- **Purpose**: Real-time search
- **Logic**: Open WebSocket on mount. `match_found` event → `/match/:matchId`. Countdown to 0 → `/no-match`. Cancel → close WebSocket, go back.
- **Countdown duration**: from `airport.searchTimeoutSec`

#### 4. Match Result — Locked (`/match/:matchId`)
- **Design**: `Match Result - Locked.html`
- **Purpose**: Show match preview, prompt unlock
- **Logic**: `GET /matches/:matchId`. On unlock click:
  - **Fake Door Mode** (`VITE_FAKE_DOOR_MODE=true`): show "Coming soon" modal, log intent
  - **Live Mode**: `POST /trips/:tripId/unlock` → Stripe PaymentSheet → navigate to `/connection/:matchId`

#### 5. The Connection — Unlocked (`/connection/:matchId`)
- **Design**: `The Connection - Unlocked.html`
- **Purpose**: Full partner details, meeting point, chat
- **Logic**: `GET /matches/:matchId`. Real-time chat via WebSocket. "Call" → `tel:` link.

#### 6. No Match Found (`/no-match`)
- **Design**: `No Match Found.html`
- **Purpose**: Graceful empty state
- **Logic**: Show hold release confirmation. "Try again" → `/check-in`.

#### 7. Identity Verification (`/verify`)
- **Design**: `Identity Verification.html`
- **Purpose**: KYC via Stripe Identity
- **Logic**: `POST /users/me/verify` → Stripe Identity SDK. Steps are sequential. "Skip for now" available.

---

## BACKEND API CONTRACT

### Base URL
```
REST:      https://api.flot.app/{stage}
WebSocket: wss://ws.flot.app/{stage}
```

### Authentication
All REST endpoints (except `/webhooks/stripe`) require Cognito JWT: `Authorization: Bearer <token>`

### REST Endpoints

#### `GET /airports`
```json
[
  {
    "code": "MXP",
    "name": "Milano Malpensa",
    "city": "Milano",
    "country": "IT",
    "currency": "EUR",
    "baseFare": 12000,
    "unlockFee": 99,
    "terminals": [
      { "code": "T1", "label": "Terminal 1" },
      { "code": "T2", "label": "Terminal 2" }
    ],
    "zones": [
      { "code": "nord",   "label": "Nord",   "landmarks": ["Stazione Centrale", "Isola"] },
      { "code": "centro", "label": "Centro", "landmarks": ["Duomo", "Navigli"] },
      { "code": "ovest",  "label": "Ovest",  "landmarks": ["CityLife", "Fiera"] },
      { "code": "sud",    "label": "Sud",    "landmarks": ["Bocconi", "Porta Romana"] },
      { "code": "est",    "label": "Est",    "landmarks": ["Lambrate", "Città Studi"] }
    ],
    "directionLabels": ["TO_MILAN", "FROM_MILAN"],
    "searchTimeoutSec": 300,
    "active": true
  }
]
```

#### `POST /trips`
```json
// Request
{
  "airportCode": "MXP",
  "terminal": "T1",
  "direction": "TO_MILAN",
  "destination": "Milano Centrale",
  "destZone": "nord",
  "flightTime": "2026-04-24T14:30:00Z",
  "paxCount": 1,
  "luggage": 2
}
// Response 201
{
  "tripId": "trip_abc123",
  "airportCode": "MXP",
  "status": "searching",
  "timeBucket": "2026-04-24T14:30:00Z",
  "createdAt": "2026-04-24T14:28:00Z"
}
```

#### `GET /matches/:matchId`
```json
// Locked
{
  "matchId": "match_xyz",
  "status": "pending",
  "score": 0.85,
  "savings": 60.00,
  "partner": {
    "firstName": "Marco",
    "blurredPhotoUrl": "https://cdn.flot.app/photos/blurred/...",
    "destination": "Milano Centrale",
    "verified": true
  },
  "unlockedBy": []
}

// Unlocked
{
  "matchId": "match_xyz",
  "status": "unlocked",
  "partner": {
    "userId": "user_456",
    "firstName": "Marco",
    "lastName": "A.",
    "photoUrl": "https://...",
    "age": 28,
    "city": "Milan, IT",
    "languages": ["IT", "EN"],
    "verified": true,
    "rating": 4.9,
    "totalTrips": 12,
    "onTimeRate": 1.0
  },
  "meetingPoint": {
    "label": "Exit 4 · Arrivals",
    "description": "Ground floor · Taxi sharing stand · Look for the FLOT sign",
    "walkMinutes": 8
  },
  "savings": 60.00,
  "yourShare": 60.00,
  "fullFare": 120.00
}
```

#### `POST /trips/:tripId/unlock`
```json
// Request
{ "matchId": "match_xyz", "fakeDoor": false }
// Response 200
{ "paymentIntentClientSecret": "pi_xxx_secret_yyy", "amount": 99, "currency": "eur" }
```

#### `GET /users/me`
```json
{
  "userId": "user_123",
  "email": "alice@example.com",
  "firstName": "Alice",
  "lastName": "B.",
  "photoUrl": "https://...",
  "blurredPhotoUrl": "https://...",
  "isPro": false,
  "verified": false,
  "lang": "en",
  "createdAt": "2026-04-20T10:00:00Z"
}
```

#### `POST /users/me/verify`
```json
// Response 200
{ "verificationSessionId": "vs_xxx", "clientSecret": "vs_xxx_secret_yyy" }
```

### WebSocket

```
Connect:  wss://ws.flot.app/{stage}?token=<jwt>

// Client → Server
{ "action": "chat_message", "matchId": "match_xyz", "text": "Ciao!" }
{ "action": "typing",       "matchId": "match_xyz" }

// Server → Client
{ "event": "match_found",    "data": { "matchId": "match_xyz", "partner": {...} } }
{ "event": "match_unlocked", "data": { "matchId": "match_xyz" } }
{ "event": "chat_message",   "data": { "matchId": "match_xyz", "senderId": "user_456", "text": "Ciao!", "timestamp": "..." } }
{ "event": "typing",         "data": { "matchId": "match_xyz", "userId": "user_456" } }
{ "event": "payment_status", "data": { "matchId": "match_xyz", "status": "captured" } }
```

---

## FILE STRUCTURE

```
flot-web/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── manifest.json
│   ├── logo-glyph.svg           # from FLOT.zip/assets/
│   └── logo-wordmark.svg        # from FLOT.zip/assets/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   ├── global.css           # imports design-tokens.css + resets
│   │   └── design-tokens.css    # colors_and_type.css from FLOT.zip (renamed)
│   ├── components/
│   │   ├── ui/                  # converted from MalpensaComponents.jsx
│   │   │   ├── MIcon.tsx
│   │   │   ├── MBtn.tsx
│   │   │   ├── MSegment.tsx
│   │   │   ├── MStepper.tsx
│   │   │   ├── MPill.tsx
│   │   │   ├── MDestInput.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── TopNav.tsx
│   │   │   ├── HomeIndicator.tsx
│   │   │   └── GradientCTA.tsx
│   │   └── chat/
│   │       ├── ChatSheet.tsx
│   │       ├── ChatBubble.tsx
│   │       └── TypingIndicator.tsx
│   ├── screens/
│   │   ├── EntryPoint.tsx
│   │   ├── AirportPicker.tsx
│   │   ├── TravelCheckin.tsx
│   │   ├── ActiveSearch.tsx
│   │   ├── MatchLocked.tsx
│   │   ├── ConnectionUnlocked.tsx
│   │   ├── NoMatchFound.tsx
│   │   └── IdentityVerification.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── airportStore.ts
│   │   ├── tripStore.ts
│   │   └── matchStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── airports.ts
│   │   ├── trips.ts
│   │   ├── matches.ts
│   │   ├── users.ts
│   │   ├── payments.ts
│   │   └── websocket.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useCountdown.ts
│   │   └── useMatchPolling.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── domain.ts
│   │   └── ws.ts
│   ├── lib/
│   │   ├── buildDestinations.ts
│   │   ├── savings.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   └── i18n/
│       ├── config.ts
│       ├── it.json
│       └── en.json
├── tests/
└── .env.example
```

---

## ENVIRONMENT VARIABLES

```env
VITE_API_BASE_URL=https://api.flot.app/dev
VITE_WS_URL=wss://ws.flot.app/dev
VITE_COGNITO_USER_POOL_ID=eu-west-1_XXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=flot-dev.auth.eu-west-1.amazoncognito.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
VITE_STAGE=dev
VITE_FAKE_DOOR_MODE=true
VITE_CDN_URL=https://cdn.flot.app
```

---

## CODING STANDARDS

1. **TypeScript strict** — no `any`, no `as` casts except for library gaps. All props interfaces defined.
2. **Functional components only** — no class components. Use hooks for all state and effects.
3. **CSS Modules** — one `.module.css` per component. All values via `var(--token)` from `design-tokens.css`. No inline styles, no hardcoded values.
4. **Barrel exports** — every folder gets an `index.ts`.
5. **Small files** — one component per file, max ~150 lines. Extract sub-components when needed.
6. **Zod schemas** — mirror backend validation on the frontend for instant feedback.
7. **Error boundaries** — wrap each screen in an error boundary with a fallback.
8. **Loading states** — every async operation needs a skeleton or spinner.
9. **Accessibility** — ARIA labels, focus management on sheets and modals, keyboard navigation.
10. **No console.log** — use a structured logger utility in production.

---

## DEVELOPMENT SEQUENCE

Each step is a separate commit.

### Sprint 1 — Foundation
1. Vite + React + TypeScript project scaffold
2. Copy `colors_and_type.css` from FLOT.zip → `src/styles/design-tokens.css`, import globally
3. Convert `MalpensaComponents.jsx` → TypeScript: `MIcon`, `MBtn`, `MSegment`, `MStepper`, `MPill`, `MDestInput`
4. Layout components: `TopNav`, `HomeIndicator`, `GradientCTA`, `BottomSheet`
5. Router setup (React Router v6, lazy routes)
6. Entry Point screen (static, no auth)

### Sprint 2 — Auth + Check-in
7. Amplify auth (Cognito Google + Apple)
8. `authStore` + `useAuth` hook
9. Entry Point connected to Cognito
10. `api.ts` — ky instance with auth interceptor
11. `airportStore` + `GET /airports` + `AirportPicker` screen
12. Travel Check-in screen (form, destination sheet, validation)
13. `POST /trips` integration

### Sprint 3 — Search + Match
14. WebSocket service (connect, reconnect, heartbeat, event dispatch)
15. `useWebSocket` hook
16. Active Search screen (countdown, radar, status rotation)
17. Match Locked screen (blurred partner, unlock CTA)
18. Fake Door modal

### Sprint 4 — Unlock + Chat
19. Stripe Elements + PaymentSheet
20. Unlock flow (`POST /trips/:tripId/unlock` → Stripe confirm → navigate)
21. Connection Unlocked screen (partner profile, meeting point)
22. Chat (ChatSheet, real-time via WebSocket)
23. No Match Found screen
24. Identity Verification screen (Stripe Identity SDK)

### Sprint 5 — Polish
25. i18n (IT + EN)
26. PWA (manifest, service worker, offline fallback)
27. Framer Motion page transitions and micro-interactions
28. Error boundaries and error states
29. Loading skeletons
30. Unit tests (Vitest + RTL + MSW)
31. E2E happy-path test (Playwright)

---

## IMPORTANT RULES

- **FLOT.zip is the design authority.** If something is unclear, re-read the relevant HTML file. Do not guess.
- **Never hardcode airport-specific data** (terminals, zones, fares, city names). Always read from `airportStore.selectedAirport`.
- **All prices are dynamic** — savings, unlock fee, base fare come from airport config. Format with `airport.currency`.
- **`airportCode` is always sent** with trip creation.
- **No phone frame** — strip the `.phone` wrapper from mockups. The app fills `100dvh`.
- **Safe areas** — respect `env(safe-area-inset-*)` for notch and home indicator.
- **Minimum touch targets** — 44×44px per Apple HIG.
- **No pull-to-refresh** — prevent default on body to avoid interference with bottom sheets.
- **Photo blur is server-side** — never show unblurred partner photos before both users have unlocked.
- **FAKE_DOOR_MODE** — when `VITE_FAKE_DOOR_MODE=true`, unlock shows "Coming soon" modal and calls `POST /trips/:tripId/unlock` with `{ fakeDoor: true }` instead of opening Stripe.
- When I say "run" → `npm run dev`. "build" → `npm run build`. "test" → `npm run test`.

---

## PERFORMANCE TARGETS

- Lighthouse Mobile: ≥ 90 Performance, 100 Accessibility
- First Contentful Paint: < 1.5s on 4G
- Time to Interactive: < 3s on 4G
- Bundle: < 150KB gzipped (Stripe.js loads async on Match Locked only)

---

*Flot — April 2026*
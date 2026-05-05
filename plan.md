# Plan: FLOT Frontend — Fix + Complete Screens

## Context
- 8 screens exist, 3 missing (ConnectionUnlocked, IdentityVerification, Profile)
- ~30 issues found in audit across existing screens
- Backend is live (real APIs)
- Goal: npm run build senza errori

---

## Phase 1 — Critical Fixes (P0, do first)

### 1a. Bug fixes — no behavior change
- Remove 4 `console.error` calls: TripScheduled.tsx (L28, L45), MyTrips.tsx (L13, L24)
- Add `AirportPicker` export to `src/screens/index.ts`
- Fix ESLint disabled rules: fix dep arrays in AirportPicker.tsx L24, ActiveSearch.tsx L63, MatchLocked.tsx L67

### 1b. Data integrity fixes
- **TripScheduled.tsx**: Replace hardcoded "~€60", "1 Passeggero", "1 Bagaglio" with real values from `tripStore.currentTrip` (luggage, paxCount) and calculated savings from `airport.baseFare`
- **MyTrips.tsx**: Replace `trips.filter(...).length * 60` with sum of actual `trip.savings` from API response
- **EntryPoint.tsx**: Replace hardcoded `const STATS_AIRPORT = 'MXP'` with `airportStore.selectedAirport?.code ?? 'MXP'`
- **EntryPoint.tsx**: Replace `baseFare ?? 12000` magic number with `import { DEFAULT_BASE_FARE } from 'lib/constants'` (add constant)

### 1c. Flow correctness
- **MatchLocked.tsx**: Navigate to `/connection/:matchId` ONLY after `UnlockResponse` is received (PaymentIntent created), not optimistically. Show Stripe PaymentSheet before navigating.
- **MatchLocked.tsx**: Fix `as LockedMatch` cast — guard with `if (match.status !== 'pending')` and handle `unlocked` status (redirect to connection screen immediately)

### 1d. CSS hardcoded values (replace with CSS vars)
- `EntryPoint.module.css` L79: `#92400E` → `var(--amber-900)`
- `EntryPoint.module.css` L96, L151: `#15803D` → `var(--success-700)`
- `ActiveSearch.module.css` L109: rgba values → `var(--amber-soft)` + transparent
- `ActiveSearch.module.css` L126: amber shades → `var(--amber)` with opacity
- `ActiveSearch.module.css` L185-186: blue values → `var(--info-soft)`, `var(--info)`
- `MatchLocked.module.css` L185: `#F8FAFC` → `var(--surface-2)`
- `TripScheduled.module.css` L80: `#fff` → `var(--ink-inverted)`
- `TripScheduled.module.css` L101: `#3B82F6` → `var(--info)` (confetti dot)

### 1e. Error & loading states
- **ActiveSearch.tsx**: Add WebSocket error handler → show error state + "Riprova" button if WS fails
- **MatchLocked.tsx**: Add timeout (10s) for `fetchMatch` → show error state

---

## Phase 2 — Missing Screens (build in order: Connection → Profile → IdentityVerification)

### 2a. ConnectionUnlocked (`/connection/:matchId`)
- File: `src/screens/ConnectionUnlocked/ConnectionUnlocked.tsx` + CSS + index.ts
- Design ref: `FLOT/The Connection - Unlocked.html`
- Data: `GET /matches/:matchId` (status = 'unlocked') → `UnlockedMatch` type
- Features:
  - TopNav with back button + match ID badge
  - Partner card: real photo (not blurred), name, age, city, languages, verified badge, rating
  - Meeting point card: label, description, walkMinutes countdown
  - Savings summary: yourShare, fullFare, savings
  - Chat section: WebSocket `chat_message` + `typing` events, message input
  - "Call" button: `tel:` link (phone only shown if partner shares)
- Store: `matchStore.currentMatch`
- Register in `App.tsx` route `/connection/:matchId`
- Export from `src/screens/index.ts`

### 2b. Profile (`/profile`)
- File: `src/screens/Profile/Profile.tsx` + CSS + index.ts
- Design ref: `FLOT/Profile.html`
- Data: `GET /users/me` → `User` type
- Features:
  - ProfileCard: avatar initials, name, email, verified badge, stats (trips, saved, onTime)
  - NotificationsSection: 3 toggles with local state + persist to `notificationStore`
  - AccountSection: rows → IdentityVerification, payment method (placeholder), language, privacy
  - SupportSection: rows → help center (external link), terms (external link)
  - LogoutRow: `authStore.reset()` + navigate `/`
  - Version string
  - TabBar + HomeIndicator
- Row component (inline, ~10 lines): icon + label + sub + right + onClick + danger
- Toggle component (inline, ~15 lines): 46×28px controlled toggle
- Register in `App.tsx` route `/profile`

### 2c. IdentityVerification (`/verify`)
- File: `src/screens/IdentityVerification/IdentityVerification.tsx` + CSS + index.ts
- Design ref: `FLOT/Identity Verification.html`
- Data: `POST /users/me/verify` → `VerifyResponse` → Stripe Identity SDK
- Features:
  - TopNav with back button, "Verifica identità" title
  - Explanation card: what verification is, why needed
  - Benefits list (privacy, verification badge)
  - CTA: "Start verification" → POST /users/me/verify → load Stripe Identity SDK with clientSecret
  - "Skip for now" → navigate(-1)
  - After success: show success state + navigate back to profile
- Register in `App.tsx` route `/verify`

---

## Phase 3 — Build Verification

1. Fix `tsconfig.app.json` — add missing type packages if needed (npm install @types/google.maps if missing from node_modules)
2. Run `npm run build` → fix any remaining TS errors
3. Verify all routes navigate correctly end-to-end
4. Check TabBar visibility rules in App.tsx match spec: visible on /check-in, /my-trips, /profile, /trip/:tripId; hidden on /, /search, /match/*, /connection/*, /no-match, /verify

---

## Files to Modify
- `src/screens/EntryPoint.tsx` — fix STATS_AIRPORT, baseFare magic number
- `src/screens/EntryPoint.module.css` — replace hardcoded colors
- `src/screens/TravelCheckin.tsx` — minor: double-submit guard
- `src/screens/ActiveSearch.tsx` — WS error handler, fix dep array
- `src/screens/ActiveSearch.module.css` — replace hardcoded colors
- `src/screens/MatchLocked.tsx` — fix payment flow, fix type cast, add timeout
- `src/screens/MatchLocked.module.css` — replace hardcoded color
- `src/screens/TripScheduled.tsx` — remove console.error, fix hardcoded values
- `src/screens/TripScheduled.module.css` — replace hardcoded colors
- `src/screens/MyTrips.tsx` — remove console.error, fix savings calculation
- `src/screens/index.ts` — add AirportPicker export
- `src/lib/constants.ts` — add DEFAULT_BASE_FARE
- `src/App.tsx` — add Connection/Profile/Verify routes wrapped in ProtectedRoute (same pattern as existing protected screens), update TabBar conditions to include /profile

## Files to Create
- `src/screens/ConnectionUnlocked/ConnectionUnlocked.tsx`
- `src/screens/ConnectionUnlocked/ConnectionUnlocked.module.css`
- `src/screens/ConnectionUnlocked/index.ts`
- `src/screens/Profile/Profile.tsx`
- `src/screens/Profile/Profile.module.css`
- `src/screens/Profile/index.ts`
- `src/screens/IdentityVerification/IdentityVerification.tsx`
- `src/screens/IdentityVerification/IdentityVerification.module.css`
- `src/screens/IdentityVerification/index.ts`

---

## Verification
1. `npm run build` — zero warnings/errors
2. All 11 routes navigate correctly (no broken links)
3. TabBar visible/hidden on correct routes
4. `GET /matches/:matchId` (unlocked) renders ConnectionUnlocked with real partner data
5. Profile loads from `GET /users/me`, logout works
6. IdentityVerification calls `POST /users/me/verify` and loads Stripe Identity


---

## Decisions (confirmed)
- Chat WebSocket in ConnectionUnlocked: WS connect + send + receive real-time + scrollable list. No history pagination, typing indicators, retry logic (post-MVP).
- Profile → "Metodo di pagamento" e "Privacy e sicurezza": row con chevron, placeholder, nessuna navigazione, nessun crash.
- Tutte le nuove route (/connection/:matchId, /profile, /verify) DEVONO essere wrapped in ProtectedRoute — crash garantito se utente non loggato naviga direttamente (authStore.user = null).

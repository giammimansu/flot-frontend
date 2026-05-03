# Flot — Mobile Web App Frontend Development Prompt (v3 — Scheduled-First MVP)

## IDENTITY

You are the lead frontend engineer for **Flot**, an Italian Startup Innovativa building a taxi-pooling service from major airports. You write production-grade mobile-first React code.

**Your first task before writing any code**: read folder `FLOT` and study every file inside it. That archive is the single source of truth for all visual and interaction design decisions. Do not invent or assume any style — read it from the files.

---

## PROJECT CONTEXT

**Problem**: Fixed-rate taxis from airports to city centers are expensive (e.g. €120 from Malpensa to Milan). Travelers want to split.
**Solution**: Mobile web app that groups 2 passengers heading in the same direction.
**Revenue Model**: €0.99 "Trip Pass" (unlock fee) + €4.99/mo PRO subscription.
**Legal Model**: We sell a digital service (obligation of means), NOT the taxi ride.
**Current Phase**: MVP — Scheduled-First mode con Fake Door Test.
**MVP Airport**: Milan Malpensa (MXP). Architecture is multi-airport from day 1.

---

## v3 CHANGELOG — SCHEDULED-FIRST PIVOT

### Perché il cambiamento

Con bassa densità di utenti all'MVP, la probabilità che due persone siano in aeroporto nello stesso momento è quasi nulla. La modalità **Scheduled** permette agli utenti di prenotare il ride-share in anticipo (anche giorni prima): il sistema accumula domanda e ha enormemente più probabilità di trovare un match.

### Cosa cambia nella UI rispetto alla v2

| Area | v2 (AS-IS) | v3 (TO-BE) |
|------|------------|------------|
| **Entry Point** | "You've landed" — tutto presente | "Plan your shared ride" — orientato al futuro |
| **How it works** | "We match right now" | Step 1: "Add your flight", Step 2: "We search for you", Step 3: "Meet & split" |
| **Travel Check-in** | 4 campi, NO orario | **5 campi: terminal, direction, destination, flight datetime, luggage** |
| **Campo flightTime** | Rimosso in v2 | **Re-introdotto**: date+time picker obbligatorio |
| **Mode toggle** | Non presente | **MSegment** "Schedule" / "I'm here now" (default: Schedule) |
| **Post-submit** | → Active Search (countdown radar 5 min) | → **Trip Scheduled** confirmation screen |
| **Active Search** | Unico flusso post-submit | Solo per Live mode (opzione secondaria) |
| **Nuovo screen** | — | **My Trips** — lista trip schedulati/attivi/passati |
| **Nuovo screen** | — | **Trip Scheduled** — conferma + notifica setup |
| **Notifiche** | Solo WebSocket in-app | **Push permission request** + email fallback |
| **Match found** | Solo se utente ha app aperta | **Push notification** anche con app chiusa |
| **Bottom nav** | Non presente | **Tab bar**: Home / My Trips / Profile |
| **Savings counter** | "this month" | "since launch" (numeri più credibili per MVP) |

### Cosa NON cambia
- Stack tecnico (React 18, Vite, TypeScript, CSS Modules)
- Design system (colors_and_type.css)
- Componenti UI (MBtn, MSegment, MStepper, MPill, MIcon, MDestInput)
- Auth flow (Cognito Google + Apple)
- Match Locked / Connection Unlocked / Chat — invariati
- Payment flow (Stripe / Fake Door)
- Coding standards

---

## DESIGN FILES

Read folder `FLOT`. It contains:

| File | What it is |
|------|-----------|
| `colors_and_type.css` | **Design system** — all CSS custom properties. Import globally. Never hardcode. |
| `MalpensaComponents.jsx` | **Shared component library** — convert to TypeScript. |
| `ios-frame.jsx` | Phone frame for mockups. **Do not include in app.** |
| `Entry Point.html` | Screen 1 — landing + login — **DA AGGIORNARE v3** |
| `Travel Check-in.html` | Screen 2 — trip form — **DA AGGIORNARE v3** |
| `Active Search.html` | Screen 3 — real-time search — **Solo per Live mode** |
| `Match Result - Locked.html` | Screen 4 — match preview |
| `The Connection - Unlocked.html` | Screen 5 — partner details + chat |
| `No Match Found.html` | Screen 6 — empty state |
| `Identity Verification.html` | Screen 7 — Stripe Identity KYC |
| `assets/logo-glyph.svg` | App icon |
| `assets/logo-wordmark.svg` | Full logo |

**Nota v3**: I file HTML dei mockup v2 restano come reference per stile e componenti, ma il copy e il flusso di alcune schermate cambiano come descritto in questo documento. Quando c'è conflitto tra il mockup HTML e questo prompt, **questo prompt ha priorità**.

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
Animations:     Framer Motion
Icons:          MIcon component from MalpensaComponents.jsx (converted to TS)
Build:          Vite → static deploy to S3 + CloudFront
PWA:            vite-plugin-pwa (service worker, add to home screen, push notifications)
i18n:           react-i18next (IT + EN)
Notifications:  Web Push API + Firebase Cloud Messaging (FCM)    ← NUOVO v3
Testing:        Vitest + React Testing Library + MSW
Linting:        ESLint + Prettier (airbnb config)
```

---

## SCREENS & USER FLOW — v3

```
Entry Point (/)
    ↓ login success
Airport Picker (/airport)              ← auto-skipped if only 1 airport active
    ↓ airport selected
Travel Check-in (/check-in)
    ├─ mode = "schedule" (DEFAULT)
    │   ↓ submit
    │   Trip Scheduled (/trip/:tripId)  ← NUOVO v3
    │       ↓ match trovato (notifica push/email)
    │       Match Result — Locked (/match/:matchId)
    │           ↓ unlock (pay)
    │           The Connection — Unlocked (/connection/:matchId)
    │
    └─ mode = "live"
        ↓ submit
        Active Search (/search)
            ├─ match found → Match Result — Locked (/match/:matchId)
            │                    ↓ unlock (pay)
            │               The Connection — Unlocked (/connection/:matchId)
            └─ timeout     → No Match Found (/no-match)

My Trips (/my-trips)                   ← NUOVO v3 — accessibile da tab bar
    └─ tap su trip → Trip detail / Match detail

Settings (accessible from profile tab):
    └─ Identity Verification (/verify)
    └─ Notification preferences
```

### Screen Details

---

### Screen 1 — Entry Point (`/`) `[v3 UPDATE]`

**Obiettivo schermata**: comunicare il valore di FLOT in modo orientato al futuro. L'utente deve capire che può **pianificare in anticipo** il suo ride-share.

**Struttura**:
1. **Top Nav**: logo FLOT sinistra, bottone help destra
2. **Hero section** (padding 22px 20px 0):
   - Kicker pill: dot amber + "Malpensa · Milano" su sfondo amber-soft
   - H1 (Bricolage 27–32px/800): **"Plan your shared ride from the airport."**
     - ❌ Non usare: "Find someone to share your taxi" (implica immediatezza che non serve)
     - ❌ Non usare: "You've landed" (l'utente probabilmente NON è ancora in aeroporto)
     - ✅ Il nuovo headline orienta l'utente verso la pianificazione anticipata
   - Subtitle (Inter 13–15px/relaxed/ink-muted): **"Add your flight, we'll find a traveler heading your way. You share a standard taxi together — we don't drive you."**

3. **Live Savings Counter** `[AGGIORNATO v3]`:
   - Struttura visuale invariata (card surface-1, icona sparkles, numero animato)
   - **Testo aggiornato**:
     ```
     Label: "TRAVELERS HAVE SAVED"
     Numero: "€12,847"
     Sub: "since launch at Malpensa"              ← CAMBIATO da "this month"
     ```
   - ⚠️ Usare il cumulativo "since launch" per mostrare numeri credibili nella fase MVP a bassa densità
   - API: `GET /airports/MXP/stats → { totalSavingsLaunch: 1284700 }`

4. **Blocco "How it works"** `[AGGIORNATO v3]`:
   - 3 step verticali aggiornati per riflettere il flusso Scheduled:
     ```
     Step 1 [icona plane-arrival, cerchio amber-soft]
       "Add your flight details"
       sub: "Terminal, destination, arrival time"

     Step 2 [icona search, cerchio amber-soft]
       "We search for your ride partner"
       sub: "We'll notify you as soon as we find a match"

     Step 3 [icona map-pin, cerchio success-soft]
       "Meet at the airport & split the fare"
       sub: "Pay the driver together. We don't touch the fare."
     ```
   - ⚠️ Step 2 enfatizza la notifica asincrona, non il matching "right now"

5. **Guarantee banner**: invariato
   - "No match? No charge. Ever."

6. **Bottoni Auth**: invariati (Google + Apple)

7. **Terms + Sign in**

8. **Home Indicator**

---

### Screen 2 — Travel Check-in (`/check-in`) `[v3 UPDATE — MAJOR]`

**Razionale v3**: Il campo flight time è **re-introdotto** come campo primario. L'utente prenota in anticipo specificando quando atterrerà. La modalità Live resta disponibile come opzione secondaria via toggle.

**Struttura** (scrollabile):
1. **Top Nav**: chevron-left, "FLOT" centrato, avatar utente
2. **Hero copy** `[AGGIORNATO v3]`:
   - H2 (Bricolage 24px/700): **"When are you landing?"**
   - Subtitle (Inter 14px/ink-muted): **"Add your trip details — we'll start looking for your ride partner right away."**
   - ⚠️ Il copy riflette la modalità Scheduled: l'utente sta pianificando, non è già lì

3. **Mode toggle** `[NUOVO v3]` — primo elemento del form:
   ```
   MSegment con 2 opzioni:
   - "📅 Schedule" (DEFAULT, pre-selezionato)
   - "📍 I'm here now"
   
   Sotto il toggle (12px/ink-muted):
   - Se Schedule: "We'll notify you when we find a match"
   - Se Live: "We'll search for 5 minutes while you wait"
   ```
   - Il toggle condiziona la visibilità del campo flightTime e il flusso post-submit

4. **Form sezioni** (gap 20–24px) — **5 campi**:

   **4a. Flight arrival date & time** `[NUOVO v3]` — visibile SOLO in mode Schedule:
   ```
   Label: "When do you land?" (Inter 14px/500)
   Input: Date + Time picker nativo del browser
     - type="datetime-local"
     - min: now (non si può prenotare nel passato)
     - max: now + 7 giorni (airport.scheduled_advance_days)
     - step: 900 (15 min granularity)
   Sub: "Your flight arrival time" (12px/ink-muted)
   Obbligatorio in mode Schedule
   ```
   - In mode Live questo campo è nascosto; `flightTime` viene impostato a `new Date().toISOString()` automaticamente

   **4b. Terminal** — label + MSegment
   ```
   Label: "Your terminal" (Inter 14px/500)
   Options: ["Terminal 1", "Terminal 2"]
   Pre-selezionato: T1
   ```

   **4c. Direction** — label + MSegment
   ```
   Label: "Direction" (Inter 14px/500)
   Options: ["→ To Milan", "← To Airport"]
   Default: "To Milan"
   Sub: "Where are you headed after landing?"     ← AGGIORNATO v3
   ```

   **4d. Destination** — MDestInput che apre DestSheet
   ```
   Label: "Where are you going?" (Inter 14px/500)
   Placeholder: "Search destination…"
   Obbligatorio — CTA disabilitato finché non selezionato
   ```
   - Usa Google Places Autocomplete (come v2 + GPS upgrade)
   - Salva `destination`, `destLat`, `destLng`, `destPlaceId`

   **4e. Luggage** — label + MStepper (min 0, max 6)
   ```
   Label: "Bags" (Inter 14px/500)
   Sub: "Helps your partner know what to expect" (12px/ink-muted)
   Default: 1
   ```

5. **CTA Button** (GradientCTA sticky bottom) `[AGGIORNATO v3]`:
   ```
   Mode Schedule: "Schedule my ride share" + icona calendar
   Mode Live: "Find my partner now" + icona search
   ```
   - Disabilitato finché destination non è selezionato
   - In mode Schedule, disabilitato anche se flightTime non è compilato

6. **Info box sotto CTA** (12px/ink-muted, centrato):
   ```
   Mode Schedule: "Free to schedule · €0.99 only if matched"
   Mode Live: "Free to search · €0.99 only if matched"
   ```

**Submit logic**:
```typescript
const onSubmit = async (data: TripFormData) => {
  const flightTime = mode === 'schedule' 
    ? data.flightTime                          // ISO dall'input
    : new Date().toISOString();                // "now" per live

  const trip = await api.post('/trips', {
    airportCode: selectedAirport.code,
    terminal: data.terminal,
    direction: data.direction,
    destination: data.destination,
    destLat: data.destLat,
    destLng: data.destLng,
    destPlaceId: data.destPlaceId,
    flightTime,
    luggage: data.luggage,
    paxCount: 1,
  });

  if (trip.mode === 'scheduled') {
    navigate(`/trip/${trip.tripId}`);           // → Trip Scheduled screen
  } else {
    navigate('/search');                        // → Active Search (live)
  }
};
```

---

### Screen 2b — Trip Scheduled (`/trip/:tripId`) `[NUOVO v3]`

**Obiettivo**: confermare la prenotazione, spingere l'attivazione delle notifiche push, dare fiducia che il sistema sta lavorando.

**Struttura**:
1. **Top Nav**: chevron-left, "FLOT" centrato

2. **Success animation** (Framer Motion):
   - Cerchio success-soft 80px con icona check animata (scale from 0 → 1, bounce)
   - H2 (Bricolage 22px/700): **"Trip scheduled!"**
   - Sub (Inter 14px/ink-muted): **"We'll notify you as soon as we find a ride partner."**

3. **Trip summary card** (surface-1, bordo hairline, border-radius 20px, padding 16-20px):
   ```
   ── Header ──
   MPill amber "Scheduled"

   ── Details ──
   Row: 🛫 "Terminal 1 → Milano, Duomo area"
   Row: 📅 "Sat, Apr 26 · 14:30"                ← flightTime formattato
   Row: 🧳 "2 bags"

   ── Status ──
   Icona search animata (pulse) + "Searching for your partner…"
   Barra progress indeterminate (amber, 2px, animata)
   ```

4. **Push notification prompt** `[CRITICO v3]`:
   ```
   Card surface-2, bordo amber, border-radius 16px, padding 16px
   
   Icona bell su cerchio amber-soft
   H3: "Don't miss your match!"
   Sub: "Enable notifications so we can reach you instantly."
   
   MBtn primary amber: "Enable notifications"
     → onClick: requestPushPermission() → registra token via PUT /users/me/push-token
   
   Link sotto: "I'll check back manually" (Inter 12px/ink-subtle, underline)
   ```
   - Se le notifiche sono già abilitate, mostrare un check verde "Notifications enabled" invece del prompt
   - Se il browser non supporta push, mostrare: "We'll send you an email when we find a match"

5. **Actions**:
   ```
   MBtn secondary: "View my trips" → navigate('/my-trips')
   MBtn ghost: "Schedule another trip" → navigate('/check-in')
   Link: "Cancel this trip" → conferma dialog → DELETE /trips/:tripId → navigate('/my-trips')
   ```

6. **Bottom Tab Bar**

**Polling / Real-time update**:
- Se l'utente resta su questa schermata, il WebSocket ascolta `match_found` per questo tripId
- Se arriva un match → animazione celebrativa → auto-navigate a `/match/:matchId` dopo 2s

---

### Screen 3 — Active Search (`/search`) — Solo Live mode

**Invariato da v2**. Questa schermata appare SOLO quando l'utente ha scelto "I'm here now" nel check-in.

- Radar animation, countdown da `airport.searchTimeoutSec`
- WebSocket: `match_found` → `/match/:matchId`
- Timeout → `/no-match`
- Cancel → close WebSocket, go back

---

### Screen 3b — My Trips (`/my-trips`) `[NUOVO v3]`

**Obiettivo**: dashboard dei trip dell'utente. Punto di ritorno principale nell'app per chi ha trip schedulati.

**Struttura**:
1. **Top Nav**: "My Trips" (Bricolage 20px/700), avatar destra

2. **Tab filter** (MSegment orizzontale):
   ```
   "Active" (default) | "Past"
   ```

3. **Trip list** (gap 12px):
   Ogni trip è una card (surface-1, bordo hairline, border-radius 16px, padding 14-16px):
   ```
   ── Header row ──
   MPill con stato:
     - "Scheduled" (amber)     → in attesa di match
     - "Matched!" (success)    → match trovato, da sbloccare
     - "Unlocked" (brand)      → sbloccato, chat attiva
     - "Completed" (ink-muted) → viaggio completato
     - "Expired" (ink-subtle)  → nessun match trovato
     - "Cancelled" (ink-subtle)

   ── Body ──
   Row: destinazione + direzione
   Row: data/ora arrivo
   Row: terminal + bags

   ── Footer row (condizionale) ──
   Se "Matched!":  MBtn primary "View match →"        → /match/:matchId
   Se "Scheduled":  MBtn ghost "Cancel trip"           → confirm dialog
   Se "Unlocked":  MBtn primary "Open chat →"          → /connection/:matchId
   ```

4. **Empty state** (se nessun trip):
   ```
   Icona airplane su cerchio surface-2, 64px
   H3: "No trips yet"
   Sub: "Schedule your first shared ride"
   MBtn primary: "Schedule a trip" → /check-in
   ```

5. **FAB** (Floating Action Button, bottom-right, sopra tab bar):
   ```
   Cerchio 56px, background amber, icona plus bianca
   onClick → navigate('/check-in')
   Shadow: var(--shadow-md)
   ```

6. **Bottom Tab Bar**

**Data**: `GET /trips/my` → lista trip ordinati per `createdAt` desc

---

### Screen 4 — Match Result — Locked (`/match/:matchId`)
**Invariato da v2.** Si arriva qui:
- Da push notification (Scheduled mode) — deep link
- Da Active Search (Live mode)
- Da My Trips tappando "View match"

---

### Screen 5 — The Connection — Unlocked (`/connection/:matchId`)
**Invariato da v2.**

---

### Screen 6 — No Match Found (`/no-match`)
**Invariato da v2** — usato solo per Live mode timeout.

Per Scheduled mode, il trip scade silenziosamente e lo stato in My Trips diventa "Expired". L'utente riceve una notifica push/email:
> "We couldn't find a match for your trip to [destination] on [date]. Schedule a new one?"

---

### Screen 7 — Identity Verification (`/verify`)
**Invariato da v2.**

---

## BOTTOM TAB BAR `[NUOVO v3]`

```
Struttura (3 tab):
  Home (icona home)        → / (Entry Point, se non loggato) o /check-in (se loggato)
  My Trips (icona list)    → /my-trips
  Profile (icona user)     → /profile

Stile:
  - Sticky bottom, altezza 56px + safe-area-inset-bottom
  - Background: var(--surface-1)
  - Border top: 1px solid var(--hairline)
  - Icone: 24px, inactive = var(--ink-subtle), active = var(--amber)
  - Label sotto icona: 10px / 500
  - Active tab: icona + label in var(--amber), dot indicator sopra l'icona

Visibilità:
  - Mostrata su: /check-in, /my-trips, /profile, /trip/:tripId
  - Nascosta su: / (entry point pre-login), /search, /match/*, /connection/*
```

---

## PUSH NOTIFICATIONS — v3

### Implementazione

```typescript
// src/services/pushNotifications.ts

import { getToken, onMessage } from 'firebase/messaging';

export async function requestPushPermission(): Promise<string | null> {
  // 1. Chiedi permesso browser
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // 2. Ottieni FCM token
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
  });

  // 3. Registra token sul backend
  await api.put('/users/me/push-token', {
    token,
    platform: 'fcm',
  });

  return token;
}

// In-app message handler (app in foreground)
export function setupForegroundNotifications() {
  onMessage(messaging, (payload) => {
    const { title, body, data } = payload.notification!;
    
    // Mostra toast in-app
    showToast({ title, body });
    
    // Se è un match_found, naviga
    if (data?.action === 'open_match') {
      navigate(`/match/${data.matchId}`);
    }
  });
}
```

### Service Worker (PWA)

```typescript
// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.x/firebase-messaging-compat.js');

firebase.initializeApp({ /* config */ });
const messaging = firebase.messaging();

// Background message handler (app chiusa o in background)
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo-glyph.svg',
    badge: '/logo-glyph.svg',
    data: payload.data,
    actions: [
      { action: 'open', title: 'View match' },
    ],
  });
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const matchId = event.notification.data?.matchId;
  if (matchId) {
    clients.openWindow(`/match/${matchId}`);
  }
});
```

---

## BACKEND API CONTRACT — v3

### Base URL
```
REST:      https://api.flot.app/{stage}
WebSocket: wss://ws.flot.app/{stage}
```

### Authentication
All REST endpoints (except `/webhooks/stripe`) require Cognito JWT: `Authorization: Bearer <token>`

### REST Endpoints

#### `GET /airports` — invariato
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
    "terminals": [...],
    "zones": [...],
    "directionLabels": ["TO_MILAN", "FROM_MILAN"],
    "searchTimeoutSec": 300,
    "scheduledMatchWindowMin": 60,       // NUOVO v3
    "scheduledAdvanceDays": 7,           // NUOVO v3
    "active": true
  }
]
```

#### `POST /trips` `[AGGIORNATO v3]`
```json
// Request
{
  "airportCode": "MXP",
  "terminal": "T1",
  "direction": "TO_MILAN",
  "destination": "Via Brera 28, Milano",
  "destLat": 45.4722,
  "destLng": 9.1878,
  "destPlaceId": "ChIJ...",
  "flightTime": "2026-04-26T14:30:00Z",   // futuro per scheduled, ~now per live
  "paxCount": 1,
  "luggage": 2
}

// Response 201
{
  "tripId": "trip_abc123",
  "airportCode": "MXP",
  "mode": "scheduled",                     // NUOVO v3 — "scheduled" | "live"
  "status": "scheduled",                   // NUOVO v3 — "scheduled" | "searching"
  "flightTime": "2026-04-26T14:30:00Z",
  "expiresAt": "2026-04-26T16:30:00Z",     // NUOVO v3
  "createdAt": "2026-04-24T10:00:00Z"
}
```

#### `GET /trips/my` `[NUOVO v3]`
```json
// Response 200
{
  "trips": [
    {
      "tripId": "trip_abc123",
      "airportCode": "MXP",
      "terminal": "T1",
      "direction": "TO_MILAN",
      "destination": "Via Brera 28, Milano",
      "mode": "scheduled",
      "status": "scheduled",               // scheduled | searching | matched | unlocked | completed | expired | cancelled
      "flightTime": "2026-04-26T14:30:00Z",
      "luggage": 2,
      "matchId": null,                      // popolato quando status = matched/unlocked
      "createdAt": "2026-04-24T10:00:00Z"
    }
  ]
}
```

#### `DELETE /trips/:tripId` `[NUOVO v3]`
```json
// Response 200
{ "tripId": "trip_abc123", "status": "cancelled" }
// Error 400 — trip non cancellabile (già matched/unlocked)
{ "error": "Cannot cancel a matched trip" }
```

#### `PUT /users/me/push-token` `[NUOVO v3]`
```json
// Request
{ "token": "fcm_token_xxx", "platform": "fcm" }
// Response 200
{ "registered": true }
```

#### `GET /notifications` `[NUOVO v3]`
```json
// Response 200
{
  "notifications": [
    {
      "id": "notif_001",
      "type": "match_found",
      "title": "Match trovato!",
      "body": "Un viaggiatore va verso Duomo area",
      "matchId": "match_xyz",
      "tripId": "trip_abc123",
      "read": false,
      "createdAt": "2026-04-26T12:00:00Z"
    }
  ]
}
```

#### `GET /matches/:matchId` — invariato

#### `POST /trips/:tripId/unlock` — invariato

#### `GET /users/me` — invariato (+ `pushToken` registrato)

### WebSocket — invariato (+ `trip_update` event per status changes)

---

## FILE STRUCTURE — v3

```
flot-web/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── manifest.json
│   ├── firebase-messaging-sw.js         # NUOVO v3 — push notification service worker
│   ├── logo-glyph.svg
│   └── logo-wordmark.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   ├── global.css
│   │   └── design-tokens.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── MIcon.tsx
│   │   │   ├── MBtn.tsx
│   │   │   ├── MSegment.tsx
│   │   │   ├── MStepper.tsx
│   │   │   ├── MPill.tsx
│   │   │   ├── MDestInput.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── MDateTimePicker.tsx      # NUOVO v3 — wrapper datetime-local styled
│   │   │   ├── Toast.tsx                # NUOVO v3 — in-app notification toast
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── TopNav.tsx
│   │   │   ├── HomeIndicator.tsx
│   │   │   ├── GradientCTA.tsx
│   │   │   └── TabBar.tsx               # NUOVO v3 — bottom tab bar
│   │   ├── trips/
│   │   │   ├── TripCard.tsx             # NUOVO v3 — card per My Trips list
│   │   │   ├── TripStatusPill.tsx       # NUOVO v3 — pill colorata per stato
│   │   │   └── PushPrompt.tsx           # NUOVO v3 — push notification CTA card
│   │   └── chat/
│   │       ├── ChatSheet.tsx
│   │       ├── ChatBubble.tsx
│   │       └── TypingIndicator.tsx
│   ├── screens/
│   │   ├── EntryPoint.tsx               # AGGIORNATO v3 — copy + how it works
│   │   ├── AirportPicker.tsx
│   │   ├── TravelCheckin.tsx            # AGGIORNATO v3 — mode toggle + flightTime
│   │   ├── TripScheduled.tsx            # NUOVO v3 — conferma trip schedulato
│   │   ├── MyTrips.tsx                  # NUOVO v3 — trip dashboard
│   │   ├── ActiveSearch.tsx             # Invariato — solo per Live mode
│   │   ├── MatchLocked.tsx
│   │   ├── ConnectionUnlocked.tsx
│   │   ├── NoMatchFound.tsx
│   │   ├── Profile.tsx                  # NUOVO v3 — pagina profilo con settings
│   │   └── IdentityVerification.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── airportStore.ts
│   │   ├── tripStore.ts                 # AGGIORNATO v3 — myTrips state
│   │   ├── matchStore.ts
│   │   └── notificationStore.ts         # NUOVO v3
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── airports.ts
│   │   ├── trips.ts                     # AGGIORNATO v3 — myTrips, cancelTrip
│   │   ├── matches.ts
│   │   ├── users.ts
│   │   ├── payments.ts
│   │   ├── websocket.ts
│   │   ├── pushNotifications.ts         # NUOVO v3
│   │   └── notifications.ts            # NUOVO v3
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useCountdown.ts
│   │   ├── useMatchPolling.ts
│   │   └── usePushNotifications.ts      # NUOVO v3
│   ├── types/
│   │   ├── api.ts                       # AGGIORNATO v3 — Trip.mode, Trip.expiresAt
│   │   ├── domain.ts
│   │   └── ws.ts
│   ├── lib/
│   │   ├── buildDestinations.ts
│   │   ├── savings.ts
│   │   ├── formatters.ts
│   │   ├── firebase.ts                  # NUOVO v3 — Firebase init per FCM
│   │   └── constants.ts
│   └── i18n/
│       ├── config.ts
│       ├── it.json                      # AGGIORNATO v3 — nuove stringhe
│       └── en.json                      # AGGIORNATO v3 — nuove stringhe
├── tests/
└── .env.example
```

---

## ENVIRONMENT VARIABLES — v3

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
# NUOVO v3 — Firebase Cloud Messaging
VITE_FCM_VAPID_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_API_KEY=xxxxxxxxxxxxxxxx
VITE_FIREBASE_PROJECT_ID=flot-app
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
VITE_FIREBASE_APP_ID=x:xxxxxxxxxxxx:web:xxxxxxxxxxxxxx
```

---

## CODING STANDARDS — invariati

1. **TypeScript strict** — no `any`, no `as` casts.
2. **Functional components only** — hooks for all state and effects.
3. **CSS Modules** — one `.module.css` per component. All values via `var(--token)`.
4. **Barrel exports** — every folder gets an `index.ts`.
5. **Small files** — one component per file, max ~150 lines.
6. **Zod schemas** — mirror backend validation.
7. **Error boundaries** — wrap each screen.
8. **Loading states** — skeleton or spinner for every async op.
9. **Accessibility** — ARIA labels, focus management.
10. **No console.log** — structured logger in production.

---

## DEVELOPMENT SEQUENCE — v3

### Sprint 1 — Foundation [DONE]
1-6. Invariato da v2

### Sprint 2 — Auth + Check-in [AGGIORNATO v3]
7. Amplify auth (Cognito Google + Apple)
8. `authStore` + `useAuth` hook
9. Entry Point connected to Cognito — **con copy v3**
10. `api.ts` — ky instance with auth interceptor
11. `airportStore` + `GET /airports` + `AirportPicker` screen
12. Travel Check-in screen — **con mode toggle + flightTime picker**
13. `POST /trips` integration — **con mode scheduled/live**
14. **NUOVO: Trip Scheduled screen**
15. **NUOVO: Bottom Tab Bar**

### Sprint 3 — My Trips + Notifications [NUOVO v3]
16. **NUOVO: My Trips screen + `GET /trips/my`**
17. **NUOVO: Trip cancellation (`DELETE /trips/:tripId`)**
18. **NUOVO: Push notification setup (Firebase + service worker)**
19. **NUOVO: `usePushNotifications` hook + PushPrompt component**
20. **NUOVO: Push token registration (`PUT /users/me/push-token`)**
21. **NUOVO: In-app notification toast**
22. WebSocket service (connect, reconnect, heartbeat, event dispatch)
23. `useWebSocket` hook
24. Active Search screen (solo Live mode — invariato)
25. Match Locked screen (blurred partner, unlock CTA)
26. Fake Door modal

### Sprint 4 — Unlock + Chat
27-32. Invariato da v2

### Sprint 5 — Polish
33. i18n (IT + EN) — **con nuove stringhe v3**
34. PWA (manifest, service worker, offline fallback, push)
35. Framer Motion page transitions
36. Error boundaries and error states
37. Loading skeletons
38. Unit tests
39. E2E happy-path test — **incluso flusso Scheduled**

---

## IMPORTANT RULES

- **FLOT.zip è il design authority per stili e componenti.** Per il copy e il flusso, **questo prompt v3 ha priorità** sui mockup HTML.
- **Never hardcode airport-specific data.** Read from `airportStore.selectedAirport`.
- **All prices are dynamic** — savings, unlock fee, base fare from airport config.
- **`airportCode` is always sent** with trip creation.
- **No phone frame** — the app fills `100dvh`.
- **Safe areas** — respect `env(safe-area-inset-*)`.
- **Minimum touch targets** — 44×44px per Apple HIG.
- **Photo blur is server-side**.
- **FAKE_DOOR_MODE** — when `true`, unlock shows "Coming soon" modal.
- **Scheduled mode è il default.** Il toggle in Travel Check-in deve pre-selezionare "Schedule".
- **Push notifications sono critiche per Scheduled mode.** Il PushPrompt deve apparire su Trip Scheduled screen e, se non concesse, come banner persistente in My Trips.
- **Deep linking** — le push notification devono aprire direttamente `/match/:matchId`.
- **Trip cancellation** — un trip `scheduled` può essere cancellato. Un trip `matched` o `unlocked` NO.
- When I say "run" → `npm run dev`. "build" → `npm run build`. "test" → `npm run test`.

---

## PERFORMANCE TARGETS

- Lighthouse Mobile: ≥ 90 Performance, 100 Accessibility
- First Contentful Paint: < 1.5s on 4G
- Time to Interactive: < 3s on 4G
- Bundle: < 150KB gzipped (Stripe.js loads async on Match Locked only, Firebase async on Trip Scheduled)

---

*Flot Frontend v3 — Scheduled-First MVP — Aprile 2026*

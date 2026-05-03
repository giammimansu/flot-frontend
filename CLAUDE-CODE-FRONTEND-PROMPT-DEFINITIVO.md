# Flot — Frontend Development Prompt (DEFINITIVO — v3 Scheduled-First)

> **Gerarchia delle fonti**: questo file > mockup HTML in `FLOT/` per copy e flusso. Per stili, componenti e visual: i mockup HTML sono authority.

---

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

## DESIGN FILES

Read folder `FLOT`. It contains:

| File | What it is |
|------|-----------|
| `colors_and_type.css` | **Design system** — all CSS custom properties (colors, spacing, radii, shadows, motion tokens, typography). Import globally. Never hardcode any value defined here. |
| `MalpensaComponents.jsx` | **Shared component library** — `MIcon`, `MBtn`, `MSegment`, `MStepper`, `MPill`, `MDestInput`. Convert to TypeScript. Preserve every prop, variant, and visual behavior exactly. |
| `ios-frame.jsx` | Phone frame for mockups. **Do not include in app** — app fills full viewport. |
| `Entry Point.html` | Screen 1 — landing + login (v3 copy — see spec below) |
| `Entry Point v1.html` | Historical reference only. |
| `Travel Check-in.html` | Screen 2 — trip form (v3: mode toggle + flightTime — see spec below) |
| `Trip Scheduled.html` | Screen 2b — **NUOVO** — conferma prenotazione schedulata |
| `My Trips.html` | Screen 3b — **NUOVO** — dashboard trip utente |
| `Active Search.html` | Screen 3 — real-time search (solo Live mode) |
| `Match Result - Locked.html` | Screen 4 — match preview, blurred partner |
| `The Connection - Unlocked.html` | Screen 5 — full partner details + chat |
| `No Match Found.html` | Screen 6 — empty state (solo Live mode) |
| `Identity Verification.html` | Screen 7 — Stripe Identity KYC |
| `Profile.html` | Screen 8 — **NUOVO** — profilo utente + settings |
| `assets/logo-glyph.svg` | App icon |
| `assets/logo-wordmark.svg` | Full logo |

**How to read HTML mockups**: self-contained prototypes. Extract structure, layout, copy, component usage, animations. Inline styles are prototyping shortcuts — convert all to CSS Modules using tokens from `colors_and_type.css`.

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
Animations:     Framer Motion — timing/easing from colors_and_type.css tokens
Icons:          MIcon component from MalpensaComponents.jsx (converted to TS)
Build:          Vite → static deploy to S3 + CloudFront
PWA:            vite-plugin-pwa (service worker, add to home screen, push notifications)
i18n:           react-i18next (IT + EN)
Notifications:  Web Push API + Firebase Cloud Messaging (FCM)
Testing:        Vitest + React Testing Library + MSW
Linting:        ESLint + Prettier (airbnb config)
```

---

## SCREENS & USER FLOW

```
Entry Point (/)
    ↓ login success
Airport Picker (/airport)              ← auto-skipped if only 1 airport active
    ↓ airport selected
Travel Check-in (/check-in)
    ├─ mode = "schedule" (DEFAULT)
    │   ↓ submit
    │   Trip Scheduled (/trip/:tripId)          ← NUOVO
    │       ↓ match trovato (push/email)
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
                                ↓ try again → /check-in

My Trips (/my-trips)                           ← NUOVO — tab bar
    └─ tap trip → Trip Scheduled / Match detail

Profile (/profile)                             ← NUOVO — tab bar
    └─ Identity Verification (/verify)
    └─ Notification preferences (inline toggles)
```

---

## SCREEN SPECIFICATIONS

---

### Screen 1 — Entry Point (`/`)

**Obiettivo**: comunicare il valore di FLOT orientato alla pianificazione. Abbassare ansia pre-login. L'utente capisce cosa fa FLOT entro 5 secondi.

**Struttura**:

1. **Top Nav**: logo FLOT sinistra (dot amber + "FLOT"), bottone help destra

2. **Hero section** (padding 22px 20px 0):
   - Kicker pill: dot amber pulsante + "Malpensa · Milano" su sfondo amber-soft
   - H1 (Bricolage 27–32px/800): **"Plan your shared ride from the airport."**
     - ❌ Non usare: "You've landed" (utente probabilmente non è in aeroporto)
     - ❌ Non usare: "Split the €120 Malpensa fare" (implica che FLOT vende la corsa)
   - Subtitle (Inter 13–15px/relaxed/ink-muted): **"Add your flight, we'll find a traveler heading your way. You share a standard taxi together — we don't drive you."**

3. **Live Savings Counter**:
   - Card surface-1, bordo hairline, border-radius 20px, padding 16px 18px
   - Layout: icona sinistra + testo destra
   - Icona: cerchio 42px, success-soft, icona `sparkles` verde
   - Contenuto:
     ```
     Label uppercase: "TRAVELERS HAVE SAVED"    ← --ink-subtle / 10px / tracking-wide
     Numero animato:  "€12,847"                  ← Bricolage 28px / 800 / --success / tnum
     Sub:             "since launch at Malpensa"  ← Inter 12px / --ink-muted
     ```
   - **Animazione numero**: conta da (target - 200) a target in 1200ms ease-out, rAF ~16ms. API: `GET /airports/MXP/stats → { totalSavingsLaunch: 1284700 }`. Formatta con `Intl.NumberFormat`.
   - **Pulse live**: dot amber pulsante affianco al numero
   - ⚠️ Se API non risponde entro 2s, nascondere silenziosamente (no €0, no errori)

4. **Blocco "How it works"** — card surface-1, bordo hairline, padding 14–16px:
   - Label uppercase "How it works" in `--ink-subtle`
   - 3 step verticali con icone + linea connettore 1px `--hairline` tra i cerchi:
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
   - Step 3 usa cerchio success-soft (verde) per enfatizzare risparmio

5. **Guarantee banner** — visibile sopra i bottoni login:
   - Card success-soft, bordo `rgba(22,163,74,0.20)`, border-radius 16px
   - Icona shield verde su cerchio verde-light
   - **"No match? No charge. Ever."** Inter 13px/600 / `--success`
   - Sub: "We only connect you — zero taxi risk" Inter 11px / #16A34A

6. **Bottoni Auth** (gap 9–10px, altezza 50–52px, border-radius 16px):
   - Google: bianco, bordo hairline, logo SVG Google + "Continue with Google"
   - Apple: `--ink` scuro, logo Apple SVG bianco + "Continue with Apple"

7. **Terms + Sign in** (11px/subtle, centrato)

8. **Home Indicator**

**CSS speciali**:
```css
.step-connector { width:1px; height:18px; background:var(--hairline); margin:3px 0; }
.divider-row { display:flex; align-items:center; gap:12px; margin:14px 0; }
.divider-row::before, .divider-row::after { content:''; flex:1; height:1px; background:var(--hairline); }
.divider-row span { font-size:11px; font-weight:500; color:var(--ink-subtle); }
@keyframes countUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
.savings-counter { animation: countUp 400ms var(--ease-out); }
```

---

### Screen 2 — Travel Check-in (`/check-in`)

**Razionale**: utente prenota in anticipo specificando quando atterrerà. Live mode disponibile come opzione secondaria.

**Struttura** (scrollabile):

1. **Top Nav**: chevron-left, "FLOT" centrato, avatar utente

2. **Hero copy**:
   - H2 (Bricolage 24px/700): **"When are you landing?"**
   - Subtitle (Inter 14px/ink-muted): **"Add your trip details — we'll start looking for your ride partner right away."**

3. **Mode toggle** — primo elemento del form:
   ```
   MSegment con 2 opzioni:
   - "📅 Schedule"     (DEFAULT, pre-selezionato)
   - "📍 I'm here now"
   
   Sub sotto toggle (12px/ink-muted):
   - Se Schedule: "We'll notify you when we find a match"
   - Se Live:     "We'll search for 5 minutes while you wait"
   ```

4. **Form** (gap 20–24px) — 5 campi:

   **4a. Flight arrival date & time** — visibile SOLO mode Schedule:
   ```
   Label: "When do you land?" (Inter 14px/500)
   Input: MDateTimePicker (wrapper styled su type="datetime-local")
     - min: now
     - max: now + airport.scheduledAdvanceDays
     - step: 900 (15 min granularity)
   Sub: "Your flight arrival time" (12px/ink-muted)
   Obbligatorio in Schedule mode
   ```
   In Live mode: nascosto; `flightTime = new Date().toISOString()` automatico.

   **4b. Terminal** — MSegment
   ```
   Label: "Your terminal"
   Options: da airport.terminals (dinamico)
   Default: primo terminal
   ```

   **4c. Direction** — MSegment
   ```
   Label: "Direction"
   Options: da airport.directionLabels (dinamico)
   Default: "To Milan" (TO_MILAN)
   Sub: "Where are you headed after landing?"
   ```

   **4d. Destination** — MDestInput + DestSheet (bottom sheet)
   ```
   Label: "Where are you going?"
   Placeholder: "Search destination…"
   Obbligatorio — CTA disabilitato finché non selezionato
   Salva: destination, destLat, destLng, destPlaceId
   ```

   **4e. Luggage** — MStepper (min 0, max 6)
   ```
   Label: "Bags"
   Sub: "Helps your partner know what to expect"
   Default: 1
   ```

5. **CTA Button** (GradientCTA sticky bottom):
   ```
   Schedule: "Schedule my ride share" + icona calendar
   Live:     "Find my partner now" + icona search
   ```
   Disabilitato finché destination non selezionato. In Schedule, anche se flightTime mancante.

6. **Info box sotto CTA** (12px/ink-muted, centrato):
   ```
   Schedule: "Free to schedule · €0.99 only if matched"
   Live:     "Free to search · €0.99 only if matched"
   ```

**Submit logic**:
```typescript
const onSubmit = async (data: TripFormData) => {
  const flightTime = mode === 'schedule'
    ? data.flightTime
    : new Date().toISOString();

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
    navigate(`/trip/${trip.tripId}`);
  } else {
    navigate('/search');
  }
};
```

---

### Screen 2b — Trip Scheduled (`/trip/:tripId`) `[NUOVO]`

**Design file**: `FLOT/Trip Scheduled.html`

**Obiettivo**: confermare prenotazione, spingere push notifications, dare fiducia.

**Struttura**:

1. **Top Nav**: logo FLOT sinistra, trip ID badge destra (surface-2, tnum, 11px)

2. **Success animation** (Framer Motion / CSS keyframes):
   - Outer ring: cerchio 120px, border `2px solid rgba(22,163,74,0.15)`, animazione `ringGrow 500ms`
   - Inner circle: cerchio 88px, `--success` solid, icona check bianco 42px, shadow glow verde
   - Animazione check: `checkPop 600ms 150ms cubic-bezier(0.22,0.61,0.36,1) both` (scale 0→1.15→1)
   - Confetti dots: 5 dot colorati (amber, success, blue, red) con animazioni `confetti1/2/3` translateY(-50/60/70px) + rotate

3. **Headline** (fadeUp 400ms 200ms delay):
   - H1 (Bricolage 28px/800): "Viaggio prenotato!" / "Trip scheduled!"
   - Sub (Inter 14px/ink-muted): "Ti cercheremo un compagno il giorno stesso. Riceverai una notifica appena troviamo un match."

4. **Trip summary card** (surface-1, bordo hairline, border-radius 24px, fadeUp 350ms delay):
   - **Route section** (padding 18px 18px 14px):
     - Dot-line-dot visuale: cerchio outline amber (10px) → linea 1.5px hairline (28px) → cerchio filled amber (10px)
     - Da: label uppercase "DA" / "FROM" + destination name in Bricolage 17px/700
     - A: label uppercase "A" / "TO" + destination in Bricolage 17px/700
   - Divider hairline
   - **Details grid** (2 colonne, gap 12px, padding 14px 18px 16px):
     - Data: icona calendar su cerchio surface-2 + data formattata
     - Orario: icona clock + `flightTime` formattato
     - Passeggeri: icona users + conteggio
     - Bagagli: icona luggage + conteggio
   - **Savings strip** (success-soft background, padding 12px 18px):
     - Icona sparkles verde + "Risparmio stimato" + importo in Bricolage 20px/800 success

5. **Push notification prompt** (surface-1, bordo hairline, fadeUp 500ms delay):
   - Icona bell su cerchio amber-soft 40px border-radius 14px
   - H3: "Attiva le notifiche" / "Don't miss your match!"
   - Sub: "Ti avviseremo appena troviamo un compagno e quando sarà ora di partire."
   - 2 bottoni in grid 1fr 1fr:
     - Primary amber (h 44px, radius 14px): `<BellIcon/> Attiva` → `requestPushPermission()`
     - Secondary surface-2: "Non ora" / "Skip"
   - Se notifiche già abilitate: mostra check verde "Notifications enabled"
   - Se browser non supporta push: "We'll send you an email when we find a match"

6. **"Cosa succede ora" / "What happens next"** (surface-1, bordo hairline, fadeUp 600ms delay):
   - Label uppercase "COSA SUCCEDE ORA"
   - 3 step con numero in cerchio surface-2 + testo, divisi da border-bottom surface-2:
     ```
     1. "Cercheremo compagni diretti a [destination]"
     2. "Riceverai una notifica push con il match"
     3. "Vi incontrerete all'uscita indicata"
     ```

7. **Action area** (absolute bottom, gradient fade):
   - Grid 2 colonne:
     - MBtn dark: icona list + "I miei viaggi" → `/my-trips`
     - MBtn outline: icona plus + "Nuovo viaggio" → `/check-in`
   - Link rosso sotto: icona trash + "Cancella prenotazione" → confirm dialog → `DELETE /trips/:tripId` → `/my-trips`

8. **Bottom Tab Bar**

**Polling**: se utente resta su schermata, WebSocket ascolta `match_found` per tripId → animazione celebrativa → auto-navigate `/match/:matchId` dopo 2s.

---

### Screen 3 — Active Search (`/search`) — Solo Live mode

**Design file**: `FLOT/Active Search.html`

Invariato. Appare SOLO quando utente sceglie "I'm here now" nel check-in.
- Radar animation + countdown da `airport.searchTimeoutSec`
- WebSocket: `match_found` → `/match/:matchId`
- Timeout → `/no-match`
- Cancel → close WebSocket, go back

---

### Screen 3b — My Trips (`/my-trips`) `[NUOVO]`

**Design file**: `FLOT/My Trips.html`

**Obiettivo**: dashboard trip. Punto di ritorno principale per utenti con trip schedulati.

**Struttura**:

1. **Header** (padding 16px 20px 0):
   - Greeting: "Ciao, [firstName] 👋" (Inter 13px/500/ink-muted)
   - H1 (Bricolage 28px/800): "I miei viaggi" / "My trips"
   - Avatar destra (40px cerchio surface-2, iniziali utente)

2. **Stats strip** (margin 14px 20px 0, flex gap 10px):
   - Card success-soft (flex 1, padding 12px 14px, border-radius 16px):
     - Icona sparkles success + valore `€{totalSaved}` Bricolage 18px/800 success + label "risparmiati"
   - Card surface-2 (flex 1, padding 12px 14px, border-radius 16px):
     - Icona check ink-muted + count Bricolage 18px/800 + label "completati"

3. **Tab filter** (MSegment, margin 18px 20px 0):
   ```
   "Attivi (N)" | "Passati (N)"
   ```

4. **Trip list** (padding 14px 20px 100px, gap 12px):

   Ogni **TripCard** (surface-1, bordo hairline, border-radius 22px, padding 16px, shadow-card, fadeUp animato):
   ```
   ── Top row ──
   StatusBadge (sinistra) + trip ID (destra, 11px/500/ink-subtle/tnum)

   ── Route ──
   Visuale dot-line-dot:
     cerchio outline amber 8px → linea 1.5px hairline 18px → cerchio filled amber 8px
   
   Testo destra del dot: terminal (from) + destination (to)  (14px/600/ink)
   Data/ora colonna destra (13px/600/ink + 12px/ink-muted/tnum)

   ── Divider 1px hairline ──

   ── Footer row ──
   Sinistra: avatar iniziali partner (24px cerchio) + "con [nome]"
             oppure "In attesa di match…" (13px/500/ink-subtle)
   Destra:   risparmio stimato "~−€60" (Bricolage 15px/700/success)
             o risparmio reale per completati
   
   ── CTA condizionale ──
   "Matched!":   MBtn primary "View match →"  → /match/:matchId
   "Scheduled":  MBtn ghost "Cancel trip"     → confirm dialog
   "Unlocked":   MBtn primary "Open chat →"   → /connection/:matchId
   ```

   **StatusBadge** con dot pulsante per stati attivi:
   ```typescript
   const statusConfig = {
     scheduled: { label:'Programmato', bg:'var(--amber-soft)', color:'#92400E', dot:true },
     matched:   { label:'Match trovato', bg:'var(--success-soft)', color:'#15803D', dot:true },
     unlocked:  { label:'Sbloccato', bg:'#EFF6FF', color:'#1D4ED8' },
     completed: { label:'Completato', bg:'var(--surface-2)', color:'var(--ink-muted)', icon:'check' },
     expired:   { label:'Scaduto', bg:'var(--error-soft)', color:'#DC2626' },
     cancelled: { label:'Cancellato', bg:'var(--surface-2)', color:'var(--ink-subtle)' },
   }
   ```
   Trip `expired` in tab Passati: opacity 0.7.

5. **Empty state** (se lista vuota):
   - Cerchio surface-2 64px + icona search 28px/ink-subtle
   - H3: "Nessun viaggio qui"
   - Sub: "I tuoi viaggi appariranno qui"
   - MBtn primary: "Prenota un viaggio" → `/check-in`

6. **FAB** (absolute bottom-right 28/20, 56px cerchio amber, shadow amber 0.35):
   - Icona plus bianca 26px
   - onClick → `/check-in`
   - zIndex 10, sopra tab bar

7. **Bottom Tab Bar**

**Data**: `GET /trips/my` → trip ordinati `createdAt` desc. Tab "Attivi": status in `[scheduled, matched, unlocked]`. Tab "Passati": status in `[completed, expired, cancelled]`.

---

### Screen 4 — Match Result — Locked (`/match/:matchId`)

**Design file**: `FLOT/Match Result - Locked.html`

Invariato. Entry points:
- Push notification deep link (Scheduled mode)
- Active Search → match_found (Live mode)
- My Trips → "View match"

**Logic**: `GET /matches/:matchId`. On unlock:
- **Fake Door** (`VITE_FAKE_DOOR_MODE=true`): "Coming soon" modal + `POST /trips/:tripId/unlock { fakeDoor: true }`
- **Live**: `POST /trips/:tripId/unlock` → Stripe PaymentSheet → `/connection/:matchId`

---

### Screen 5 — The Connection — Unlocked (`/connection/:matchId`)

**Design file**: `FLOT/The Connection - Unlocked.html`

Invariato. `GET /matches/:matchId`. Chat real-time via WebSocket. "Call" → `tel:` link.

---

### Screen 6 — No Match Found (`/no-match`)

**Design file**: `FLOT/No Match Found.html`

Solo Live mode timeout. "Try again" → `/check-in`.

Per Scheduled mode: trip scade silenziosamente → status "Expired" in My Trips. Push/email: "We couldn't find a match for your trip to [destination] on [date]. Schedule a new one?"

---

### Screen 7 — Identity Verification (`/verify`)

**Design file**: `FLOT/Identity Verification.html`

Invariato. `POST /users/me/verify` → Stripe Identity SDK. "Skip for now" disponibile.

---

### Screen 8 — Profile (`/profile`) `[NUOVO]`

**Design file**: `FLOT/Profile.html`

**Struttura**:

1. **Top Nav**: chevron-left (40px cerchio surface-1, bordo hairline), "Profilo" centrato, spacer 40px

2. **Profile card** (surface-1, bordo hairline, border-radius 24px, padding 20px, shadow-card):
   - **Avatar** (64px cerchio, gradient BFDBFE→93C5FD, iniziali 22px/800 #1E40AF):
     - Badge edit: cerchio 22px amber, bordo 2px surface-1, icona pen, position absolute bottom-2 right-2
   - **Info**: nome Bricolage 20px/800, email Inter 13px/ink-muted
   - **Badges**: pill blu "Verificato" (EFF6FF/BFDBFE border, check SVG blu) + rating stelle amber + "4.9"
   - **Stats strip** (3 colonne con divider 1px hairline):
     ```
     Viaggi | Risparmiati | Puntualità
     N      | €X          | X%
     Bricolage 18px/800 + Inter 11px/ink-subtle
     ```

3. **Sezione "Notifiche"** (Section component: label uppercase + card surface-1 border-radius 20px):
   - Row: icona bell + "Match trovato" + sub "Quando troviamo un compagno" + **Toggle**
   - Row: icona bell + "Promemoria viaggio" + sub "30 min prima della partenza" + Toggle
   - Row: icona bell + "Offerte e novità" + sub "Promozioni e nuove rotte" + Toggle (default off)

   **Toggle component**: 46×28px, background success se on / hairline-strong se off, thumb 24px bianco con shadow, transition 200ms.

4. **Sezione "Account"**:
   - Row: shield + "Verifica identità" + sub stato verifica → `/verify`
   - Row: credit-card + "Metodo di pagamento" + sub "Visa •••• 4242"
   - Row: globe + "Lingua" + right = codice lingua + chevron
   - Row: lock + "Privacy e sicurezza"

5. **Sezione "Supporto"**:
   - Row: headphones + "Centro assistenza"
   - Row: file-text + "Termini e condizioni"

6. **Logout section** (card separata, no sezione title):
   - Row danger: icona logOut rosso su cerchio error-soft + "Esci dall'account" rosso

7. **Version string** (centrato, 11px/ink-subtle, padding 16px 20px 32px): "FLOT v1.0.0-beta · Made in Milano"

8. **Bottom Tab Bar**

**Row component**:
```typescript
interface RowProps {
  icon: ReactNode;
  label: string;
  sub?: string;
  right?: ReactNode;  // default: chevron-right
  onClick?: () => void;
  danger?: boolean;
}
```
Altezza contenuto ~56px (padding 14px 0). Divider hairline tra row consecutive.

---

## BOTTOM TAB BAR `[NUOVO]`

```
3 tab:
  Home (icona home)       → /check-in (se loggato)
  My Trips (icona list)   → /my-trips
  Profile (icona user)    → /profile

Stile:
  - Sticky bottom, height 56px + safe-area-inset-bottom
  - Background: var(--surface-1)
  - Border top: 1px solid var(--hairline)
  - Icone: 24px, inactive = var(--ink-subtle), active = var(--amber)
  - Label: 10px / 500
  - Active: icona + label in var(--amber) + dot indicator 4px sopra icona

Visibilità:
  - Mostrata su: /check-in, /my-trips, /profile, /trip/:tripId
  - Nascosta su: / (pre-login), /search, /match/*, /connection/*, /no-match
```

---

## PUSH NOTIFICATIONS

```typescript
// src/services/pushNotifications.ts
import { getToken, onMessage } from 'firebase/messaging';

export async function requestPushPermission(): Promise<string | null> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
  });

  await api.put('/users/me/push-token', { token, platform: 'fcm' });
  return token;
}

export function setupForegroundNotifications() {
  onMessage(messaging, (payload) => {
    const { title, body, data } = payload.notification!;
    showToast({ title, body });
    if (data?.action === 'open_match') {
      navigate(`/match/${data.matchId}`);
    }
  });
}
```

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.x/firebase-messaging-compat.js');

firebase.initializeApp({ /* config from env */ });
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/logo-glyph.svg',
    badge: '/logo-glyph.svg',
    data: payload.data,
    actions: [{ action: 'open', title: 'View match' }],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const matchId = event.notification.data?.matchId;
  if (matchId) clients.openWindow(`/match/${matchId}`);
});
```

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
[{
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
  "scheduledMatchWindowMin": 60,
  "scheduledAdvanceDays": 7,
  "active": true
}]
```

#### `GET /airports/:code/stats`
```json
{ "totalSavingsLaunch": 1284700 }
```

#### `POST /trips`
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
  "flightTime": "2026-04-26T14:30:00Z",
  "paxCount": 1,
  "luggage": 2
}
// Response 201
{
  "tripId": "trip_abc123",
  "airportCode": "MXP",
  "mode": "scheduled",       // "scheduled" | "live"
  "status": "scheduled",     // "scheduled" | "searching"
  "flightTime": "2026-04-26T14:30:00Z",
  "expiresAt": "2026-04-26T16:30:00Z",
  "createdAt": "2026-04-24T10:00:00Z"
}
```

#### `GET /trips/my`
```json
{
  "trips": [{
    "tripId": "trip_abc123",
    "airportCode": "MXP",
    "terminal": "T1",
    "direction": "TO_MILAN",
    "destination": "Via Brera 28, Milano",
    "mode": "scheduled",
    "status": "scheduled",   // scheduled|searching|matched|unlocked|completed|expired|cancelled
    "flightTime": "2026-04-26T14:30:00Z",
    "luggage": 2,
    "matchId": null,
    "createdAt": "2026-04-24T10:00:00Z"
  }]
}
```

#### `DELETE /trips/:tripId`
```json
// Response 200
{ "tripId": "trip_abc123", "status": "cancelled" }
// Error 400
{ "error": "Cannot cancel a matched trip" }
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
  "pushToken": null,
  "createdAt": "2026-04-20T10:00:00Z"
}
```

#### `POST /users/me/verify`
```json
// Response 200
{ "verificationSessionId": "vs_xxx", "clientSecret": "vs_xxx_secret_yyy" }
```

#### `PUT /users/me/push-token`
```json
// Request
{ "token": "fcm_token_xxx", "platform": "fcm" }
// Response 200
{ "registered": true }
```

#### `GET /notifications`
```json
{
  "notifications": [{
    "id": "notif_001",
    "type": "match_found",
    "title": "Match trovato!",
    "body": "Un viaggiatore va verso Duomo area",
    "matchId": "match_xyz",
    "tripId": "trip_abc123",
    "read": false,
    "createdAt": "2026-04-26T12:00:00Z"
  }]
}
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
{ "event": "trip_update",    "data": { "tripId": "trip_abc123", "status": "matched", "matchId": "match_xyz" } }
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
│   ├── firebase-messaging-sw.js
│   ├── logo-glyph.svg
│   └── logo-wordmark.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   ├── global.css
│   │   └── design-tokens.css          # = colors_and_type.css (renamed)
│   ├── components/
│   │   ├── ui/
│   │   │   ├── MIcon.tsx
│   │   │   ├── MBtn.tsx
│   │   │   ├── MSegment.tsx
│   │   │   ├── MStepper.tsx
│   │   │   ├── MPill.tsx
│   │   │   ├── MDestInput.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── MDateTimePicker.tsx    # wrapper styled datetime-local
│   │   │   ├── Toast.tsx              # in-app notification toast
│   │   │   ├── ComingSoonModal.tsx    # fake door modal
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── TopNav.tsx
│   │   │   ├── HomeIndicator.tsx
│   │   │   ├── GradientCTA.tsx
│   │   │   ├── TabBar.tsx             # bottom tab bar
│   │   │   └── ProfileMenu.tsx        # avatar menu (se necessario)
│   │   ├── trips/
│   │   │   ├── TripCard.tsx           # card per My Trips list
│   │   │   ├── TripStatusBadge.tsx    # badge colorato per stato
│   │   │   └── PushPrompt.tsx         # push notification CTA card
│   │   └── chat/
│   │       ├── ChatSheet.tsx
│   │       ├── ChatBubble.tsx
│   │       └── TypingIndicator.tsx
│   ├── screens/
│   │   ├── EntryPoint.tsx
│   │   ├── AirportPicker.tsx
│   │   ├── TravelCheckin.tsx
│   │   ├── TripScheduled.tsx          # NUOVO
│   │   ├── MyTrips.tsx                # NUOVO
│   │   ├── ActiveSearch.tsx
│   │   ├── MatchLocked.tsx
│   │   ├── ConnectionUnlocked.tsx
│   │   ├── NoMatchFound.tsx
│   │   ├── Profile.tsx                # NUOVO
│   │   ├── IdentityVerification.tsx
│   │   └── index.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── airportStore.ts
│   │   ├── tripStore.ts               # include myTrips state
│   │   ├── matchStore.ts
│   │   └── notificationStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── airports.ts
│   │   ├── trips.ts                   # include myTrips, cancelTrip
│   │   ├── matches.ts
│   │   ├── users.ts
│   │   ├── payments.ts
│   │   ├── websocket.ts
│   │   ├── pushNotifications.ts
│   │   └── notifications.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useCountdown.ts
│   │   ├── useMatchPolling.ts
│   │   ├── useCarousel.ts
│   │   └── usePushNotifications.ts
│   ├── types/
│   │   ├── api.ts                     # Trip.mode, Trip.expiresAt
│   │   ├── domain.ts
│   │   └── ws.ts
│   ├── lib/
│   │   ├── buildDirectionOptions.ts
│   │   ├── savings.ts
│   │   ├── formatters.ts
│   │   ├── firebase.ts
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
VITE_FCM_VAPID_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_API_KEY=xxxxxxxxxxxxxxxx
VITE_FIREBASE_PROJECT_ID=flot-app
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
VITE_FIREBASE_APP_ID=x:xxxxxxxxxxxx:web:xxxxxxxxxxxxxx
```

---

## CODING STANDARDS

1. **TypeScript strict** — no `any`, no `as` casts except for library gaps. All props interfaces defined.
2. **Functional components only** — hooks for all state and effects.
3. **CSS Modules** — one `.module.css` per component. All values via `var(--token)` from `design-tokens.css`. No inline styles, no hardcoded values.
4. **Barrel exports** — every folder gets an `index.ts`.
5. **Small files** — one component per file, max ~150 lines. Extract sub-components when needed.
6. **Zod schemas** — mirror backend validation on frontend for instant feedback.
7. **Error boundaries** — wrap each screen.
8. **Loading states** — skeleton or spinner for every async operation.
9. **Accessibility** — ARIA labels, focus management on sheets and modals, keyboard navigation.
10. **No console.log** — structured logger utility in production.

---

## DEVELOPMENT SEQUENCE

### Sprint 1 — Foundation [DONE]
1. Vite + React + TypeScript scaffold
2. `colors_and_type.css` → `src/styles/design-tokens.css`, import globally
3. Convert `MalpensaComponents.jsx` → TypeScript: MIcon, MBtn, MSegment, MStepper, MPill, MDestInput
4. Layout components: TopNav, HomeIndicator, GradientCTA, BottomSheet
5. Router setup (React Router v6, lazy routes)
6. Entry Point screen (static, no auth)

### Sprint 2 — Auth + Check-in [DONE]
7. Amplify auth (Cognito Google + Apple)
8. `authStore` + `useAuth` hook
9. Entry Point connected to Cognito (copy v3)
10. `api.ts` — ky instance with auth interceptor
11. `airportStore` + `GET /airports` + AirportPicker screen
12. Travel Check-in screen (mode toggle + flightTime picker + form)
13. `POST /trips` integration (mode scheduled/live)
14. Trip Scheduled screen
15. Bottom Tab Bar

### Sprint 3 — My Trips + Notifications
16. My Trips screen + `GET /trips/my`
17. Trip cancellation (`DELETE /trips/:tripId`)
18. Push notification setup (Firebase + service worker)
19. `usePushNotifications` hook + PushPrompt component
20. Push token registration (`PUT /users/me/push-token`)
21. In-app notification Toast
22. WebSocket service (connect, reconnect, heartbeat, event dispatch)
23. `useWebSocket` hook
24. Active Search screen (solo Live mode)
25. Match Locked screen (blurred partner, unlock CTA)
26. Fake Door modal

### Sprint 4 — Unlock + Chat + Profile
27. Stripe Elements + PaymentSheet
28. Unlock flow (`POST /trips/:tripId/unlock` → Stripe → navigate)
29. Connection Unlocked screen (partner profile, meeting point)
30. Chat (ChatSheet, real-time via WebSocket)
31. No Match Found screen
32. Profile screen (toggles notifiche, account, supporto, logout)
33. Identity Verification screen (Stripe Identity SDK)

### Sprint 5 — Polish
34. i18n (IT + EN) — tutte le stringhe nuove
35. PWA (manifest, service worker, offline fallback, push)
36. Framer Motion page transitions + micro-interactions
37. Error boundaries e error states
38. Loading skeletons
39. Unit tests (Vitest + RTL + MSW)
40. E2E happy-path (Playwright) — flusso Scheduled + Live

---

## IMPORTANT RULES

- **FLOT/ è il design authority per stili e componenti.** Per copy e flusso, questo prompt ha priorità.
- **Never hardcode airport-specific data** — leggi sempre da `airportStore.selectedAirport`.
- **All prices are dynamic** — savings, unlock fee, base fare da airport config. Formatta con `airport.currency`.
- **`airportCode` always sent** con trip creation.
- **No phone frame** — strip `.phone` wrapper dai mockup. App fills `100dvh`.
- **Safe areas** — `env(safe-area-inset-*)` per notch e home indicator.
- **Minimum touch targets** — 44×44px (Apple HIG).
- **No pull-to-refresh** — prevent default on body.
- **Photo blur is server-side** — mai mostrare foto non blurrata prima di unlock reciproco.
- **FAKE_DOOR_MODE** — quando `VITE_FAKE_DOOR_MODE=true`, unlock mostra "Coming soon" modal.
- **Scheduled mode è il default.** Toggle in Travel Check-in pre-seleziona "Schedule".
- **Push notifications critiche per Scheduled.** PushPrompt appare su TripScheduled e come banner persistente in MyTrips se non concesse.
- **Deep linking** — push notification apre direttamente `/match/:matchId`.
- **Trip cancellation** — solo trip `scheduled` cancellabili. Trip `matched` o `unlocked`: errore 400.
- `npm run dev` = run. `npm run build` = build. `npm run test` = test.

---

## PERFORMANCE TARGETS

- Lighthouse Mobile: ≥ 90 Performance, 100 Accessibility
- First Contentful Paint: < 1.5s on 4G
- Time to Interactive: < 3s on 4G
- Bundle: < 150KB gzipped (Stripe.js async on MatchLocked only, Firebase async on TripScheduled)

---

*Flot Frontend DEFINITIVO — v3 Scheduled-First MVP — Aprile 2026*

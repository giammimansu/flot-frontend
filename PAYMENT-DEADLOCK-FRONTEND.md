# Flot — Frontend: Payment Deadlock Resolution (Smart Auto-Capture)

> **File di contesto**: leggi `FLOT-README.md`, `CLAUDE-CODE-FRONTEND-PROMPT-DEFINITIVO.md` e `PAYMENT-DEADLOCK-BACKEND.md` prima di iniziare.
> Questo file **non sostituisce** il prompt frontend definitivo. Lo estende con le modifiche alla UI per il Payment Deadlock.
> Gli sprint esistenti (1–5) restano invariati. Qui si aggiungono sprint nuovi.

---

## Task

Implementa le modifiche frontend per il sistema **Smart Auto-Capture**. Il criterio di successo è: la schermata Match Locked mostra tre stati visivamente distinti (`pending`, `partially_unlocked` da me, `partially_unlocked` dall'altro), il trust copy "Charged only when both unlock" è visibile prima del CTA, e il countdown con pressione sociale appare quando il partner ha già sbloccato — il tutto senza aggiungere step al funnel rispetto alla v3.

Dimmi il tuo piano in massimo 6 step. Inizia a scrivere codice solo dopo che ti ho confermato il piano.

Se devi rompere una delle regole definite in questo documento o nel prompt frontend definitivo, fermati e dimmelo.

---

## Contesto del problema

### Cos'è il Payment Deadlock (lato utente)

L'utente vede il match, vede il bottone "Unlock for €0.99", e si chiede: "E se pago e l'altro no?". Questo dubbio blocca la conversione. La soluzione è **eliminare la percezione di rischio** con copy, feedback visivo e pressione sociale naturale — senza aggiungere step.

### Cosa cambia nell'esperienza utente

| Elemento | v3 (prima) | Smart Auto-Capture (dopo) |
|----------|-----------|--------------------------|
| Match Locked screen | 1 stato ("pending") | 3 stati visivi distinti |
| Trust copy | Assente | "Charged only when both unlock" prominente |
| Dopo il mio unlock | "Processing…" → redirect | "You're in!" + countdown attesa partner |
| Notifica partner unlock | Assente | "[Nome] ha sbloccato!" con CTA urgente |
| Timeout | Assente | Auto-void + "Nessun addebito" + re-pool |
| Reminder | Assente | Push/email escalanti a intervalli configurabili |

---

## API Contract — Aggiornamenti

### `GET /matches/:matchId` — Response aggiornata

```json
// Stato: pending (nessuno ha sbloccato)
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
  "unlockedBy": [],
  "unlockDeadline": null,
  "myUnlockStatus": "not_unlocked"
}

// Stato: partially_unlocked — IO ho sbloccato
{
  "matchId": "match_xyz",
  "status": "partially_unlocked",
  "savings": 60.00,
  "partner": {
    "firstName": "Marco",
    "blurredPhotoUrl": "https://cdn.flot.app/photos/blurred/...",
    "destination": "Milano Centrale",
    "verified": true
  },
  "unlockedBy": ["user_123"],
  "unlockDeadline": "2026-05-04T16:30:00Z",
  "myUnlockStatus": "unlocked_waiting"
}

// Stato: partially_unlocked — L'ALTRO ha sbloccato
{
  "matchId": "match_xyz",
  "status": "partially_unlocked",
  "savings": 60.00,
  "partner": {
    "firstName": "Marco",
    "blurredPhotoUrl": "https://cdn.flot.app/photos/blurred/...",
    "destination": "Milano Centrale",
    "verified": true
  },
  "unlockedBy": ["user_456"],
  "unlockDeadline": "2026-05-04T16:30:00Z",
  "myUnlockStatus": "partner_waiting"
}

// Stato: unlock_expired — timeout scaduto
{
  "matchId": "match_xyz",
  "status": "unlock_expired",
  "savings": 60.00,
  "partner": { ... },
  "dissolveReason": "partner_no_response",
  "myUnlockStatus": "expired"
}
```

### `POST /trips/:tripId/unlock` — Response aggiornata

```json
// Primo unlock
{
  "paymentIntentClientSecret": "pi_xxx_secret_yyy",
  "amount": 99,
  "currency": "eur",
  "matchStatus": "partially_unlocked"
}

// Secondo unlock
{
  "paymentIntentClientSecret": "pi_xxx_secret_yyy",
  "amount": 99,
  "currency": "eur",
  "matchStatus": "unlocked"
}
```

### WebSocket — Nuovi eventi

```json
// Partner ha sbloccato (ricevuto dall'altro utente)
{
  "event": "partner_unlocked",
  "data": {
    "matchId": "match_xyz",
    "partnerName": "Marco",
    "deadline": "2026-05-04T16:30:00Z"
  }
}

// Timeout unlock scaduto
{
  "event": "unlock_expired",
  "data": {
    "matchId": "match_xyz",
    "reason": "partner_no_response"
  }
}

// Match dissolto
{
  "event": "match_dissolved",
  "data": {
    "matchId": "match_xyz",
    "reason": "no_response"
  }
}
```

---

## Schermata: Match Locked — Tre stati visivi

### Stato 1 — `pending` (nessuno ha sbloccato)

Questa è la schermata base, molto simile alla v3. Le modifiche sono:

**Trust badge PRIMA del CTA** (posizionato tra la card partner e il bottone Unlock):

```
┌──────────────────────────────────────────┐
│  🛡  Charged only when both unlock.      │
│     No mutual unlock = no charge. Ever.  │
└──────────────────────────────────────────┘
```

Specifiche:
- Card `success-soft` background, bordo `rgba(22,163,74,0.20)`, border-radius 16px
- Padding 12px 16px
- Icona shield 18px su cerchio `success-soft` 32px
- Testo principale: Inter 13px/600 `--success`
- Sottotesto: Inter 11px `#16A34A`
- Animazione: fadeUp 400ms 300ms delay (appare dopo la card partner)

**CTA invariato**: "Unlock for €0.99" (GradientCTA amber)

**Info sotto CTA**: "You pay €0.99 · Your partner pays €0.99 · Taxi fare split is between you" (11px/ink-muted)

---

### Stato 2 — `partially_unlocked` + `myUnlockStatus: "unlocked_waiting"` (IO ho sbloccato)

Dopo che l'utente preme Unlock e Stripe conferma l'auth, la schermata si trasforma:

**Sostituzione del CTA con conferma + countdown**:

```
┌──────────────────────────────────────────┐
│                                          │
│        ✓ You're in!                      │  ← Bricolage 24px/800, success
│                                          │
│   ┌─────────────────────────────┐        │
│   │                             │        │
│   │     [Avatar partner blur]   │        │
│   │         ◷ 1h 42m            │        │  ← Countdown circolare
│   │                             │        │
│   └─────────────────────────────┘        │
│                                          │
│   Waiting for Marco to unlock…           │  ← Inter 14px/500/ink
│   We've notified them via push & email   │  ← Inter 12px/ink-muted
│                                          │
│   ┌────────────────────────────────────┐ │
│   │  🛡  No charge if they don't       │ │
│   │     respond in time. Guaranteed.   │ │
│   └────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

Specifiche:

**Checkmark animato**: stessa animazione `checkPop` di TripScheduled (scale 0→1.15→1, 600ms, cerchio success 64px con check bianco 28px)

**Countdown circolare**: 
- Cerchio SVG 100px, stroke `--amber` su sfondo `--surface-2`, stroke-dasharray animato
- Tempo rimanente al centro: Bricolage 20px/700/ink, formato `Xh Ym`
- Usa `useCountdown(unlockDeadline)` — hook già esistente, riutilizzare
- Sotto il cerchio: avatar partner blurred 48px con badge "notified" (dot amber pulsante)

**Trust reassurance card**: `success-soft`, icona shield, "No charge if they don't respond in time. Guaranteed."

**Link secondario** (sotto tutto, 12px/ink-subtle): "Cancel unlock" → dialog conferma → `POST /matches/:matchId/cancel-unlock` (void auth, torna a pending)

**Animazioni**:
- Check pop: 600ms cubic-bezier(0.22,0.61,0.36,1)
- Countdown fade-in: 400ms 200ms delay
- Trust card: fadeUp 400ms 400ms delay
- Transizione dal CTA al check: crossfade 300ms

---

### Stato 3 — `partially_unlocked` + `myUnlockStatus: "partner_waiting"` (L'ALTRO ha sbloccato)

L'utente apre il match e vede che il partner ha già sbloccato:

```
┌──────────────────────────────────────────┐
│                                          │
│   ┌────────────────────────────────────┐ │
│   │  ✓  Marco has unlocked!            │ │  ← Badge success prominente
│   │     Unlock too to share the ride   │ │
│   └────────────────────────────────────┘ │
│                                          │
│   [...card partner blurred invariata...] │
│                                          │
│   ┌────────────────────────────────────┐ │
│   │  🛡  Charged only when both unlock │ │
│   └────────────────────────────────────┘ │
│                                          │
│   ╔════════════════════════════════════╗ │
│   ║                                    ║ │
│   ║   🔓 Unlock now — Marco is         ║ │  ← CTA enfatizzato
│   ║      waiting! · €0.99              ║ │
│   ║                                    ║ │
│   ╚════════════════════════════════════╝ │
│                                          │
│        ◷ 1h 42m left to unlock          │  ← countdown lineare
│                                          │
└──────────────────────────────────────────┘
```

Specifiche:

**Banner "Partner has unlocked"**:
- Card `success-soft`, border-radius 20px, padding 14px 18px
- Icona check su cerchio `success` 36px
- H3: "[Nome] has unlocked!" — Bricolage 17px/700/success
- Sub: "Unlock too to share the ride" — Inter 13px/ink-muted
- Animazione: slideDown 400ms con bounce leggero

**CTA enfatizzato**:
- GradientCTA ma con bordo pulsante `--success` (keyframe `pulseGlow`)
- Testo: "Unlock now — [Nome] is waiting! · €0.99"
- Icona lock-open a sinistra
- Shadow extra: `0 0 20px rgba(22,163,74,0.25)` pulsante

**Countdown lineare** (sotto il CTA):
- Progress bar orizzontale, `--amber` su `--surface-2`, altezza 4px, border-radius 2px
- Testo: "X h Y min left to unlock" — Inter 12px/500/ink-muted
- La barra si svuota progressivamente da destra a sinistra

**Animazione CTA pulsante**:
```css
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.3); }
  50% { box-shadow: 0 0 20px 4px rgba(22,163,74,0.15); }
}
.cta-partner-waiting {
  animation: pulseGlow 2s ease-in-out infinite;
}
```

---

### Stato 4 — `unlock_expired` (timeout scaduto)

```
┌──────────────────────────────────────────┐
│                                          │
│        ⏰ Match expired                  │  ← Bricolage 24px/800/ink
│                                          │
│   Your partner didn't respond in time.   │  ← Inter 14px/ink-muted
│                                          │
│   ┌────────────────────────────────────┐ │
│   │  🛡  No charge applied.            │ │
│   │     Your €0.99 was never captured. │ │
│   └────────────────────────────────────┘ │
│                                          │
│   ┌────────────────────────────────────┐ │
│   │ 🔍 We're looking for a new match   │ │
│   │    You'll be notified when we      │ │
│   │    find someone else.              │ │
│   └────────────────────────────────────┘ │
│                                          │
│   [ Go to My Trips ]   [ New Trip ]      │
│                                          │
└──────────────────────────────────────────┘
```

Specifiche:
- Header con icona clock 48px su cerchio `surface-2`
- Trust card `success-soft`: "No charge applied. Your €0.99 was never captured."
- Info card `surface-1` bordo hairline: "We're looking for a new match" con icona search animata (rotate lenta)
- Bottoni: MBtn dark "Go to My Trips" + MBtn outline "New Trip"
- Se `unlock_repool_enabled = false`: nascondere la card "looking for new match"

---

## Componenti — Nuovi e aggiornati

### `UnlockCountdown` — NUOVO

```typescript
// src/components/matches/UnlockCountdown.tsx

interface UnlockCountdownProps {
  deadline: string;                    // ISO 8601
  variant: 'circular' | 'linear';     // circular per stato 2, linear per stato 3
  onExpired?: () => void;
}
```

- `circular`: SVG cerchio con stroke animato + tempo al centro
- `linear`: progress bar orizzontale + testo
- Usa `useCountdown` hook esistente
- Chiama `onExpired` quando il countdown raggiunge zero → refetch match status

### `TrustBadge` — NUOVO

```typescript
// src/components/matches/TrustBadge.tsx

interface TrustBadgeProps {
  variant: 'pre-unlock' | 'waiting' | 'expired';
}

// pre-unlock: "Charged only when both unlock"
// waiting:    "No charge if they don't respond in time"
// expired:    "No charge applied. Your €0.99 was never captured."
```

- Card `success-soft` con icona shield
- Copy diversa per ogni variante
- Animazione fadeUp al mount

### `PartnerUnlockedBanner` — NUOVO

```typescript
// src/components/matches/PartnerUnlockedBanner.tsx

interface PartnerUnlockedBannerProps {
  partnerName: string;
}
```

- Banner `success-soft` con check animato
- "[Nome] has unlocked!" + sub copy
- Animazione slideDown al mount

### `MatchLocked` screen — AGGIORNATO

```typescript
// src/screens/MatchLocked.tsx — logica di rendering condizionale

const MatchLocked = () => {
  const { matchId } = useParams();
  const { data: match, refetch } = useMatch(matchId);
  const { user } = useAuth();

  // Determina lo stato visivo
  const getViewState = () => {
    if (match.status === 'pending') return 'pending';
    if (match.status === 'unlock_expired') return 'expired';
    if (match.status === 'partially_unlocked') {
      return match.myUnlockStatus === 'unlocked_waiting'
        ? 'i_unlocked'
        : 'partner_unlocked';
    }
    if (match.status === 'unlocked') {
      // Redirect a Connection Unlocked
      navigate(`/connection/${matchId}`);
      return null;
    }
    return 'pending';
  };

  const viewState = getViewState();

  // WebSocket: ascolta eventi di stato
  useWebSocket({
    events: {
      partner_unlocked: () => refetch(),
      match_unlocked: () => navigate(`/connection/${matchId}`),
      unlock_expired: () => refetch(),
      match_dissolved: () => refetch(),
    },
  });

  return (
    <>
      {viewState === 'pending' && <PendingView match={match} />}
      {viewState === 'i_unlocked' && <IUnlockedView match={match} />}
      {viewState === 'partner_unlocked' && <PartnerUnlockedView match={match} />}
      {viewState === 'expired' && <ExpiredView match={match} />}
    </>
  );
};
```

---

## Store — Aggiornamenti

### `matchStore.ts` — nuovi campi

```typescript
// src/stores/matchStore.ts

interface MatchState {
  // ... campi esistenti ...
  unlockDeadline: string | null;       // NUOVO
  myUnlockStatus: 'not_unlocked' | 'unlocked_waiting' | 'partner_waiting' | 'expired';  // NUOVO
}
```

### `notificationStore.ts` — nuovi tipi notifica

```typescript
type NotificationType =
  | 'match_found'
  | 'partner_unlocked'      // NUOVO — partner ha sbloccato
  | 'unlock_expired_payer'  // NUOVO — timeout, tu avevi pagato, nessun addebito
  | 'unlock_expired_non_payer' // NUOVO — timeout, tu non avevi risposto
  | 'unlock_reminder'       // NUOVO — reminder dal sistema
  | 'match_dissolved';      // NUOVO — match dissolto
```

---

## Toast Notifications — Nuovi messaggi

### Quando arriva `partner_unlocked` via WebSocket (utente ha app aperta)

```
┌──────────────────────────────────────┐
│  🔓  Marco has unlocked!             │
│  Tap to unlock and share the ride   │
│                              [View] │
└──────────────────────────────────────┘
```

- Toast `success` variant (bordo verde)
- Auto-dismiss: 10s (più lungo del normale — è un'azione critica)
- Tap → naviga a `/match/:matchId`

### Quando arriva `unlock_expired` via WebSocket

```
┌──────────────────────────────────────┐
│  ⏰  Match expired                    │
│  No charge. We're looking for        │
│  a new partner.                      │
│                         [My Trips]   │
└──────────────────────────────────────┘
```

- Toast `neutral` variant
- Auto-dismiss: 8s
- Tap → naviga a `/my-trips`

---

## Push Notification — Deep link handling

Le push notification per `partner_unlocked` e `unlock_reminder` contengono `{ matchId, action: "open_match" }`. Il service worker e il foreground handler devono navigare a `/match/:matchId`, dove la schermata si renderizza nello stato corretto automaticamente.

```typescript
// src/services/pushNotifications.ts — AGGIORNATO

export function setupForegroundNotifications() {
  onMessage(messaging, (payload) => {
    const { title, body, data } = payload.notification!;

    // Mostra toast in-app
    showToast({
      title,
      body,
      variant: data?.action === 'open_match' ? 'success' : 'default',
      action: data?.matchId
        ? { label: 'View', onClick: () => navigate(`/match/${data.matchId}`) }
        : undefined,
      duration: data?.action === 'open_match' ? 10000 : 5000,
    });
  });
}
```

---

## My Trips — Aggiornamenti StatusBadge

```typescript
const statusConfig = {
  // ... stati esistenti ...
  partially_unlocked: {
    label: 'In attesa partner',
    bg: '#FFF7ED',                     // amber-soft più chiaro
    color: '#92400E',
    dot: true,                          // dot pulsante
    icon: 'clock',
  },
  unlock_expired: {
    label: 'Sblocco scaduto',
    bg: 'var(--surface-2)',
    color: 'var(--ink-muted)',
    icon: 'clock',
  },
  dissolved: {
    label: 'Annullato',
    bg: 'var(--surface-2)',
    color: 'var(--ink-subtle)',
  },
};
```

Nella `TripCard`, per trip con match `partially_unlocked`:
- Se `myUnlockStatus === 'unlocked_waiting'`: badge "In attesa partner" con sotto "Il tuo partner ha [X min] per sbloccare"
- Se `myUnlockStatus === 'partner_waiting'`: badge con CTA inline "Sblocca ora!"

---

## Animazioni — Specifiche CSS

```css
/* src/components/matches/MatchLocked.module.css */

/* Transizione tra stati della schermata */
.stateTransition {
  animation: crossfade 300ms var(--ease-out);
}

@keyframes crossfade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* CTA pulsante quando partner ha sbloccato */
.ctaPartnerWaiting {
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.3); }
  50% { box-shadow: 0 0 20px 4px rgba(22,163,74,0.15); }
}

/* Countdown circolare */
.countdownCircle {
  transform: rotate(-90deg);
  transform-origin: center;
}

.countdownStroke {
  stroke: var(--amber);
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.countdownBg {
  stroke: var(--surface-2);
}

/* Progress bar lineare */
.progressBar {
  height: 4px;
  border-radius: 2px;
  background: var(--surface-2);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: var(--amber);
  border-radius: 2px;
  transition: width 1s linear;
}

/* Banner partner unlocked */
.partnerBanner {
  animation: slideDown 400ms var(--ease-out);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## i18n — Nuove stringhe

```json
// src/i18n/en.json — aggiunte
{
  "match": {
    "trustBadge": {
      "preUnlock": "Charged only when both unlock. No mutual unlock = no charge. Ever.",
      "waiting": "No charge if they don't respond in time. Guaranteed.",
      "expired": "No charge applied. Your €0.99 was never captured."
    },
    "partnerUnlocked": {
      "title": "{{name}} has unlocked!",
      "subtitle": "Unlock too to share the ride",
      "ctaLabel": "Unlock now — {{name}} is waiting!",
      "countdownLabel": "{{time}} left to unlock"
    },
    "iUnlocked": {
      "title": "You're in!",
      "waitingFor": "Waiting for {{name}} to unlock…",
      "notified": "We've notified them via push & email",
      "cancelLink": "Cancel unlock"
    },
    "expired": {
      "title": "Match expired",
      "subtitle": "Your partner didn't respond in time.",
      "noCharge": "No charge applied. Your €0.99 was never captured.",
      "lookingNew": "We're looking for a new match. You'll be notified when we find someone else.",
      "goToTrips": "Go to My Trips",
      "newTrip": "New Trip"
    },
    "cancelUnlockConfirm": {
      "title": "Cancel unlock?",
      "body": "Your hold will be released and you'll go back to the match screen.",
      "confirm": "Yes, cancel",
      "dismiss": "Keep waiting"
    }
  }
}
```

```json
// src/i18n/it.json — aggiunte
{
  "match": {
    "trustBadge": {
      "preUnlock": "Addebito solo quando entrambi sbloccano. Nessun addebito se non reciproco. Mai.",
      "waiting": "Nessun addebito se non rispondono in tempo. Garantito.",
      "expired": "Nessun addebito effettuato. I tuoi €0.99 non sono mai stati prelevati."
    },
    "partnerUnlocked": {
      "title": "{{name}} ha sbloccato!",
      "subtitle": "Sblocca anche tu per condividere il taxi",
      "ctaLabel": "Sblocca ora — {{name}} ti sta aspettando!",
      "countdownLabel": "{{time}} rimanenti per sbloccare"
    },
    "iUnlocked": {
      "title": "Ci sei!",
      "waitingFor": "In attesa che {{name}} sblocchi…",
      "notified": "Lo abbiamo avvisato via push ed email",
      "cancelLink": "Annulla sblocco"
    },
    "expired": {
      "title": "Match scaduto",
      "subtitle": "Il tuo partner non ha risposto in tempo.",
      "noCharge": "Nessun addebito effettuato. I tuoi €0.99 non sono mai stati prelevati.",
      "lookingNew": "Stiamo cercando un nuovo match. Ti avviseremo appena troviamo qualcun altro.",
      "goToTrips": "I miei viaggi",
      "newTrip": "Nuovo viaggio"
    },
    "cancelUnlockConfirm": {
      "title": "Annullare lo sblocco?",
      "body": "Il blocco sulla carta verrà rilasciato e tornerai alla schermata del match.",
      "confirm": "Sì, annulla",
      "dismiss": "Continua ad aspettare"
    }
  }
}
```

---

## File Structure — Nuovi file

```
flot-web/
├── src/
│   ├── components/
│   │   ├── matches/
│   │   │   ├── TrustBadge.tsx              # NUOVO
│   │   │   ├── TrustBadge.module.css       # NUOVO
│   │   │   ├── UnlockCountdown.tsx         # NUOVO
│   │   │   ├── UnlockCountdown.module.css  # NUOVO
│   │   │   ├── PartnerUnlockedBanner.tsx   # NUOVO
│   │   │   ├── PartnerUnlockedBanner.module.css  # NUOVO
│   │   │   ├── IUnlockedView.tsx           # NUOVO — stato "io ho sbloccato"
│   │   │   ├── IUnlockedView.module.css    # NUOVO
│   │   │   ├── PartnerUnlockedView.tsx     # NUOVO — stato "partner ha sbloccato"
│   │   │   ├── PartnerUnlockedView.module.css    # NUOVO
│   │   │   ├── ExpiredView.tsx             # NUOVO — stato timeout
│   │   │   ├── ExpiredView.module.css      # NUOVO
│   │   │   └── index.ts                    # NUOVO — barrel export
│   │   └── trips/
│   │       └── TripStatusBadge.tsx         # AGGIORNATO — nuovi stati
│   ├── screens/
│   │   └── MatchLocked.tsx                 # AGGIORNATO — 3 stati visivi
│   ├── stores/
│   │   ├── matchStore.ts                   # AGGIORNATO — nuovi campi
│   │   └── notificationStore.ts            # AGGIORNATO — nuovi tipi
│   ├── hooks/
│   │   └── useUnlockState.ts              # NUOVO — logica di stato unlock
│   ├── types/
│   │   └── api.ts                          # AGGIORNATO — Match.myUnlockStatus
│   └── i18n/
│       ├── en.json                         # AGGIORNATO — stringhe unlock
│       └── it.json                         # AGGIORNATO — stringhe unlock
├── tests/
│   ├── unit/
│   │   ├── MatchLocked.test.tsx            # NUOVO — test stati visivi
│   │   ├── UnlockCountdown.test.tsx        # NUOVO — test countdown
│   │   └── TrustBadge.test.tsx             # NUOVO
```

---

## Regole — Payment Deadlock frontend specifiche

- **Zero step aggiuntivi nel funnel.** Il bottone "Unlock" è identico alla v3. La differenza è solo nel feedback post-click e nel copy pre-click.
- **Il trust badge è SEMPRE visibile** prima del CTA Unlock, in tutti gli stati. È la prima cosa che l'utente legge prima di prendere la decisione.
- **La transizione tra stati è animata** ma non deve bloccare l'interazione. Nessun loader > 300ms.
- **Il countdown non deve creare ansia.** Il tono è rassicurante ("We've notified them"), non urgente ("Hurry!"). L'urgenza la crea solo il CTA quando il partner ha già sbloccato.
- **Tutti i valori (timeout, currency, fee) sono dinamici** — letti da `match` response e `airport` config. Mai hardcoded.
- **FAKE_DOOR_MODE**: quando attivo, il trust badge resta visibile ma l'unlock mostra la modale "Coming soon" come in v3. Lo stato `partially_unlocked` non viene mai raggiunto.
- **WebSocket è il canale primario** per le transizioni di stato in real-time. Il polling è fallback — refetch ogni 30s solo se WebSocket è disconnesso.
- **Deep link dalle push**: la navigazione a `/match/:matchId` deve funzionare anche se l'app è chiusa. Il service worker gestisce il click sulla notifica.

---

## DEVELOPMENT SEQUENCE — Nuovi Sprint

> Gli sprint 1–5 del prompt frontend definitivo restano invariati. Questi sprint si aggiungono dopo.

### Sprint 6 — Payment Deadlock UI (Week 11-12)

41. `TrustBadge` component (3 varianti: pre-unlock, waiting, expired)
42. `UnlockCountdown` component (circular + linear variants) — riusa `useCountdown` hook
43. `PartnerUnlockedBanner` component con animazione slideDown
44. `IUnlockedView` — vista "io ho sbloccato, aspetto partner" con countdown circolare
45. `PartnerUnlockedView` — vista "partner ha sbloccato" con CTA enfatizzato + countdown lineare
46. `ExpiredView` — vista timeout con rassicurazione zero-addebito
47. `MatchLocked` screen aggiornato — routing condizionale tra i 4 stati visivi
48. `useUnlockState` hook — logica di stato unlock derivata da match data
49. `matchStore` aggiornato — nuovi campi `unlockDeadline`, `myUnlockStatus`
50. WebSocket handler per `partner_unlocked`, `unlock_expired`, `match_dissolved`
51. Toast notifications per eventi unlock in foreground
52. Push notification deep link per `partner_unlocked` e `unlock_reminder`
53. `TripStatusBadge` aggiornato — nuovi stati `partially_unlocked`, `unlock_expired`, `dissolved`
54. `TripCard` aggiornato — CTA inline per `partner_waiting`, info countdown per `unlocked_waiting`
55. i18n: stringhe IT + EN per tutti i nuovi stati
56. CSS animations: `pulseGlow`, `crossfade`, `slideDown`, countdown stroke
57. Unit test: `MatchLocked` 4 stati, `UnlockCountdown` zero-behavior, `TrustBadge` varianti
58. Integration test: flusso unlock → waiting → partner_unlocked (via WS mock) → unlocked → redirect

---

*Flot Frontend — Payment Deadlock Resolution — Maggio 2026*

# Flot — Product README

> **Prima di iniziare qualsiasi attività, leggi questo file dall'inizio alla fine.**
> È il context file ufficiale del progetto. Contiene tutto quello che serve per lavorare su Flot senza fare domande ovvie.

---

## Cos'è Flot

Flot è un servizio di **taxi-pooling da aeroporti**. Non è un servizio di taxi. Non è un'app di trasporto. È un servizio di **matching tra persone** che stanno già prendendo un taxi fisso nella stessa direzione.

L'utente apre Flot, inserisce i dettagli del suo viaggio, e noi gli troviamo qualcuno con cui condividere il taxi e dividere il costo. Il taxista lo chiamano loro, lo pagano loro, direttamente. Flot non tocca mai la corsa.

**Modello legale**: vendiamo un'obbligazione di mezzi (servizio di connessione), non un servizio di trasporto. Questo è non negoziabile e deve riflettersi in ogni copy dell'app.

---

## Il problema che risolviamo

Un taxi da Milano Malpensa a Milano centro costa circa **€120 a corsa fissa**. Spesso ci sono due o più persone che prendono taxi separati verso la stessa zona. Flot le mette in contatto in anticipo, così condividono un unico taxi e dividono la spesa: **~€60 a testa invece di €120**.

---

## Revenue model

| Prodotto | Prezzo | Quando si paga |
|---------|--------|----------------|
| **Trip Pass** | €0.99 | Solo se il match viene trovato e sbloccato |
| **PRO** | €4.99/mese | Subscription mensile per funzionalità avanzate |

Il principio chiave: **nessun match, nessun addebito. Mai.** Questo è un elemento di trust fondamentale e va comunicato in ogni touchpoint.

---

## Fase attuale

**MVP — Scheduled-First con Fake Door Test.**

Il Fake Door Test serve a validare l'intenzione di pagare prima di costruire il backend completo. Quando l'utente clicca "Sblocca" e arriva al pagamento, vede una modale "Coming soon" invece di Stripe. L'intento viene registrato. Nessun addebito reale avviene.

La variabile d'ambiente `VITE_FAKE_DOOR_MODE=true` controlla questo comportamento.

---

## Airport MVP

**Milano Malpensa (MXP)** — unico aeroporto attivo in questa fase.

L'architettura è multi-aeroporto dal giorno 1: aggiungere un nuovo aeroporto richiede solo una nuova entry nel registry `AIRPORTS` in `airports.py`, senza modifiche al codice.

---

## Le due modalità di servizio

### Modalità Scheduled (primaria, default)

L'utente sa quando atterrerà. Prenota il ride-share in anticipo (fino a 7 giorni prima), specificando data e ora del volo. Il sistema accumula domanda nel tempo e un **job di background** (MatchmakerFunction) gira ogni 5 minuti cercando match nella finestra temporale di ±60 minuti.

Quando viene trovato un match, l'utente riceve:
1. Push notification (anche con app chiusa, via Firebase/SNS)
2. Email (sempre, come fallback)
3. WebSocket push (se ha l'app aperta)

Questa è la modalità con la probabilità di match più alta, soprattutto in fase MVP con bassa densità di utenti.

### Modalità Live (secondaria, opzionale)

L'utente è già in aeroporto. Apre l'app, cerca un partner "adesso". Il radar gira per **5 minuti** (countdown visibile). Se non trova nessuno entro il timeout, il trip scade. Il matching è sincrono e avviene al momento della creazione del trip.

---

## Ciclo di vita di un trip

```
SCHEDULED:
  created → status: "scheduled"
    → Matchmaker job ogni 5 min cerca candidati (±60 min flightTime)
    → match trovato → status: "matched" → notifica push + email + WS
    → nessun match → resta "scheduled" fino a flightTime + 2h → status: "expired"

LIVE:
  created → status: "searching"
    → matching sincrono all'atto della creazione
    → match trovato → status: "matched" → notifica WS
    → timeout 5 min → status: "expired"

MATCH TROVATO (entrambe le modalità):
  → Utente A clicca "Sblocca" → PaymentIntent Stripe (capture_method: manual)
  → Utente B clicca "Sblocca" → PaymentIntent Stripe
  → Entrambi hanno autorizzato → capture di entrambi → status: "unlocked"
  → Solo uno dopo 24h → void dell'autorizzazione
  → status: "unlocked" → chat attiva + dettagli completi partner
  → dopo il viaggio → status: "completed"
```

---

## L'algoritmo di matching

Il matching si basa su uno **score da 0 a 1** calcolato per ogni coppia di trip candidati. Per creare un match lo score deve superare la soglia `match_threshold = 0.25` (configurabile per aeroporto).

### Formula

```
Scheduled:  score = (0.6 × distance_score) + (0.2 × time_score) + (0.2 × profile_score)
Live:       score = (0.5 × distance_score) + (0.3 × time_score) + (0.2 × profile_score)
```

La distanza pesa di più in modalità Scheduled perché la finestra temporale è già ampia per definizione.

### Distance score (Haversine GPS — coordinate reali)

| Distanza tra destinazioni | Score |
|--------------------------|-------|
| ≤ 2 km | 1.0 |
| ≤ 5 km | 0.8 |
| ≤ 10 km | 0.5 |
| ≤ 20 km | 0.2 |
| > 20 km | 0.0 |

Le zone predefinite (`centro`, `nord`, ecc.) esistono solo per la UI (landmarks, airport picker). Il matching usa **coordinate GPS reali** passate da Google Places Autocomplete.

### Time score (bucket da 10 minuti)

| Delta temporale | Score |
|----------------|-------|
| Stesso bucket (0 min) | 1.0 |
| ±10 min | 0.7 |
| ±20 min | 0.4 |
| > 20 min | 0.0 |

### Profile score (bonus)

| Condizione | Bonus |
|------------|-------|
| Stessa lingua | +0.1 |
| Entrambi verified | +0.1 |

### Filtri binari pre-score

Prima del calcolo, ogni coppia deve superare tutti questi check:
1. **Stesso aeroporto** — garantito dalla struttura delle query GSI1
2. **Stessa direzione** — `TO_CITY` matcha solo con `TO_CITY`
3. **Compatibilità temporale** — il trip candidato deve avere `destLat`/`destLng` (trip senza GPS vengono scartati silenziosamente)

---

## Architettura tecnica — sintesi

### Frontend

```
React 18 + Vite 5 + TypeScript strict
CSS Modules + Design System da colors_and_type.css
Zustand (state), React Hook Form + Zod (forms)
AWS Amplify v6 (Cognito — Google + Apple login)
Stripe.js (pagamenti)
WebSocket nativo (API Gateway WebSocket)
Firebase Cloud Messaging (push notifications)
vite-plugin-pwa (service worker, offline, add to home screen)
Deploy: S3 + CloudFront
```

### Backend

```
Python 3.12 + AWS SAM (Serverless Application Model)
DynamoDB Single-Table Design (PAY_PER_REQUEST)
API Gateway REST + WebSocket
Cognito (auth), Stripe (pagamenti + identity), S3 + CloudFront (media)
EventBridge (eventi custom + scheduled rule per Matchmaker)
SNS (push notifications), SES (email)
Lambda Powertools (Logger, Tracer, Metrics)
```

### DynamoDB — Indici principali

| GSI | PK | SK | Uso |
|-----|----|----|-----|
| GSI1-TimeBucket | `airportCode#timeBucket` | `createdAt` | Query matching per bucket temporale |
| GSI2-UserTrips | `userId` | `createdAt` | Dashboard "My Trips" dell'utente |
| GSI5-TripStatus | `airportCode#status` | `flightTime` | Matchmaker job: trova tutti i trip `scheduled` per aeroporto |

---

## Schermate dell'app (flusso principale)

```
/ — Entry Point (login)
  ↓
/airport — Airport Picker (skip se 1 solo aeroporto attivo)
  ↓
/check-in — Travel Check-in (form: mode, terminal, direction, destination, flightTime, bags)
  ↓ mode = scheduled (default)          ↓ mode = live
/trip/:tripId — Trip Scheduled          /search — Active Search (radar 5 min)
  ↓ push/email quando match trovato       ↓ match o timeout
/match/:matchId — Match Locked          /match/:matchId — Match Locked
  ↓ sblocca (€0.99)                       ↓ sblocca (€0.99)
/connection/:matchId — Connection Unlocked (partner + chat)

Tab bar (sempre visibile dopo login):
  Home (/check-in) | My Trips (/my-trips) | Profile (/profile)
```

---

## Copy e tono di voce — regole non negoziabili

- **Non scrivere mai**: "prendi un taxi con Flot", "la tua corsa", "prenota un taxi"
- **Scrivere sempre**: "trova qualcuno con cui condividere il taxi", "vi incontrate e dividete il costo", "we don't drive you"
- La frase **"we don't drive you"** è obbligatoria in ogni versione dell'Entry Point
- Il risparmio si esprime sempre come **"~€60"** (la metà del costo fisso), non come percentuale
- **"No match? No charge. Ever."** — questa garanzia va mostrata prima dei bottoni di login

---

## Regole di sviluppo

- Non hardcodare **mai** dati specifici per aeroporto (terminal, zone, tariffe, label) fuori da `airports.py` (backend) o `airportStore` (frontend). Sempre.
- Ogni Trip e ogni Match **devono portare `airportCode`**. Le query di matching sono sempre scoped a un aeroporto.
- Il blur delle foto partner è **server-side** — mai mostrare foto non blurrate prima che entrambi abbiano sbloccato.
- Il Matchmaker **deve essere idempotente** — girare due volte sullo stesso dataset non deve creare match duplicati.
- Trip senza `destLat`/`destLng` (creati prima del GPS upgrade) vanno **esclusi silenziosamente** dal matching.
- **Mai usare `print()`** nel backend — solo `logger.info()` di Lambda Powertools.
- Tutti i float nei log e nelle response API vanno **arrotondati a 2-3 decimali**.
- `FAKE_DOOR_MODE=true` deve essere **sempre controllato** prima di eseguire capture Stripe.
- **`capture_method: 'manual'`** è obbligatorio per tutti i Trip Pass — mai capture immediato.
- TTL obbligatorio su: chat messages (48h dopo completamento), WebSocket connections (24h).
- Multi-entity updates in DynamoDB: **sempre `transact_write_items`**.

**Se devi rompere una di queste regole, fermati e dimmelo.**

---

## File di riferimento del progetto

| File | Contenuto |
|------|-----------|
| `CLAUDE-CODE-FRONTEND-PROMPT_v3-SCHEDULED.md` | Prompt completo frontend — flusso, schermate, stack, standards |
| `CLAUDE-CODE-BACKEND-PROMPT_v3-SCHEDULED.md` | Prompt completo backend — architettura, API, matching, payments |
| `MATCHING-GPS-UPGRADE-BACKEND.md` | Modifica al matching engine: da zone a GPS reali (Haversine) |
| `MATCHING-FEASIBILITY-ANALYSIS.md` | Analisi di fattibilità: probabilità di match, rischi, cold start |
| `FLOT/colors_and_type.css` | Design system — token CSS. Non hardcodare mai nessun valore che esiste qui |
| `FLOT/MalpensaComponents.jsx` | Libreria componenti UI (MIcon, MBtn, MSegment, MStepper, MPill, MDestInput) |
| `FLOT/*.html` | Mockup schermate — authority per stile e layout. Il prompt v3 ha priorità su copy e flusso |

---

## Environment variables — panoramica

```env
# Frontend
VITE_API_BASE_URL          REST API base URL
VITE_WS_URL                WebSocket URL
VITE_COGNITO_USER_POOL_ID  Cognito pool
VITE_COGNITO_CLIENT_ID     Cognito client
VITE_STRIPE_PUBLISHABLE_KEY
VITE_FAKE_DOOR_MODE        true | false
VITE_FCM_VAPID_KEY         Firebase push notifications
VITE_FIREBASE_PROJECT_ID

# Backend (SAM Parameters)
FAKE_DOOR_MODE             true | false
SNS_PLATFORM_ARN           Push notification platform
SES_FROM_EMAIL             noreply@flot.app
```

---

## Obiettivi di performance

| Metrica | Target |
|---------|--------|
| Lighthouse Mobile Performance | ≥ 90 |
| Lighthouse Accessibility | 100 |
| First Contentful Paint (4G) | < 1.5s |
| Time to Interactive (4G) | < 3s |
| Bundle size | < 150KB gzipped |

---

*Flot — README di progetto — Aprile 2026*
*Versione: v3 Scheduled-First MVP*
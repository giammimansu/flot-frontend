# Flot — Frontend Action Plan

> Data: 6 Giugno 2026
> Backend di riferimento: v4 Elastic & Predictive — P0+P1+P2 completi (vedi `flot-backend/FLOT-doc.html`)
> Scopo: allineare il frontend (React 19 + Vite + Zustand + Amplify + Stripe.js + FCM) al contratto backend attuale e colmare i gap funzionali emersi dalle sessioni P1/P2.

La priorità è **operativa**: prima i mismatch di contratto che rompono schermate reali, poi i pezzi che sbloccano il go-live a pagamento, infine crescita.

Legenda stato: 🟥 da fare · 🟧 parziale · 🟩 ok (verifica).

---

## P0 — Mismatch di contratto (rompono o falsano schermate esistenti)

Senza questi, schermate già a video mostrano dati inventati o crashano al cambio di stato reale del match.

---

### F1 — `GET /matches/:matchId` non corrisponde al tipo `UnlockedMatch` 🟥

**Problema.** Il backend (`get_match.py`) restituisce **una sola forma** per ogni stato:

```jsonc
{ "matchId", "status", "airportCode", "score", "userId1", "userId2",
  "unlockedBy": [], "unlockDeadline", "createdAt",
  "trip1": {...}, "trip2": {...} }
```

Non esistono i campi `partner`, `meetingPoint`, `savings`, `yourShare`, `fullFare` che il tipo frontend `UnlockedMatch` (`src/types/api.ts:151`) si aspetta. La schermata `ConnectionUnlocked` legge dati che il backend non manda.

**Cosa fare.**
- Allineare `MatchResponse` in `src/types/api.ts` alla forma reale (unica forma, `status` come union completa — vedi F2).
- Comporre la vista unlocked lato client:
  - profilo partner → `GET /users/:userId` (`fetchUser`, già esistente) usando l'`userId` partner ricavato da `userId1`/`userId2` ≠ proprio.
  - `meetingPoint` → da `airportStore` (il config aeroporto ha `meetingPoints` per terminal; **aggiungere** `meetingPoints` al tipo `Airport`, oggi assente in `api.ts:20`).
  - `savings`/`yourShare`/`fullFare` → calcolati da `airport.baseFare` (full = baseFare, share = baseFare/2).
- Rimuovere da `UnlockedPartner` i campi non forniti dal backend: `totalTrips`, `onTimeRate` (inventati). Sostituire `rating?: number` con il risultato reale di `GET /users/:userId/rating` (vedi F5).

**Impatto chat.** `ConnectionUnlocked` crasha sul render (campi `undefined`) **prima** di mostrare la chat: finché F1 non è risolto, la chat — pur con la logica real-time corretta — non è raggiungibile col backend reale. F6 dipende da questo.

**File:** `src/types/api.ts`, `src/screens/ConnectionUnlocked/ConnectionUnlocked.tsx`, `src/services/matches.ts` (helper compositore), `src/types/api.ts` (Airport + meetingPoints).

---

### F2 — Stati Match mancanti: `partially_unlocked`, `unlock_expired`, `dissolved`, `completed` ✅ (06/06/2026)

> **Implementato** in `src/screens/MatchLocked.tsx` (+ `UnlockResponse` esteso in `types/api.ts`):
> - `pending` → CTA unlock (invariato).
> - `partially_unlocked` & io ho sbloccato → **pannello attesa partner** (countdown `unlockDeadline`, copy "€0 finché non sblocca", **polling 5s** perché il backend non invia WS di full-unlock al primo).
> - `partially_unlocked` & ha sbloccato il partner → **CTA urgente** ("[partner] ha già sbloccato!"). Wire WS `match.partner_unlocked` → refetch (anticipa F7).
> - `unlocked` → redirect `/connection/:id`.
> - `unlock_expired`/`dissolved`/`expired` → pannello terminale dedicato + CTA "Vai ai miei trip".
> - `completed` → pannello "Viaggio completato" (review CTA arriverà con F5).
> - `handleBetaConfirm`: usa `res.matchStatus` (`unlocked`→connection, `partially_unlocked`→refetch→attesa).


**Problema.** Il frontend modella solo `status: 'pending'` (LockedMatch) e `'unlocked'` (UnlockedMatch). Il backend (Payment Deadlock, sez. 05) usa il ciclo:

```
pending → partially_unlocked → unlocked → completed
        ↘ unlock_expired / dissolved / expired
```

`MatchLocked` non sa cosa mostrare quando il match è `partially_unlocked` (un utente ha pagato, si aspetta il partner) né gestisce gli stati terminali.

**Cosa fare.**
- Estendere lo union `status` del match a: `pending | partially_unlocked | unlocked | unlock_expired | dissolved | expired | completed`.
- `MatchLocked.tsx`: aggiungere lo stato **"Attesa partner"** quando `status === 'partially_unlocked'` e l'utente corrente è già in `unlockedBy`:
  - copy di rassicurazione ("Hai sbloccato. Aspettiamo che [partner] sblocchi — €0 finché non sblocca anche lui").
  - countdown su `unlockDeadline`.
- Quando `partially_unlocked` e l'utente **non** è in `unlockedBy`: pressione sociale ("[partner] ha già sbloccato!") + CTA unlock urgente.
- Stati terminali → schermate/redirect: `unlock_expired`/`dissolved` → `/no-match` con messaggio dedicato; `completed` → trigger flusso review (F5).

**File:** `src/types/api.ts`, `src/screens/MatchLocked.tsx`, `src/screens/NoMatchFound.tsx`.

---

### F3 — Errore ban (`403` su `POST /trips`) non gestito ✅ (06/06/2026)

> **Implementato:**
> - `src/services/api.ts`: `parseApiError(err)` → `{status, message}` leggendo il body `{error}` di ky `HTTPError`.
> - `src/stores/tripStore.ts`: stato `banned: boolean`; `submitTrip` usa `parseApiError`, setta `banned=status===403` + messaggio backend; reset su submit/successo/clear.
> - `src/screens/TravelCheckin.tsx`: banner inline `bannedBanner` con messaggio backend, CTA disabilitata ("Account sospeso"), nessun toast generico se banned.


**Problema.** Il backend (#10 trustScore) ora risponde `403 "Account sospeso per violazioni ripetute…"` a `create_trip` per utenti `banned`. `tripStore.submitTrip()` non distingue questo errore: l'utente vede un errore generico.

**Cosa fare.**
- In `src/stores/tripStore.ts` (`submitTrip`) e nel client `src/services/api.ts`, intercettare `403` con messaggio backend e settare uno stato `banned`.
- Mostrare schermata/sheet dedicata: account sospeso + link supporto. Disabilitare il CTA "crea trip".

**File:** `src/services/api.ts`, `src/stores/tripStore.ts`, `src/screens/TravelCheckin.tsx`.

---

## P1 — Go-live a pagamento e rating

---

### F4 — Pagamento reale Stripe (oggi mock/beta-free) ✅ frontend (06/06/2026) · ⚠ blocco backend

> **Implementato (frontend):**
> - `src/lib/stripe.ts`: loader singleton `getStripe()` (`VITE_STRIPE_PUBLISHABLE_KEY`).
> - `src/components/PaymentSheet/`: `<Elements>` + `<PaymentElement>`; `confirmPayment({redirect:'if_required'})` autorizza l'hold (manual capture → `requires_capture`). Copy di trust, gestione errori.
> - `src/screens/MatchLocked.tsx`: `handleUnlock` chiama `unlockTrip` →
>   - risposta con `paymentIntentClientSecret` → apre `PaymentSheet` (Stripe reale), poi `resolveByStatus`;
>   - risposta beta/fake-door (no clientSecret) → `resolveByStatus` diretto.
>   Rimosso `BetaUnlockSheet`/`UnlockResponse` esteso già da F2.
>
> **✅ Blocco backend risolto (07/06/2026):**
> Cattura spostata su **webhook**. `unlock_match.py` al secondo unlock ora registra solo il secondo PI (`secondUnlockPaymentIntentId`, `unlockedBy=[u1,u2]`) e resta `partially_unlocked` — niente cattura sincrona. `stripe_webhook.py` su `payment_intent.amount_capturable_updated`: quando **entrambi** i PI sono `requires_capture`, cattura nell'ordine sicuro (secondo→primo, refund del secondo se il primo fallisce), con claim `captureInProgress` per delivery concorrenti, poi `→unlocked` + `payment.completed` + cancel timeout + metrica. Aggiunta `StripeWebhookFunction` in `template.yaml` (mancava). Test backend 237 verdi.


**Problema.** `MatchLocked` chiama `unlockTrip` e tratta tutto come gratis (beta primi 100). Il backend supporta lo Smart Auto-Capture con `PaymentIntent capture_method: manual`. Quando `FAKE_DOOR_MODE=false`, il frontend deve confermare un PaymentIntent.

**Cosa fare.**
- Integrare **Stripe.js** (già installato): al primo unlock il backend crea il PaymentIntent; il frontend conferma il `clientSecret` con `confirmCardPayment` (auth-hold, non capture).
- Gestire la risposta `{ matchStatus: 'partially_unlocked' }` → schermata attesa partner (F2).
- Wire dell'evento WS `payment_status` (`captured`/`failed`) per chiudere il flusso: `captured` → `/connection/:id`; `failed` → retry/errore.
- Mantenere il ramo `fakeDoor: true` come fallback (la risposta unlock lo segnala).

**File:** `src/services/matches.ts` (tipi risposta unlock con `clientSecret`), `src/screens/MatchLocked.tsx`, `src/hooks/useWebSocket.ts`, nuovo `src/lib/stripe.ts`.

---

### F5 — Rating & Review (#11) — submission mancante ✅ (06/06/2026)

> **Implementato:**
> - `src/services/reviews.ts`: `createReview(matchId,{rating,comment?})`, `getUserRating(userId)`.
> - `src/types/api.ts`: `CreateReviewRequest`, `CreateReviewResponse`, `UserRating`.
> - `src/components/ReviewSheet/`: bottom-sheet stelle 1-5 + commento; gestione `409` (già recensito → chiude come fatto), `410` (finestra 48h scaduta), altri errori inline.
> - `TripCard`: per trip `completed` con `matchId` → CTA "Recensisci" (o "Recensito" disabilitato); nuovi prop `onReviewClick`/`reviewed`.
> - `MyTrips`: rende `ReviewSheet`, traccia `reviewedMatchIds` (nasconde la CTA dopo invio/409).
> - Display rating partner: già reale da F1 (rating embedded in `get_user_public` quando unlocked); `getUserRating` disponibile per usi futuri.


**Problema.** Esiste solo il **display** stelle (`StarRating` in ConnectionUnlocked) e funziona su un campo `rating` inventato. Il backend espone:
- `POST /matches/:matchId/review` `{ rating 1-5, comment? }` — solo se match `completed`, entro 48h, una per reviewer (409 al duplicato, 410 oltre finestra).
- `GET /users/:userId/rating` → `{ average, count }`.

**Cosa fare.**
- Nuovo service `src/services/reviews.ts`:
  - `createReview(matchId, { rating, comment })` → `POST /matches/:matchId/review`.
  - `getUserRating(userId)` → `GET /users/:userId/rating`.
- Nuovi tipi: `CreateReviewRequest`, `UserRating { userId, average: number|null, count }`.
- Nuova UI **ReviewSheet** (post-completion): stelle 1-5 + commento opzionale. Aperta da:
  - notifica `review_requested` (il backend invia push/in-app dopo `trip.completed`),
  - oppure dalla card trip `completed` in `MyTrips`.
- Gestire risposte: `409` → "già recensito"; `410` → "finestra recensione scaduta" (disabilita).
- Sostituire il rating fittizio in `ConnectionUnlocked` con `getUserRating(partnerId)` reale (`{average, count}`; `average=null` → "Nessuna recensione").

**File:** nuovo `src/services/reviews.ts`, nuovo `src/screens/ReviewSheet/` (o componente in ConnectionUnlocked), `src/types/api.ts`, `src/screens/MyTrips.tsx`, `src/screens/ConnectionUnlocked/ConnectionUnlocked.tsx`.

---

### F6 — Chat: storico, messaggi di sistema, dedup ✅ (06/06/2026)

> **Implementato.** Scoperto un mismatch di contratto più profondo del previsto: il backend invia gli eventi WS con discriminante **`type`** e nomi puntati (`chat.message`, `chat.message.sent`, `chat.system`, `match.found`), mentre il frontend dispatchava su `event` → **nessun** messaggio WS veniva consegnato (non solo lo storico). Fix applicati:
> - `src/services/websocket.ts`: dispatcher su `type` (fallback `event`).
> - `src/types/ws.ts`: union riscritta sui nomi reali backend.
> - `src/hooks/useWebSocket.ts`: `on()` ora ritorna l'unsubscribe (cleanup per dep-change, non solo unmount).
> - `src/services/matches.ts`: `getChatHistory` / `getFullChatHistory` (`GET /matches/:id/chat`, paginazione cursor).
> - `ConnectionUnlocked.tsx`: carica storico all'apertura, renderizza `chat.system` come riga centrata, dedup per `messageId`, sostituzione del messaggio ottimistico con l'echo `chat.message.sent`, empty-state solo post-load.
> - `ActiveSearch.tsx`: `match_found` → `match.found` (collaterale del fix dispatcher).
> Parte di F7 anticipata (dispatcher + `match.found`). Note storiche sotto.


**Stato reale.** Il backend chat (#6) è **completo e funzionante**: WS relay (`chat_message.py`), persistenza `ChatMessage`, history `GET /matches/:matchId/chat` (paginato, cursor base64, oldest-first, TTL 48h), messaggi `type:"system"` (match confermato / partner ha sbloccato / chat in scadenza), push fallback se il destinatario è offline.

Il frontend ha la **sola parte real-time** e per giunta non è raggiungibile end-to-end col backend reale. Dettaglio:

1. **La schermata crasha prima della chat (dipende da F1).** `ConnectionUnlocked.tsx` legge `match.partner`, `meetingPoint`, `savings`, `yourShare`, `fullFare` (riga 162) e `partner.rating` / `partner.totalTrips` / `partner.onTimeRate` / `partner.languages` (righe 202-219). `get_match.py` **non restituisce** nessuno di questi campi → render fallisce su `undefined` → la chat non viene mai mostrata col backend v4 reale. **F6 è bloccato da F1.**
2. **Real-time OK.** Invio/ricezione via WS (`ConnectionUnlocked.tsx:85-129`): `ws.on('chat_message')`, `ws.send({action:'chat_message',...})`, inserimento ottimistico del proprio messaggio, scroll-to-bottom. Questa logica è corretta e va mantenuta.
3. **Nessuno storico.** Non c'è alcuna chiamata a `GET /matches/:matchId/chat`. Refresh o re-ingresso nella schermata → cronologia vuota (i messaggi vivono solo in `useState`).
4. **Messaggi di sistema non gestiti.** `WsServerChatMessage` (`src/types/ws.ts:38`) non ha il campo `type`; i `system` arriverebbero renderizzati come bolla utente normale invece che riga centrata.
5. **Rischio duplicati.** Inserimento ottimistico del proprio messaggio + eventuale echo del relay backend → nessuna dedup. Gli id sono costruiti client-side (`own-${now}` vs `${senderId}-${timestamp}`), non sull'`messageId` reale del backend.

**Cosa fare.**
- Service `getChatHistory(matchId, cursor?)` → `GET /matches/:matchId/chat`; caricare all'apertura della schermata e in scroll-up (paginazione via cursor base64).
- Estendere il tipo messaggio (storico + WS) con `type: 'text' | 'system'` e `messageId`; aggiungere `type`/`messageId` a `WsServerChatMessage` (`src/types/ws.ts`). Renderizzare i `system` come riga centrata, non bolla.
- **Dedup per `messageId`** nel merge cronologia + WS + ottimistico: rimpiazzare il messaggio ottimistico con quello confermato dal backend (match per `messageId`, non per timestamp client).
- Stato vuoto solo dopo che lo storico è caricato (oggi "Nessun messaggio" appare anche durante il load).
- (Opzionale, lega F7) indicatore "sta scrivendo" su evento WS `typing`.

**Dipendenza:** F1 deve essere risolto prima, altrimenti la schermata non arriva a renderizzare la chat.

**File:** `src/services/matches.ts` (o nuovo `chat.ts`), `src/types/ws.ts`, `src/screens/ConnectionUnlocked/ConnectionUnlocked.tsx`.

---

### F7 — Wire eventi WS inutilizzati: `match_unlocked`, `payment_status`, `typing` ✅ (07/06/2026)

> **Stato finale:**
> - `match.partner_unlocked` → wired in F2 (refetch match in MatchLocked).
> - `match_unlocked` / full-unlock → non serve evento WS: MatchLocked fa polling mentre `partially_unlocked` (F2) e il webhook flippa a `unlocked`.
> - `payment_status` → **non emesso dal backend** (rimosso dall'union frontend).
> - `typing` → **implementato**: invio throttled (≥2s) su input in `ConnectionUnlocked`; ricezione `ws.on('typing')` → "[partner] sta scrivendo…" con auto-clear 3s. Backend `websocket/typing.py` allineato a discriminante `type` (era `event`).


**Problema.** I tipi esistono ma non c'è handler visibile.
- `match_unlocked` → se sei in `MatchLocked` (attesa partner), naviga a `/connection/:id`.
- `payment_status` → vedi F4.
- `typing` → indicatore "sta scrivendo" in chat.

**File:** `src/hooks/useWebSocket.ts`, `src/screens/MatchLocked.tsx`, `src/screens/ConnectionUnlocked/ConnectionUnlocked.tsx`.

---

## P2 — Multi-aeroporto, polish, crescita

---

### F8 — Secondo aeroporto FCO (#12) — verifica no-hardcode ✅ (06/06/2026)

> **Hardcode MXP rimossi (funzionali):**
> - `services/flights.ts`: `fetchFlightsBySlot` ora prende `hubIata`/`hubName` (era `/airports/iata/MXP` + "Milan Malpensa" fissi).
> - `components/checkin/FlightSearchSheet.tsx` + `FlightInput.tsx`: prop `airportCode`/`airportName`, `direction` ora `string` con check `startsWith('FROM')` (era union `'TO_MILAN'|'FROM_MILAN'` + label "MXP" fisse); display `{origin}→{airportCode}`.
> - `screens/TravelCheckin.tsx`: passa `direction={airport.directionLabels[0]}` + `airportCode`/`airportName` (era `direction="TO_MILAN"` hardcoded).
> - `components/trips/TripCard.tsx`: risparmio da `airport.baseFare/2` (era `'€60'`/`'~€60'` fissi).
>
> **Residui cosmetici (non bloccanti, MXP-launch):** copy marketing in `EntryPoint.tsx` ("Da Malpensa…", "€60") è pre-login (nessun aeroporto ancora selezionato → airportStore non caricato); `LiveMatchBanner` default `'Malpensa'`; `constants.DEFAULT_DIRECTION`. Da rendere dinamici solo quando il picker pre-login mostrerà più hub.


**Contesto.** Il backend ha attivato **FCO** (Roma Fiumicino) con `directionLabels=(TO_ROME, FROM_ROME)`. `AirportPicker` già supporta N aeroporti e auto-skip con 1 solo attivo.

**Cosa verificare/correggere.**
- `TravelCheckin`: le label direzione devono venire da `airport.directionLabels` (mai `TO_MILAN` hardcoded). Con FCO deve mostrare TO_ROME/FROM_ROME.
- Terminali e zone letti da `airportStore` per l'aeroporto selezionato (T1/T3 per FCO).
- `meetingPoints` per terminal (serve anche a F1) — aggiungere al tipo `Airport` e al picker.
- Copy "we don't drive you" / risparmio "~€60": il risparmio è `baseFare/2`, quindi **per-aeroporto** (FCO baseFare 11000 → ~€55). Non hardcodare €60.

**File:** `src/screens/TravelCheckin.tsx`, `src/types/api.ts` (Airport + meetingPoints), `src/screens/EntryPoint.tsx` (copy risparmio dinamico).

---

### F9 — Profilo editabile post-onboarding ✅ (07/06/2026)

> **Implementato** in `src/screens/Profile/Profile.tsx`:
> - Sezione "Account" con valori correnti (lingua/genere/fascia d'età) + row "Modifica profilo".
> - `BottomSheet` con `<select>` per i 3 campi (enum backend: Language it/en/fr/de/es, Gender, AgeGroup); salva via `updateProfile` (`PUT /users/me`), aggiorna `authStore` + stato locale, gestione errori via `parseApiError`.
> - Bonus: stat "Rating" del profilo ora reale via `getUserRating(self)` (era "—").


**Problema.** `gender`/`ageGroup`/`lang` si impostano solo in onboarding; `PUT /users/me` (`updateProfile`) esiste ma non è usato per modificarli dopo.

**Cosa fare.** Sezione edit in `Profile.tsx` per lingua/gender/ageGroup (validazione Zod con gli enum backend).

**File:** `src/screens/Profile/Profile.tsx`, `src/services/users.ts` (già pronto).

---

### F10 — Feed notifiche in-app ✅ (07/06/2026)

> **Implementato:**
> - **Fix backend**: `get_notifications.py` chiamava `json_response({...}, origin)` senza status code (statusCode = dict → rotto) → ora `success({notifications}, origin)`.
> - `src/services/notifications.ts`: `getNotifications()`.
> - `src/types/api.ts`: `NotificationItem`, `NotificationsResponse`.
> - `src/components/NotificationsSheet/`: feed in bottom-sheet, time-ago, deep-link a `/match/:id` o `/trip/:id` da `payload`, evidenza non-letti.
> - `MyTrips`: campanella 🔔 in header con badge non-letti; apertura marca come visti (locale — manca endpoint mark-read backend).


**Contesto.** Backend espone `GET /notifications` (match_found, unlock reminder, expired, review_requested…). Oggi il frontend mostra solo toast effimeri.

**Cosa fare.** Service `getNotifications()` + pannello/badge notifiche (campanella) con stato letto/non-letto. Utile per recuperare `review_requested` se la push è persa.

**File:** nuovo `src/services/notifications.ts`, nuovo componente notifiche, `src/types/api.ts`.

---

## Riepilogo per priorità

| # | Intervento | Priorità | Stato | Endpoint/feature backend |
|---|-----------|----------|-------|--------------------------|
| F1 | Allineare shape `GET /matches/:id` (no partner/meetingPoint inviati) | P0 | ✅ | `get_match.py` |
| F2 | Stati match `partially_unlocked`/terminali | P0 | ✅ | Payment Deadlock |
| F3 | Gestione ban `403` su create trip | P0 | ✅ | #10 trustScore |
| F4 | Pagamento reale Stripe (auth-hold) | P1 | ✅ FE+BE | #2 Stripe hardening |
| F5 | Submission Review + rating reale | P1 | ✅ | #11 `POST /matches/:id/review`, `GET /users/:id/rating` |
| F6 | Chat: storico + system + dedup + **fix contratto WS** | P1 | ✅ | #6 `GET /matches/:id/chat` |
| F7 | Wire WS `match.partner_unlocked`/typing (payment_status non emesso dal BE) | P1 | ✅ | WS events |
| F8 | Verifica multi-aeroporto FCO (no-hardcode) | P2 | ✅ | #12 FCO |
| F9 | Profilo editabile post-onboarding | P2 | ✅ | `PUT /users/me` |
| F10 | Feed notifiche in-app | P2 | ✅ | `GET /notifications` |

### Note trasversali
- **Tipi = contratto.** `src/types/api.ts` deve rispecchiare esattamente il backend; oggi `UnlockedMatch`/`UnlockedPartner` contengono campi non forniti. Correggere prima di costruire UI sopra.
- **Niente hardcode aeroporto** (Regola 01 backend, vale anche lato client): zone, terminali, label direzione, risparmio → da `airportStore`.
- **Idempotenza/finestre lato UI:** review 409/410, unlock già fatto, match terminale → stati disabilitati espliciti, non errori generici.

---

**Roadmap chiusa (07/06/2026): F1–F10 completati.** Residui noti non bloccanti: copy marketing pre-login MXP-specifica (F8), endpoint backend `mark-read` notifiche (F10), `BetaUnlockSheet` rimosso → unlock reale richiede `STRIPE_WEBHOOK_SECRET` in SSM + webhook registrato su Stripe (F4).

---

*Flot Frontend Action Plan — 6 Giugno 2026 (agg. 7 Giugno) · derivato da FLOT-doc.html (backend v4 P2)*

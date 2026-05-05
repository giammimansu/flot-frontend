# FLOT — Prompt Claude Code: Sviluppo Screens

> Usa questo file come prompt di avvio per ogni sessione di sviluppo su Claude Code.
> Copia e incolla l'intero contenuto all'inizio di ogni nuova sessione.

---

## 📋 TASK

Sviluppa le screens dell'app **Flot** in React + TypeScript partendo dai mockup HTML già esistenti nella cartella `FLOT/`, collegandole al backend tramite le API documentate.

**Criterio di successo** ✅
Il task è completato solo se:
1. Ogni screen è un componente React TypeScript funzionante, senza errori di compilazione
2. Ogni screen si integra con almeno un endpoint reale del backend (non mock hardcoded)
3. Il flusso di navigazione tra screens è completo e coerente (nessun link rotto)
4. Lo stile rispetta il design system `colors_and_type.css` — zero valori hardcoded
5. Il progetto compila con `npm run build` senza warning o errori

---

## 📂 CONTEXT FILE

**Prima di iniziare, leggi questi file nell'ordine indicato:**

```
1. FLOT-README.md                          ← Chi siamo, cosa fa Flot, regole non negoziabili
2. CLAUDE-CODE-FRONTEND-PROMPT-DEFINITIVO.md  ← Stack, screens, flusso, coding standards
3. FLOT/colors_and_type.css                ← Design system: UNICA fonte di verità per stili
4. FLOT/MalpensaComponents.jsx             ← Libreria componenti: converti in TypeScript
5. FLOT/*.html                             ← Mockup: authority visuale per layout e copy
6. CLAUDE-CODE-BACKEND-PROMPT_v4-ELASTIC.md ← Tutte le API disponibili con endpoint e payload
```

**Non iniziare a scrivere codice finché non hai letto tutti e 6 i file.**

---

## 🖼️ REFERENCE

I mockup HTML in `FLOT/` sono il tuo riferimento visivo. Trattali come screenshot di Figma:

| Mockup | Screen React da creare |
|--------|----------------------|
| `Entry Point.html` | `src/screens/EntryPoint.tsx` |
| `Travel Check-in.html` | `src/screens/TravelCheckin.tsx` |
| `Trip Scheduled.html` | `src/screens/TripScheduled.tsx` |
| `My Trips.html` | `src/screens/MyTrips.tsx` |
| `Active Search.html` | `src/screens/ActiveSearch.tsx` |
| `Match Result - Locked.html` | `src/screens/MatchLocked.tsx` |
| `The Connection - Unlocked.html` | `src/screens/ConnectionUnlocked.tsx` |
| `No Match Found.html` | `src/screens/NoMatchFound.tsx` |
| `Profile.html` | `src/screens/Profile.tsx` |
| `Identity Verification.html` | `src/screens/IdentityVerification.tsx` |

**Regola**: gli stili inline nei mockup sono shortcut di prototipazione. Convertili sempre in CSS Modules con token da `colors_and_type.css`.

---

## 📐 SUCCESS BRIEF

**Output atteso per ogni screen:**

```
src/
  screens/
    NomeScreen/
      NomeScreen.tsx         ← componente principale
      NomeScreen.module.css  ← stili CSS Modules, solo var(--token)
      index.ts               ← barrel export
  components/
    [componenti riutilizzabili estratti]
```

**Formato del codice:**
- TypeScript strict — no `any`, no `as` cast
- Functional components con hooks
- Props interface definite per ogni componente
- Max 150 righe per file — estrai sotto-componenti se superi
- Zero `console.log` in produzione

**Integrazione backend:**
- Ogni screen si connette a `src/services/api.ts` (istanza `ky` con auth interceptor)
- I dati di risposta vengono tipizzati con le interfacce in `src/types/api.ts`
- Ogni stato di loading ha uno skeleton visibile
- Ogni errore API ha un error state gestito

---

## 📏 REGOLE

*Queste regole si applicano a ogni riga di codice che scrivi. Se devi rompere una di queste regole, fermati e dimmelo.*

### Design
- Mai hardcodare colori, spacing, font-size, border-radius — usa sempre `var(--token)` da `colors_and_type.css`
- Mai includere il phone frame (`ios-frame.jsx`) nell'app — le screens riempiono `100dvh`
- Safe areas obbligatorie: `env(safe-area-inset-*)` per notch e home indicator
- Touch target minimi: 44×44px (Apple HIG)
- No pull-to-refresh — prevent default su body

### Dati
- Mai hardcodare dati aeroporto-specifici — leggi sempre da `airportStore.selectedAirport`
- Le foto partner sono sempre blurrate server-side — mai mostrare foto non blurrate pre-unlock
- `airportCode` deve sempre essere incluso nelle chiamate a trip creation e matching
- `VITE_FAKE_DOOR_MODE=true` → il flow di unlock mostra "Coming soon" modal, non Stripe reale

### Backend
- `capture_method: 'manual'` è obbligatorio per tutti i PaymentIntent — mai capture immediato
- Trip `matched` o `unlocked` non sono cancellabili — gestisci errore 400 esplicitamente
- WebSocket: gestisci reconnect automatico e heartbeat

### Qualità
- `npm run build` deve completare senza errori prima di considerare il task finito
- Ogni screen deve avere un error boundary che la wrappa
- Ogni operazione async deve avere loading skeleton + error state

---

## 💬 CONVERSATION

**Prima di scrivere una riga di codice, fammi queste domande:**

1. Quale screen vuoi che implementi per prima?
2. Il backend è già attivo e raggiungibile, o devo usare dati mock per ora?
3. Parti da zero (progetto vuoto) o c'è già codice esistente su cui costruire?
4. Ci sono screens che hanno priorità rispetto ad altre per il test utente?

Continua a farmi domande finché non hai risolto i tuoi dubbi all'80%.

---

## 🗺️ PIANIFICAZIONE

Prima di iniziare lo sviluppo, dimmi il tuo piano in massimo 5 step.

Esempio di piano atteso:
```
Step 1 — Setup foundation: design tokens, componenti base, router
Step 2 — Auth flow: Entry Point + Cognito
Step 3 — Core flow: Check-in → Trip Scheduled → Match Locked
Step 4 — Unlock flow: pagamento Stripe + Connection Unlocked
Step 5 — Tab screens: My Trips, Profile, Notifiche push
```

---

## ✅ ALLINEAMENTO

Quando hai letto tutti i file e sei pronto, dimmi:

> "Ecco il mio piano di esecuzione in 5 step. Quando saremo allineati, inizio a lavorare."

Solo dopo la mia conferma puoi iniziare a scrivere codice.

---

*FLOT Screen Development Prompt — v1 — Maggio 2026*

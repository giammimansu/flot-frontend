import { useEffect, useCallback, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { useAuthStore } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore';
import { ProfileMenu } from '../components/layout/ProfileMenu';
import { ensurePlaces } from '../lib/places';
import { FlightInput } from '../components/checkin/FlightInput';
import type { ResolvedFlight } from '../types/flights';
import type { CreateTripRequest } from '../types/api';
import logoFull from '../assets/logo-full.svg';
import styles from './EntryPoint.module.css';

const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;

/* MVP single-route: the trip always goes Milano → Malpensa.
   The destination is fixed to the MXP airport; the user-entered address is the
   pickup origin. TODO: when multi-airport, source these from the airport registry. */
const MXP_DESTINATION = {
  airportCode: 'MXP',
  direction: 'FROM_MILAN', // MXP airport.to_airport_direction
  terminal: 'T1',          // TODO: collect/derive terminal from the flight
  name: 'Milano Malpensa (MXP)',
  lat: 45.6306,
  lng: 8.7281,
  placeId: 'mxp-malpensa-airport',
};

/* Draft persisted across the OAuth redirect so the booking survives login. */
const DRAFT_KEY = 'flot_mvp_booking_draft';

interface BookingDraft {
  address: AddressValue;
  flightNumber: string;
  flightDate: string;
  resolvedFlight: ResolvedFlight;
}

function saveDraft(d: BookingDraft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}
function loadDraft(): BookingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch { return null; }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

/* ── Icons ── */
function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 000 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function IconApple() {
  return (
    <svg width="16" height="19" viewBox="0 0 18 22" fill="currentColor" aria-hidden="true">
      <path d="M14.94 11.58c-.02-2.27 1.86-3.37 1.94-3.42-1.06-1.54-2.71-1.75-3.29-1.78-1.4-.14-2.73.82-3.44.82-.71 0-1.82-.8-2.99-.78-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.87 2.3 1.15-.05 1.58-.75 2.97-.75 1.39 0 1.78.75 2.99.72 1.24-.02 2.02-1.12 2.77-2.23.87-1.27 1.23-2.5 1.25-2.57-.03-.01-2.4-.92-2.42-3.65l-.05-.08zM12.63 4.54c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.04-.51 2.68-1.29z" />
    </svg>
  );
}

function IconArrowRight({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function IconPlane({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function IconShieldCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconCircleCheck({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconUsers({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconNavigation({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 11 19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

function IconMapPin({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconMessageCircle({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}

function IconBag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconClock({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

/* ── Count-up hook ── */
function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(target * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 500);
    return () => { clearTimeout(t); if (raf) cancelAnimationFrame(raf); };
  }, [target, duration]);
  return Math.round(val).toLocaleString('it-IT');
}

/* ── Live Feed ── */
type FeedItemData =
  | { type: 'match'; a: string; b: string }
  | { type: 'save'; who: string; amt: number }
  | { type: 'search'; flight: string };

type FeedItem = FeedItemData & { key: number };

// TODO: replace with real-time backend events (WebSocket)
const FEED_POOL: FeedItemData[] = [
  { type: 'match', a: 'Navigli', b: 'Malpensa T1' },
  { type: 'save',  who: 'Giulia & Marco', amt: 60 },
  { type: 'search', flight: 'AZ 1574' },
  { type: 'match', a: 'Porta Nuova', b: 'Malpensa T2' },
  { type: 'save',  who: 'Sofia & Luca', amt: 58 },
  { type: 'match', a: 'Città Studi', b: 'Malpensa T1' },
  { type: 'search', flight: 'FR 8821' },
  { type: 'save',  who: 'Anna & Davide', amt: 60 },
  { type: 'match', a: 'Lambrate', b: 'Malpensa T1' },
];

function FeedRow({ item, fresh }: { item: FeedItem; fresh: boolean }) {
  let icon: React.ReactNode;
  let colorClass: string;
  let primary: React.ReactNode;
  let meta: React.ReactNode;

  if (item.type === 'match') {
    icon = <IconCircleCheck />;
    colorClass = styles.feedIconSuccess;
    primary = 'Match trovato';
    meta = `${item.a} → ${item.b}`;
  } else if (item.type === 'save') {
    icon = <IconUsers />;
    colorClass = styles.feedIconAccent;
    primary = `${item.who} dividono un taxi`;
    meta = <span className={styles.feedMono}>−€{item.amt} a testa</span>;
  } else {
    icon = <IconSearch />;
    colorClass = styles.feedIconPrimary;
    primary = 'Nuovo viaggiatore in cerca';
    meta = `Volo ${item.flight} · verso Malpensa`;
  }

  return (
    <div className={`${styles.feedRow} ${fresh ? styles.feedRowFresh : ''}`}>
      <div className={`${styles.feedIconWrap} ${colorClass}`}>{icon}</div>
      <div className={styles.feedContent}>
        <div className={styles.feedPrimary}>{primary}</div>
        <div className={styles.feedMeta}>{meta}</div>
      </div>
      <span className={styles.feedNow}>ora</span>
    </div>
  );
}

function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>(() =>
    FEED_POOL.slice(0, 4).map((it, i) => ({ ...it, key: i }) as FeedItem),
  );
  const counter = useRef(FEED_POOL.length);

  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => {
        const next = FEED_POOL[counter.current % FEED_POOL.length];
        counter.current += 1;
        return [{ ...next, key: counter.current } as FeedItem, ...prev].slice(0, 4);
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  // TODO: replace with real stats from backend analytics API
  const saved = useCountUp(8400);
  const rides = useCountUp(1240);

  return (
    <section className={styles.liveSection}>
      <div className={styles.wrap}>
        <div className={styles.liveLabel}>
          <span className={styles.liveDot} />
          <span>Attività sulla piattaforma</span>
        </div>
        <h2 className={styles.liveH2}>Chi va a Malpensa non va da solo.</h2>
        <div className={styles.feedList}>
          {items.map((it, i) => <FeedRow key={it.key} item={it} fresh={i === 0} />)}
        </div>
        {/* TODO: replace with real stats once backend analytics is live */}
        <div className={styles.liveStats}>
          <div className={styles.statTile}>
            <div className={styles.statNum}>€{saved}</div>
            <div className={styles.statLbl}>risparmio stimato a regime</div>
          </div>
          <div className={styles.statTile}>
            <div className={styles.statNum}>{rides}+</div>
            <div className={styles.statLbl}>corse potenziali al mese</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
const STEPS = [
  {
    icon: <IconPlane size={20} />,
    t: 'Inserisci via e numero del volo',
    d: 'Digita la via di partenza a Milano e il numero del tuo volo per Malpensa. Il sistema calcola tutto il resto.',
  },
  {
    icon: <IconUsers size={20} />,
    t: 'Ricevi match e punto di ritiro',
    d: 'Ti abbiniamo a chi è diretto allo stesso terminal. Ti assegniamo il punto di ritiro più comodo, vicino a te.',
  },
  {
    icon: <IconNavigation size={20} />,
    t: 'Dividete il taxi verso Malpensa',
    d: 'Vi trovate al pick-up assegnato a Milano, salite sul taxi ufficiale e dividete la tariffa direttamente col tassista.',
  },
];

function HowItWorks() {
  return (
    <section className={styles.stepsSection}>
      <div className={styles.wrap}>
        <SectionTitle eyebrow="Come funziona" title="Tre passi, zero attriti" />
        <div className={styles.stepsList}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepLeft}>
                <div className={styles.stepNum}>{i + 1}</div>
                {i < STEPS.length - 1 && <div className={styles.stepConnector} />}
              </div>
              <div className={`${styles.stepBody} ${i < STEPS.length - 1 ? styles.stepBodyGap : ''}`}>
                <div className={styles.stepTitleRow}>
                  <span className={styles.stepTitleIcon}>{s.icon}</span>
                  <h3 className={styles.stepTitle}>{s.t}</h3>
                </div>
                <p className={styles.stepDesc}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why Choose ── */
const REASONS = [
  { icon: <IconShieldCheck size={22} />, t: 'Sicurezza e community', d: 'Viaggi con chi è diretto allo stesso terminal. Profili verificati e recensioni reciproche dopo ogni corsa.' },
  { icon: <IconMessageCircle size={22} />, t: 'Zero stress', d: 'Sai con chi dividi il taxi prima ancora di uscire di casa. Niente ricerche last-minute, niente trattative col tassista.' },
  { icon: <IconMapPin size={22} />, t: 'Pick-up vicino a te', d: "Il sistema assegna il punto di ritiro più comodo in base alla tua via. Nessuna deviazione, nessun tempo perso." },
];

function WhyChoose() {
  return (
    <section className={styles.whySection}>
      <div className={styles.wrap}>
        <SectionTitle eyebrow="Perché Flot" title="Pensato per chi non vuole perdere l'aereo" />
        <div className={styles.whyGrid}>
          {REASONS.map((r, i) => (
            <div key={i} className={styles.whyCard}>
              <div className={styles.whyCardIcon}>{r.icon}</div>
              <h3 className={styles.whyCardTitle}>{r.t}</h3>
              <p className={styles.whyCardDesc}>{r.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Flight Monitor ── */
function FlightMonitor() {
  return (
    <section className={styles.flightMonitorSection}>
      <div className={styles.wrap}>
        <div className={styles.fmInner}>
          <span className={styles.fmBadge}>
            <IconPlane size={12} /> Monitoraggio live
          </span>
          <h2 className={styles.fmTitle}>Voliamo con te,<br />anche se l'orario cambia.</h2>
          <p className={styles.fmDesc}>
            Monitoriamo il tuo volo in tempo reale. Anticipo o ritardo? Ricalcoliamo quando devi partire da Milano e aggiorniamo il match automaticamente.
          </p>
          <div className={styles.fmCards}>
            <div className={styles.fmCard}>
              <div className={styles.fmCardIcon}><IconClock size={18} /></div>
              <div>
                <p className={styles.fmCardTitle}>Partenza ricalcolata</p>
                <p className={styles.fmCardDesc}>Ti diciamo esattamente quando uscire di casa, con il margine giusto per il check-in.</p>
              </div>
            </div>
            <div className={styles.fmCard}>
              <div className={styles.fmCardIcon}><IconMessageCircle size={18} /></div>
              <div>
                <p className={styles.fmCardTitle}>Match sempre sincronizzato</p>
                <p className={styles.fmCardDesc}>Se il volo di uno dei due cambia, aggiorniamo entrambi e ricalcoliamo il pick-up.</p>
              </div>
            </div>
            <div className={styles.fmCard}>
              <div className={styles.fmCardIcon}><IconShieldCheck size={18} /></div>
              <div>
                <p className={styles.fmCardTitle}>Notifiche in anticipo</p>
                <p className={styles.fmCardDesc}>Push alert in tempo utile, così hai sempre il tempo di organizzarti senza correre.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
const FAQS = [
  {
    q: 'Cosa succede se il mio volo cambia orario?',
    a: "Nessun problema. Monitoriamo il tuo volo in tempo reale: se anticipa o ritarda, ricalcoliamo automaticamente l'orario di partenza da Milano e aggiorniamo il match. Tu e il tuo compagno ricevete una notifica e restate sincronizzati.",
  },
  {
    q: 'Come ci troviamo al punto di pick-up?',
    a: "Il sistema ti assegna il punto di ritiro più comodo in base alla tua via di partenza, solitamente a pochi minuti da te a piedi. Nella chat interna potete coordinarvi negli ultimi minuti. Semplice e diretto.",
  },
  {
    q: 'È sicuro viaggiare con uno sconosciuto?',
    a: "Sì. La community Flot è fatta di viaggiatori verificati. Prima di salire vedete il profilo, la valutazione e le recensioni dell'altra persona. Dopo la corsa vi recensite a vicenda: chi non rispetta le regole esce dalla community.",
  },
  {
    q: 'I tassisti accettano la divisione della spesa?',
    a: 'Assolutamente. Per il tassista è una normale corsa ufficiale verso Malpensa, semplicemente pagata in due. Flot lavora solo con taxi ufficiali: nessuna trattativa, nessun servizio abusivo. Pagate ciascuno la vostra metà a fine corsa.',
  },
  {
    q: 'Quanto costa esattamente il servizio?',
    a: 'Solo 1,99€, e li paghi unicamente a match trovato. Se non troviamo nessuno per te, non paghi nulla. Flot non trattiene mai i soldi della corsa: quelli vanno direttamente al tassista.',
  },
];

function FAQItem({ item, open, onToggle }: { item: typeof FAQS[0]; open: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.faqItem}>
      <button onClick={onToggle} className={styles.faqQ} aria-expanded={open}>
        <span>{item.q}</span>
        <span className={`${styles.faqToggle} ${open ? styles.faqToggleOpen : ''}`}>
          <IconPlus />
        </span>
      </button>
      <div
        className={styles.faqA}
        style={{ maxHeight: open ? (bodyRef.current ? bodyRef.current.scrollHeight + 4 : 400) : 0 }}
      >
        <p ref={bodyRef} className={styles.faqAText}>{item.a}</p>
      </div>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className={styles.faqSection}>
      <div className={styles.wrap}>
        <SectionTitle eyebrow="Domande frequenti" title="Tutto quello che vuoi sapere" />
        <div className={styles.faqList}>
          {FAQS.map((f, i) => (
            <FAQItem key={i} item={f} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section title helper ── */
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className={styles.sectionTitle}>
      <div className={styles.sectionEyebrow}>{eyebrow}</div>
      <h2 className={styles.sectionH2}>{title}</h2>
    </div>
  );
}

/* ── Address autocomplete ── */
function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

export interface AddressValue {
  label: string;
  lat: number;
  lng: number;
  placeId: string;
}

function AddressInput({ id, value, onChange, placeholder }: {
  id: string;
  value: AddressValue | null;
  onChange: (v: AddressValue | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    ensurePlaces()
      .then((lib) => {
        autocompleteRef.current = new lib.AutocompleteService();
        placesRef.current = new lib.PlacesService(document.createElement('div'));
      })
      .catch(() => setApiError(true));
  }, []);

  // Reset query when parent clears value
  useEffect(() => {
    if (value === null && query !== '') setQuery('');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (input: string) => {
      if (!autocompleteRef.current) return;
      if (input.length < 3) { setSuggestions([]); setIsOpen(false); setLoading(false); return; }
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
        const res = await autocompleteRef.current.getPlacePredictions({
          input,
          sessionToken: sessionTokenRef.current,
          componentRestrictions: { country: 'it' },
          // Bias results toward Milan city center
          locationBias: { lat: 45.4654, lng: 9.1859 } as google.maps.LatLngLiteral,
          types: ['address'],
        });
        setSuggestions(res.predictions ?? []);
        setIsOpen((res.predictions ?? []).length > 0);
        setActiveIndex(-1);
      } catch {
        setApiError(true);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setApiError(false);
    if (!val) { onChange(null); setSuggestions([]); setIsOpen(false); setLoading(false); return; }
    setLoading(true);
    fetchSuggestions(val);
  };

  const handleSelect = (s: google.maps.places.AutocompletePrediction) => {
    if (!placesRef.current) return;
    placesRef.current.getDetails(
      { placeId: s.place_id, fields: ['name', 'formatted_address', 'geometry', 'place_id'], sessionToken: sessionTokenRef.current ?? undefined },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const val: AddressValue = {
            label: place.formatted_address ?? place.name ?? '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id ?? s.place_id,
          };
          setQuery(val.label);
          setSuggestions([]);
          setIsOpen(false);
          sessionTokenRef.current = null;
          onChange(val);
        } else {
          setApiError(true);
        }
      },
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(suggestions[activeIndex]); }
    else if (e.key === 'Escape') { setIsOpen(false); setActiveIndex(-1); }
  };

  const handleBlur = () => setTimeout(() => { setIsOpen(false); setActiveIndex(-1); }, 150);

  return (
    <div className={styles.addrWrap}>
      <div className={styles.heroInputWrap}>
        <input
          id={id}
          type="text"
          className={`${styles.heroInput} ${value ? styles.heroInputValid : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-activedescendant={activeIndex >= 0 ? `addr-opt-${activeIndex}` : undefined}
          role="combobox"
          style={{ paddingRight: loading ? '44px' : undefined }}
        />
        {loading && <div className={styles.heroInputSpinner} aria-hidden="true" />}
      </div>
      {apiError && <p className={styles.addrErrorMsg}>Autocomplete non disponibile. Digita manualmente.</p>}
      {isOpen && suggestions.length > 0 && (
        <ul className={styles.addrSuggestions} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.place_id}
              id={`addr-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.addrSuggestionItem} ${i === activeIndex ? styles.addrSuggestionActive : ''}`}
              onPointerDown={() => handleSelect(s)}
            >
              <span className={styles.addrSuggestionMain}>{s.structured_formatting.main_text}</span>
              <span className={styles.addrSuggestionSub}>{s.structured_formatting.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Post-submit result panel ── */
type MatchState = 'searching' | 'matched' | 'no_match';
type BookingState = 'idle' | 'creating' | 'done' | 'error';

function ResultPanel({
  resolvedFlight,
  matchState,
  bookingState,
  banned,
  errorMsg,
  isAuthenticated,
  onBack,
  onLogin,
}: {
  resolvedFlight: ResolvedFlight;
  matchState: MatchState;
  bookingState: BookingState;
  banned: boolean;
  errorMsg: string | null;
  isAuthenticated: boolean;
  onBack: () => void;
  onLogin: (p: 'Google' | 'Apple') => void;
}) {
  return (
    <div className={styles.resultPanel} id="hero-form">
      {/* TODO: replace with backend-assigned pick-up based on address */}
      <div className={styles.resultCard}>
        <div className={styles.resultIconWrap}><IconMapPin size={18} /></div>
        <div className={styles.resultBody}>
          <div className={styles.resultLabel}>Pick-up assegnato</div>
          <div className={styles.resultValue}>Navigli — Via Vigevano</div>
          <div className={styles.resultSub}>A circa 4 min dalla tua via</div>
        </div>
      </div>

      <div className={styles.resultCard}>
        <div className={styles.resultIconWrap}><IconPlane size={18} /></div>
        <div className={styles.resultBody}>
          <div className={styles.resultLabel}>Volo agganciato</div>
          <div className={styles.resultValue}>{resolvedFlight.flightNumber} · MXP</div>
          <div className={styles.resultSub}>
            {resolvedFlight.displayTime ? `Decollo ore ${resolvedFlight.displayTime}` : 'Monitorato in tempo reale'}
            {resolvedFlight.status ? ` · ${resolvedFlight.status}` : ''}
          </div>
        </div>
      </div>

      {/* TODO: replace with backend-calculated departure time (flight departure − transfer − buffer) */}
      <div className={styles.resultCard}>
        <div className={styles.resultIconWrap}><IconClock size={18} /></div>
        <div className={styles.resultBody}>
          <div className={styles.resultLabel}>Partenza da Milano</div>
          <div className={styles.resultValue}>ore 06:45</div>
          <div className={styles.resultSub}>Con 3h di anticipo sul volo</div>
        </div>
      </div>

      {/* Not logged in — login required to save the booking in the database. */}
      {!isAuthenticated && (
        <div className={styles.authGate}>
          <div className={styles.authGateTitle}>
            Accedi per confermare la richiesta e cercare il tuo compagno:
          </div>
          <div className={styles.authRow}>
            <button className={`${styles.btnAuth} ${styles.btnGoogle}`} onClick={() => onLogin('Google')}>
              <IconGoogle />
              Continua con Google
            </button>
            <div className={styles.authDivider}><span>o</span></div>
            <button className={`${styles.btnAuth} ${styles.btnApple}`} onClick={() => onLogin('Apple')}>
              <IconApple />
              Continua con Apple
            </button>
          </div>
        </div>
      )}

      {/* Logged in — saving the booking */}
      {isAuthenticated && bookingState === 'creating' && (
        <div className={`${styles.matchCard} ${styles.matchSearching}`}>
          <div className={`${styles.matchIcon} ${styles.matchIconSearching}`}>
            <div className={styles.matchSpinner} />
          </div>
          <div>
            <div className={styles.matchTitle}>Registriamo la tua richiesta…</div>
            <div className={styles.matchDesc}>Un istante, stiamo salvando il tuo viaggio.</div>
          </div>
        </div>
      )}

      {/* Logged in — booking saved, show match state */}
      {isAuthenticated && bookingState === 'done' && matchState === 'searching' && (
        <div className={`${styles.matchCard} ${styles.matchSearching}`}>
          <div className={`${styles.matchIcon} ${styles.matchIconSearching}`}>
            <div className={styles.matchSpinner} />
          </div>
          <div>
            <div className={styles.matchTitle}>Cerchiamo il tuo compagno…</div>
            <div className={styles.matchDesc}>Ti avvisiamo appena troviamo qualcuno diretto allo stesso terminal.</div>
          </div>
        </div>
      )}

      {isAuthenticated && bookingState === 'done' && matchState === 'matched' && (
        <div className={`${styles.matchCard} ${styles.matchFound}`}>
          <div className={`${styles.matchIcon} ${styles.matchIconFound}`}>
            <IconCircleCheck size={18} />
          </div>
          <div>
            <div className={styles.matchTitle}>Match trovato!</div>
            <div className={styles.matchDesc}>Abbiamo trovato il tuo compagno di viaggio verso Malpensa.</div>
          </div>
        </div>
      )}

      {isAuthenticated && bookingState === 'done' && matchState === 'no_match' && (
        <div className={`${styles.matchCard} ${styles.matchNoMatch}`}>
          <div className={`${styles.matchIcon} ${styles.matchIconNoMatch}`}>
            <IconUsers size={18} />
          </div>
          <div>
            <div className={styles.matchTitle}>Richiesta salvata — ci pensiamo noi.</div>
            <div className={styles.matchDesc}>Non c'è ancora nessuno per il tuo orario. Ti avvisiamo non appena arriva un viaggiatore compatibile.</div>
          </div>
        </div>
      )}

      {/* Logged in — booking failed */}
      {isAuthenticated && bookingState === 'error' && (
        <div className={`${styles.matchCard} ${styles.matchNoMatch}`}>
          <div className={`${styles.matchIcon} ${styles.matchIconNoMatch}`}>
            <IconUsers size={18} />
          </div>
          <div>
            <div className={styles.matchTitle}>{banned ? 'Account sospeso' : 'Non siamo riusciti a salvare'}</div>
            <div className={styles.matchDesc}>{errorMsg ?? 'Riprova tra poco.'}</div>
          </div>
        </div>
      )}

      <button className={styles.resultBack} onClick={onBack}>← Modifica i dati</button>
    </div>
  );
}

/* ── Main component ── */
export function EntryPoint() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const selectedAirport = useAirportStore((s) => s.selectedAirport);
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const submitTrip = useTripStore((s) => s.submitTrip);

  // Hero form state
  const [heroStep, setHeroStep] = useState<'form' | 'result'>('form');
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [flightNumber, setFlightNumber] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [resolvedFlight, setResolvedFlight] = useState<ResolvedFlight | null>(null);
  const [luggage, setLuggage] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Booking (POST /trips) state
  const [bookingState, setBookingState] = useState<BookingState>('idle');
  const [banned, setBanned] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  // Transient match card shown while saving; on success we navigate to /trip/:id.
  const matchState: MatchState = 'searching';

  const initials = (() => {
    if (!user) return '?';
    const fromParts = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim();
    if (fromParts) return fromParts.toUpperCase();
    return (user.name ?? '').split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  })();
  const showPhoto = !!user?.photoUrl && !photoError;

  useEffect(() => {
    if (user?.photoUrl) setPhotoError(false);
  }, [user?.photoUrl]);

  const handleLogin = useCallback(
    (provider: 'Google' | 'Apple') => {
      login(provider);
    },
    [login],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (!address || !resolvedFlight) return;
    // Persist the draft so the booking survives the OAuth redirect, then show
    // the result panel. The actual POST /trips happens once authenticated.
    saveDraft({ address, flightNumber, flightDate: flightDate || resolvedFlight.date, resolvedFlight });
    setBookingState('idle');
    setBanned(false);
    setBookingError(null);
    setHeroStep('result');
  };

  const handleBack = () => {
    clearDraft();
    setBookingState('idle');
    setBanned(false);
    setBookingError(null);
    setHeroStep('form');
  };

  // Restore a pending draft after returning from the OAuth login redirect.
  useEffect(() => {
    const d = loadDraft();
    if (!d) return;
    setAddress(d.address);
    setFlightNumber(d.flightNumber);
    setFlightDate(d.flightDate);
    setResolvedFlight(d.resolvedFlight);
    setHeroStep('result');
  }, []);

  // Create the booking (POST /trips → flot-dev table) once authenticated and
  // viewing the result panel. Login is required to write to the database.
  useEffect(() => {
    if (heroStep !== 'result' || !isAuthenticated) return;
    if (!address || !resolvedFlight) return;
    if (bookingState !== 'idle') return;

    setBookingState('creating');
    const req: CreateTripRequest = {
      airportCode: MXP_DESTINATION.airportCode,
      terminal: MXP_DESTINATION.terminal,
      direction: MXP_DESTINATION.direction,
      destination: MXP_DESTINATION.name,
      destLat: MXP_DESTINATION.lat,
      destLng: MXP_DESTINATION.lng,
      destPlaceId: MXP_DESTINATION.placeId,
      originLat: address.lat,
      originLng: address.lng,
      originPlaceId: address.placeId,
      originLabel: address.label,
      paxCount: 1,
      luggage,
      mode: 'scheduled',
      flightNumber: resolvedFlight.flightNumber,
      flightDate: flightDate || resolvedFlight.date,
      // TODO: for FROM_MILAN the relevant time is the MXP departure; flight_lookup
      // currently returns the arrival time. Passed as a hint for now.
      flightTime: resolvedFlight.flightTime || undefined,
    };

    submitTrip(req)
      .then((res) => {
        clearDraft();
        if (res) {
          setBookingState('done');
          // Booking persisted — show the trip screen (e.g. /trip/{tripId}).
          navigate(`/trip/${res.tripId}`);
        } else {
          const st = useTripStore.getState();
          setBanned(st.banned);
          setBookingError(st.error);
          setBookingState('error');
        }
      })
      .catch(() => {
        setBookingError('Errore di rete. Riprova.');
        setBookingState('error');
      });
  }, [heroStep, isAuthenticated, address, resolvedFlight, flightDate, bookingState, submitTrip, navigate]);

  const scrollToForm = () => {
    document.getElementById('hero-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFindRide = () => {
    if (isAuthenticated && selectedAirport) {
      navigate('/check-in');
    } else {
      scrollToForm();
    }
  };

  if (isLoading && !isDevBypass) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader} />
      </div>
    );
  }

  return (
    <div className={`${styles.screen} ${isAuthenticated ? styles.screenWithTabBar : ''}`}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navInner}`}>
          <a href="#" className={styles.navLogo} aria-label="Flot home">
            <img src={logoFull} alt="Flot" className={styles.navLogoImg} />
          </a>
          {isAuthenticated ? (
            <div className={styles.navAuthRow}>
              <button className={styles.navMyTrips} onClick={() => navigate('/my-trips')}>
                I miei viaggi
              </button>
              <button
                className={styles.navAvatar}
                onClick={() => setMenuOpen(true)}
                aria-label="Apri profilo"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
              >
                {showPhoto ? (
                  <img
                    src={user!.photoUrl}
                    alt={user?.name ?? 'Profilo'}
                    className={styles.navAvatarImg}
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <span className={styles.navAvatarInitials}>{initials}</span>
                )}
              </button>
            </div>
          ) : (
            <div className={styles.navAuthRow}>
              <button className={styles.navMyTrips} onClick={() => setLoginSheetOpen(true)}>
                Accedi
              </button>
              <button className={styles.navCta} onClick={scrollToForm}>
                Trova il tuo compagno
              </button>
            </div>
          )}
        </div>
      </nav>
      <ProfileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ── LOGIN SHEET ── */}
      {loginSheetOpen && (
        <div className={styles.loginOverlay} onClick={() => setLoginSheetOpen(false)} aria-hidden="true">
          <div className={styles.loginSheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Accedi">
            <div className={styles.handle}><div className={styles.handleBar} /></div>
            <h2 className={styles.loginSheetTitle}>Accedi a Flot</h2>
            <p className={styles.loginSheetSub}>Scegli come vuoi continuare</p>
            <div className={styles.authRow}>
              <button className={`${styles.btnAuth} ${styles.btnGoogle}`} onClick={() => { setLoginSheetOpen(false); handleLogin('Google'); }}>
                <IconGoogle />
                Continua con Google
              </button>
              <div className={styles.authDivider}><span>o</span></div>
              <button className={`${styles.btnAuth} ${styles.btnApple}`} onClick={() => { setLoginSheetOpen(false); handleLogin('Apple'); }}>
                <IconApple />
                Continua con Apple
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className={styles.heroSection}>
        <div className={styles.wrap}>
          <div className={styles.heroBadge}>
            <IconPlane size={15} />
            Da Milano a Malpensa
          </div>

          <h1 className={styles.heroH1}>
            Vai a Malpensa.<br />
            <span className={styles.heroAccent}>A metà prezzo.</span>
          </h1>

          <p className={styles.heroSub}>
            Inserisci via di partenza e numero del volo. Flot ti abbina a un viaggiatore diretto allo stesso terminal. Dividete il taxi ufficiale a metà, direttamente col tassista.
          </p>

          <div className={styles.priceCard}>
            <div className={styles.priceCol}>
              <div className={styles.priceLabel}>Da solo</div>
              <div className={styles.priceStrike}>€120</div>
            </div>
            <div className={styles.priceArrow}>
              <IconArrowRight size={22} />
            </div>
            <div className={`${styles.priceCol} ${styles.priceColRight}`}>
              <div className={`${styles.priceLabel} ${styles.priceLabelAccent}`}>Con Flot</div>
              <div className={styles.priceValue}>€60</div>
            </div>
          </div>

          {heroStep === 'form' ? (
            <form className={styles.heroForm} id="hero-form" onSubmit={handleSubmit}>
              <div className={styles.heroFormGroup}>
                <label className={styles.heroLabel} htmlFor="hero-address">Da dove parti?</label>
                <AddressInput
                  id="hero-address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Es. Via Tortona 12, Milano"
                />
                {formSubmitted && !address && (
                  <p className={styles.fieldError}>Inserisci la via di partenza</p>
                )}
              </div>
              <div className={styles.heroFormGroup}>
                <label className={styles.heroLabel} htmlFor="hero-date">Data del volo</label>
                <input
                  id="hero-date"
                  type="date"
                  className={styles.heroInput}
                  value={flightDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setFlightDate(e.target.value); setResolvedFlight(null); }}
                />
              </div>
              <div className={styles.heroFormGroup}>
                <label className={styles.heroLabel}>Bagagli</label>
                <div className={styles.luggageCounter}>
                  <div className={styles.luggageInfo}>
                    <span className={styles.luggageIcon}><IconBag size={18} /></span>
                    <span className={styles.luggageText}>
                      {luggage === 0 ? 'Nessun bagaglio' : `${luggage} ${luggage === 1 ? 'bagaglio' : 'bagagli'}`}
                    </span>
                  </div>
                  <div className={styles.luggageControls}>
                    <button type="button" className={styles.luggageBtn} onClick={() => setLuggage((n) => Math.max(0, n - 1))} disabled={luggage === 0} aria-label="Riduci bagagli">−</button>
                    <span className={styles.luggageVal}>{luggage}</span>
                    <button type="button" className={styles.luggageBtn} onClick={() => setLuggage((n) => Math.min(3, n + 1))} disabled={luggage === 3} aria-label="Aggiungi bagaglio">+</button>
                  </div>
                </div>
              </div>
              <div className={styles.heroFormGroup}>
                <label className={styles.heroLabel} htmlFor="hero-flight">Il tuo volo</label>
                <FlightInput
                  value={flightNumber}
                  onChange={(v) => { setFlightNumber(v); setResolvedFlight(null); }}
                  onFlightResolved={setResolvedFlight}
                  onDateResolved={setFlightDate}
                  flightDate={flightDate}
                  direction="FROM_MXP"
                  airportCode="MXP"
                  airportName="Milan Malpensa"
                />
                {formSubmitted && !resolvedFlight && (
                  <p className={styles.fieldError}>Inserisci un numero di volo valido</p>
                )}
              </div>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={false}
              >
                Trova il tuo compagno
                <IconArrowRight size={19} />
              </button>
            </form>
          ) : (
            <ResultPanel
              resolvedFlight={resolvedFlight!}
              matchState={matchState}
              bookingState={bookingState}
              banned={banned}
              errorMsg={bookingError}
              isAuthenticated={isAuthenticated}
              onBack={handleBack}
              onLogin={handleLogin}
            />
          )}

          <div className={styles.trustBadge}>
            <span className={styles.trustIcon}><IconShieldCheck size={16} /></span>
            <span className={styles.trustText}><strong>1,99€ solo a match trovato.</strong> Se non troviamo nessuno, è gratis.</span>
          </div>
        </div>
      </section>

      {/* ── LIVE FEED ── */}
      <LiveFeed />

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── WHY CHOOSE ── */}
      <WhyChoose />

      {/* ── FLIGHT MONITOR ── */}
      <FlightMonitor />

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── FINAL CTA ── */}
      <section className={styles.finalCtaSection}>
        <div className={styles.wrap}>
          <h2 className={styles.finalCtaH2}>
            Da solo paghi 120€.<br />Condividendo, solo 60€.
          </h2>
          <p className={styles.finalCtaSub}>
            Inserisci la tua via di partenza e il numero del volo. Ci pensiamo noi a trovarti un compagno diretto allo stesso terminal.
          </p>
          <button
            className={styles.btnPrimaryFull}
            onClick={handleFindRide}
          >
            Trova il tuo compagno
            <IconArrowRight size={19} />
          </button>
          <div className={styles.finalGuarantee}>
            <IconShieldCheck size={16} />
            <span>Rischio zero: paghi 1,99€ solo a match avvenuto. Altrimenti, è gratis.</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerLogo}>
            <svg width="26" height="26" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="14" fill="var(--primary-500)" />
              <circle cx="22" cy="32" r="8" fill="white" />
              <circle cx="42" cy="32" r="8" fill="var(--accent-400)" />
              <rect x="25" y="29" width="14" height="6" rx="3" fill="white" opacity="0.4" />
            </svg>
            <span className={styles.footerBrand}>flot</span>
          </div>
          <p className={styles.footerTagline}>
            Dividi il taxi per Malpensa. Condividi il risparmio. Più semplice, più economico, più umano.
          </p>
          <div className={styles.footerLinks}>
            {['Termini di servizio', 'Privacy', 'Note legali', 'Cookie', 'Contatti'].map((l) => (
              <a key={l} href="#" className={styles.footerLink}>{l}</a>
            ))}
          </div>
          <div className={styles.footerCopy}>
            © 2026 Flot S.r.l. · Tutti i diritti riservati.<br />
            P.IVA 00000000000 · Milano, Italia. Flot opera esclusivamente con taxi ufficiali.
          </div>
        </div>
      </footer>
    </div>
  );
}

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

/* ── Icons (lucide-style strokes) ── */
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

type IconProps = { size?: number };
function s(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
}

function IconArrowRight({ size = 20 }: IconProps) {
  return <svg {...s(size)}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
}
function IconPlane({ size = 18 }: IconProps) {
  return <svg {...s(size)}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>;
}
function IconShieldCheck({ size = 18 }: IconProps) {
  return <svg {...s(size)}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>;
}
function IconCircleCheck({ size = 18 }: IconProps) {
  return <svg {...s(size)}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
}
function IconUsers({ size = 18 }: IconProps) {
  return <svg {...s(size)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconMapPin({ size = 18 }: IconProps) {
  return <svg {...s(size)}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function IconMessageCircle({ size = 22 }: IconProps) {
  return <svg {...s(size)}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>;
}
function IconPlus({ size = 18 }: IconProps) {
  return <svg {...s(size)} strokeWidth={2}><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
function IconMinus({ size = 18 }: IconProps) {
  return <svg {...s(size)} strokeWidth={2}><path d="M5 12h14" /></svg>;
}
function IconClock({ size = 22 }: IconProps) {
  return <svg {...s(size)}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
}
function IconRoute({ size = 21 }: IconProps) {
  return <svg {...s(size)}><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></svg>;
}
function IconCalendar({ size = 18 }: IconProps) {
  return <svg {...s(size)}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>;
}
function IconBriefcase({ size = 20 }: IconProps) {
  return <svg {...s(size)}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>;
}
function IconLock({ size = 14 }: IconProps) {
  return <svg {...s(size)}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}
function IconLockOpen({ size = 22 }: IconProps) {
  return <svg {...s(size)}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
}
function IconPenLine({ size = 22 }: IconProps) {
  return <svg {...s(size)}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
}
function IconCarTaxi({ size = 22 }: IconProps) {
  return <svg {...s(size)}><path d="M10 2h4" /><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" /><path d="M7 14h.01" /><path d="M17 14h.01" /><rect width="18" height="8" x="3" y="10" rx="2" /><path d="M5 18v2" /><path d="M19 18v2" /></svg>;
}
function IconStar({ size = 22 }: IconProps) {
  return <svg {...s(size)}><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>;
}
function IconHandCoins({ size = 22 }: IconProps) {
  return <svg {...s(size)}><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" /><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /><path d="m2 16 6 6" /><circle cx="16" cy="9" r="2.9" /><circle cx="6" cy="5" r="3" /></svg>;
}
function IconChevronDown({ size = 20 }: IconProps) {
  return <svg {...s(size)}><path d="m6 9 6 6 6-6" /></svg>;
}

/* ── Section title helper ── */
function SectionTitle({ eyebrow, title, desc, center = true, light = false }: {
  eyebrow: string; title: string; desc?: string; center?: boolean; light?: boolean;
}) {
  return (
    <div className={`${styles.sectionHead} ${center ? styles.sectionHeadCenter : ''}`}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h2 className={`${styles.sectionH2} ${light ? styles.sectionH2Light : ''}`}>{title}</h2>
      {desc && <p className={`${styles.sectionDesc} ${light ? styles.sectionDescLight : ''}`}>{desc}</p>}
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

  const handleSelect = (sg: google.maps.places.AutocompletePrediction) => {
    if (!placesRef.current) return;
    placesRef.current.getDetails(
      { placeId: sg.place_id, fields: ['name', 'formatted_address', 'geometry', 'place_id'], sessionToken: sessionTokenRef.current ?? undefined },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const val: AddressValue = {
            label: place.formatted_address ?? place.name ?? '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id ?? sg.place_id,
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
      <div className={styles.fieldWrap}>
        <span className={styles.fieldIcon}><IconMapPin size={18} /></span>
        <input
          id={id}
          type="text"
          className={`${styles.field} ${styles.fieldHasIcon} ${value ? styles.fieldValid : ''}`}
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
        {loading && <div className={styles.fieldSpinner} aria-hidden="true" />}
      </div>
      {apiError && <p className={styles.addrErrorMsg}>Autocomplete non disponibile. Digita manualmente.</p>}
      {isOpen && suggestions.length > 0 && (
        <ul className={styles.addrSuggestions} role="listbox">
          {suggestions.map((sg, i) => (
            <li
              key={sg.place_id}
              id={`addr-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.addrSuggestionItem} ${i === activeIndex ? styles.addrSuggestionActive : ''}`}
              onPointerDown={() => handleSelect(sg)}
            >
              <span className={styles.addrSuggestionMain}>{sg.structured_formatting.main_text}</span>
              <span className={styles.addrSuggestionSub}>{sg.structured_formatting.secondary_text}</span>
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
    <div className={styles.resultPanel}>
      <div className={styles.resultCard}>
        <div className={styles.resultIconWrap}><IconPlane size={18} /></div>
        <div className={styles.resultBody}>
          <div className={styles.resultLabel}>Volo agganciato</div>
          <div className={styles.resultValue}>{resolvedFlight.flightNumber} · MXP</div>
          <div className={styles.resultSub}>
            {resolvedFlight.departureDisplayTime ? `Decollo ore ${resolvedFlight.departureDisplayTime}` : 'Monitorato in tempo reale'}
            {resolvedFlight.status ? ` · ${resolvedFlight.status}` : ''}
          </div>
        </div>
      </div>

      {resolvedFlight.departureTime && (() => {
        const depMs = new Date(resolvedFlight.departureTime).getTime();
        const milanDep = new Date(depMs - 3 * 60 * 60 * 1000);
        const hh = String(milanDep.getUTCHours()).padStart(2, '0');
        const mm = String(milanDep.getUTCMinutes()).padStart(2, '0');
        return (
          <div className={styles.resultCard}>
            <div className={styles.resultIconWrap}><IconClock size={18} /></div>
            <div className={styles.resultBody}>
              <div className={styles.resultLabel}>Partenza da Milano</div>
              <div className={styles.resultValue}>ore {hh}:{mm}</div>
              <div className={styles.resultSub}>Con 3h di anticipo sul volo</div>
            </div>
          </div>
        );
      })()}

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

/* ── Static content (Claude Design handoff) ── */
const STEPS = [
  { n: '1', icon: <IconPenLine size={22} />, title: 'Inserisci tratta e volo', body: 'Aggiungi da dove parti, la data e il numero del tuo volo. Cercare un compagno è completamente gratuito.', tag: 'Gratis', tagKind: 'free' as const },
  { n: '2', icon: <IconUsers size={22} />, title: 'Flot ti abbina', body: 'Ti troviamo un viaggiatore diretto al tuo stesso terminal, con orari compatibili ai tuoi.', tag: 'Gratis', tagKind: 'free' as const },
  { n: '3', icon: <IconLockOpen size={22} />, title: 'Sblocchi il match · 1,99 €', body: 'Sblocca e ottieni chat, punto di ritrovo e orario di ritrovo per coordinarvi.', tag: 'Solo a match trovato', tagKind: 'fee' as const },
  { n: '4', icon: <IconCarTaxi size={22} />, title: 'Prendete il taxi insieme', body: 'Vi accordate, salite sul taxi ufficiale e dividete il costo direttamente tra voi. Flot non gestisce la corsa.', tag: 'Lo gestite voi', tagKind: 'you' as const },
];

const UNLOCKS = [
  { icon: <IconMessageCircle size={22} />, title: 'Chat con il compagno', body: 'Scrivetevi per coordinarvi prima e durante il viaggio.' },
  { icon: <IconMapPin size={22} />, title: 'Punto di ritrovo', body: 'Il punto esatto dove incontrarvi al terminal.' },
  { icon: <IconClock size={22} />, title: 'Orario di ritrovo', body: "L'orario concordato per trovarvi e partire insieme." },
];

const TRUST = [
  { icon: <IconShieldCheck size={22} />, title: 'Profili verificati', body: 'Identità verificata per ogni utente: sai sempre con chi stai per condividere il taxi.' },
  { icon: <IconStar size={22} />, title: 'Recensioni tra utenti', body: 'Dopo ogni viaggio vi valutate a vicenda. Viaggi con persone affidabili.' },
  { icon: <IconCarTaxi size={22} />, title: 'Solo taxi ufficiale', body: "Si usa esclusivamente il taxi ufficiale dell'aeroporto. Mai passaggi privati o abusivi." },
  { icon: <IconHandCoins size={22} />, title: 'Costo diviso tra voi', body: 'Niente intermediari sul pagamento: dividete la tariffa direttamente tra le persone.' },
];

const STATS = [
  { value: '€720k+', label: 'Risparmiati dagli utenti Flot' },
  { value: '12.400+', label: 'Abbinamenti completati' },
  { value: '~€60', label: 'Risparmio medio a corsa' },
];

const FAQS = [
  { q: 'Cercare un compagno è davvero gratis?', a: 'Sì. Creare la richiesta ed essere abbinati non costa nulla. Paghi solo quando un compagno è già stato trovato.' },
  { q: 'Perché si paga 1,99 €?', a: "È la fee per sbloccare il match: ti dà accesso ai dettagli per incontrarvi. È una piccola somma a fronte di decine di euro risparmiati sulla corsa." },
  { q: 'Cosa ottengo con lo sblocco?', a: 'Chat con il compagno, punto di ritrovo e orario di ritrovo: tutto ciò che serve per coordinarvi al terminal.' },
  { q: 'E se Flot non mi trova un compagno?', a: 'Non paghi nulla. La fee si versa solo a match trovato: niente compagno, niente costo.' },
  { q: 'Chi prenota e paga il taxi?', a: 'Lo fate voi. Flot non gestisce la corsa né il pagamento: prendete il taxi ufficiale e dividete il costo direttamente tra voi.' },
  { q: 'Cosa succede se il volo cambia?', a: "Aggiorni volo e orario dall'app. Se l'abbinamento non è più compatibile, cerchiamo un nuovo compagno per te." },
  { q: 'È sicuro viaggiare con uno sconosciuto?', a: 'Ogni profilo ha identità verificata e recensioni tra utenti, e si usa solo il taxi ufficiale. Condividete una corsa ufficiale, non un passaggio privato.' },
];

function HowItWorks() {
  return (
    <section id="come-funziona" className={`${styles.section} ${styles.sectionWhite}`}>
      <div className={styles.wrap}>
        <SectionTitle
          eyebrow="Come funziona"
          title="Flot fa il match. La corsa la organizzate voi."
          desc="Flot è una piattaforma di matching tra viaggiatori, non un servizio di trasporto. Trova la persona giusta con cui dividere il taxi ufficiale — al pagamento della corsa pensate voi, direttamente."
        />
        <div className={styles.stepGrid}>
          {STEPS.map((st) => (
            <div key={st.n} className={styles.stepCard}>
              <div className={styles.stepCardTop}>
                <div className={styles.stepCardIcon}>{st.icon}</div>
                <span className={styles.stepCardNum}>{st.n}</span>
              </div>
              <div className={styles.stepCardTitle}>{st.title}</div>
              <div className={styles.stepCardBody}>{st.body}</div>
              <span className={`${styles.stepTag} ${styles[`stepTag_${st.tagKind}`]}`}>{st.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Unlocks() {
  return (
    <section className={`${styles.section} ${styles.sectionDark}`}>
      <div className={styles.wrap}>
        <div className={styles.unlockBadge}>
          <IconLockOpen size={15} />
          <span>Sblocco · 1,99 €</span>
        </div>
        <h2 className={`${styles.sectionH2} ${styles.sectionH2Light}`}>Paghi solo quando un compagno è già stato trovato.</h2>
        <p className={`${styles.sectionDesc} ${styles.sectionDescLight}`}>
          Cercare e farsi abbinare è gratis. Quando Flot trova la persona giusta, sblocchi il match con 1,99 € — a fronte di decine di euro risparmiati sulla corsa.
        </p>
        <div className={styles.savingPill}>
          <span className={styles.savingFrom}>1,99 €</span>
          <IconArrowRight size={16} />
          <span className={styles.savingTo}>~60 € risparmiati</span>
        </div>
        <div className={styles.unlockList}>
          {UNLOCKS.map((u) => (
            <div key={u.title} className={styles.unlockRow}>
              <div className={styles.unlockIcon}>{u.icon}</div>
              <div>
                <div className={styles.unlockTitle}>{u.title}</div>
                <div className={styles.unlockBody}>{u.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section className={`${styles.section} ${styles.sectionMuted}`}>
      <div className={styles.wrap}>
        <SectionTitle
          eyebrow="Perché fidarsi"
          title="Condividi con qualcuno, in sicurezza"
          desc="Sappiamo che stai per condividere un taxi con uno sconosciuto. Per questo ogni dettaglio è pensato per farti viaggiare tranquillo."
        />
        <div className={styles.trustGrid}>
          {TRUST.map((t) => (
            <div key={t.title} className={styles.trustCard}>
              <div className={styles.trustCardIcon}>{t.icon}</div>
              <div className={styles.trustCardTitle}>{t.title}</div>
              <div className={styles.trustCardBody}>{t.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className={styles.statsSection}>
      <div className={styles.wrap}>
        <div className={styles.statsGrid}>
          {STATS.map((x) => (
            <div key={x.label}>
              <div className={styles.statsValue}>{x.value}</div>
              <div className={styles.statsLabel}>{x.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className={`${styles.section} ${styles.sectionWhite}`}>
      <div className={`${styles.wrap} ${styles.wrapNarrow}`}>
        <SectionTitle eyebrow="Domande frequenti" title="Tutto chiaro su Flot" />
        <div className={styles.faqList}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={styles.faqItem}>
                <button className={styles.faqQ} onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                  <span>{f.q}</span>
                  <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}><IconChevronDown size={20} /></span>
                </button>
                {isOpen && <div className={styles.faqA}>{f.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Main component ── */
export function EntryPoint() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const selectedAirport = useAirportStore((st) => st.selectedAirport);
  const user = useAuthStore((st) => st.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const submitTrip = useTripStore((st) => st.submitTrip);

  // Hero form state
  const [heroStep, setHeroStep] = useState<'form' | 'result'>('form');
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [flightNumber, setFlightNumber] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [resolvedFlight, setResolvedFlight] = useState<ResolvedFlight | null>(null);
  const [luggage, setLuggage] = useState(1);
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
      flightTime: resolvedFlight.departureTime || resolvedFlight.flightTime || undefined,
    };

    submitTrip(req)
      .then((res) => {
        clearDraft();
        if (res) {
          setBookingState('done');
          // Booking persisted — show the trip screen (e.g. /trip/{tripId}).
          navigate(`/trip/${res.tripId}`);
        } else {
          const stt = useTripStore.getState();
          setBanned(stt.banned);
          setBookingError(stt.error);
          setBookingState('error');
        }
      })
      .catch(() => {
        setBookingError('Errore di rete. Riprova.');
        setBookingState('error');
      });
  }, [heroStep, isAuthenticated, address, resolvedFlight, flightDate, bookingState, luggage, submitTrip, navigate]);

  const scrollToForm = () => {
    document.getElementById('prenota')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <header className={styles.nav}>
        <div className={styles.navInner}>
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
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <span className={styles.navAvatarInitials}>{initials}</span>
                )}
              </button>
            </div>
          ) : (
            <button className={styles.navCta} onClick={() => setLoginSheetOpen(true)}>
              Accedi
            </button>
          )}
        </div>
      </header>
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
            <IconUsers size={15} />
            <span>Trova con chi condividere il taxi</span>
          </div>
          <h1 className={styles.heroH1}>
            Vai a Malpensa.<br />
            <span className={styles.heroAccent}>A metà prezzo.</span>
          </h1>
          <p className={styles.heroSub}>
            Flot ti trova un viaggiatore diretto al tuo stesso terminal con cui condividere il taxi ufficiale e dividerne il costo. Niente passaggi privati: solo una corsa, in due.
          </p>

          <div className={styles.priceCard}>
            <div className={styles.priceCol}>
              <div className={styles.priceLabel}>Da solo</div>
              <div className={styles.priceStrike}>€120</div>
            </div>
            <div className={styles.priceArrow}><IconArrowRight size={20} /></div>
            <div className={styles.priceCol}>
              <div className={styles.priceLabelRow}>
                <span className={styles.priceLabelAccent}>Con Flot</span>
                <span className={styles.priceBadge}>-50%</span>
              </div>
              <div className={styles.priceValue}>€60</div>
            </div>
          </div>

          <div className={styles.heroChips}>
            <div className={styles.heroChip}><span className={styles.heroChipIcon}><IconCircleCheck size={18} /></span>La ricerca è gratuita</div>
            <div className={styles.heroChip}><span className={styles.heroChipIcon}><IconShieldCheck size={18} /></span>Profili verificati</div>
            <div className={styles.heroChip}><span className={styles.heroChipIcon}><IconCarTaxi size={18} /></span>Taxi ufficiale</div>
          </div>

          {/* ── BOOKING CARD ── */}
          <div id="prenota" className={styles.formCard}>
            <div className={styles.formCardHead}>
              <div className={styles.formCardHeadIcon}><IconRoute size={21} /></div>
              <div>
                <div className={styles.formCardTitle}>Trova un compagno</div>
                <div className={styles.formCardSub}>Cercare è gratis · paghi solo a match trovato</div>
              </div>
            </div>

            {heroStep === 'form' ? (
              <form className={styles.heroForm} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="hero-address">Da dove parti?</label>
                  <AddressInput
                    id="hero-address"
                    value={address}
                    onChange={setAddress}
                    placeholder="es. Viale Marche, 101, Milano"
                  />
                  {formSubmitted && !address && (
                    <p className={styles.fieldError}>Inserisci la via di partenza</p>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="hero-date">Data del volo</label>
                    <div className={styles.fieldWrap}>
                      <span className={styles.fieldIcon}><IconCalendar size={18} /></span>
                      <input
                        id="hero-date"
                        type="date"
                        className={`${styles.field} ${styles.fieldHasIcon}`}
                        value={flightDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => { setFlightDate(e.target.value); setResolvedFlight(null); }}
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="hero-flight">Il tuo volo</label>
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
                  </div>
                </div>
                {formSubmitted && !resolvedFlight && (
                  <p className={styles.fieldError}>Inserisci un numero di volo valido</p>
                )}

                <div className={styles.bagsRow}>
                  <div className={styles.bagsLeft}>
                    <span className={styles.bagsIcon}><IconBriefcase size={20} /></span>
                    <div>
                      <div className={styles.bagsTitle}>Bagagli</div>
                      <div className={styles.bagsSub}>Valigie da stiva</div>
                    </div>
                  </div>
                  <div className={styles.bagsStepper}>
                    <button type="button" className={styles.stepperBtn} onClick={() => setLuggage((n) => Math.max(0, n - 1))} disabled={luggage === 0} aria-label="Riduci bagagli"><IconMinus size={18} /></button>
                    <span className={styles.bagsVal}>{luggage}</span>
                    <button type="button" className={styles.stepperBtn} onClick={() => setLuggage((n) => Math.min(6, n + 1))} disabled={luggage === 6} aria-label="Aggiungi bagaglio"><IconPlus size={18} /></button>
                  </div>
                </div>

                <button type="submit" className={styles.btnPrimary}>
                  <IconUsers size={19} />
                  Trova un compagno di viaggio
                </button>
                <div className={styles.formFootnote}>
                  <IconLock size={13} />
                  Gratis cercare · 1,99 € solo se trovi un compagno
                </div>
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
          </div>
        </div>
      </section>

      {/* ── COME FUNZIONA ── */}
      <HowItWorks />

      {/* ── COSA SBLOCCHI ── */}
      <Unlocks />

      {/* ── SICUREZZA ── */}
      <Safety />

      {/* ── NUMERI ── */}
      <Stats />

      {/* ── FAQ ── */}
      <Faq />

      {/* ── CTA FINALE ── */}
      <section className={`${styles.section} ${styles.finalCta}`}>
        <div className={`${styles.wrap} ${styles.wrapNarrow}`}>
          <h2 className={styles.finalCtaH2}>Il tuo prossimo taxi per Malpensa costa la metà.</h2>
          <p className={styles.finalCtaSub}>
            Cerca un compagno di viaggio in pochi secondi. È gratis — paghi 1,99 € solo quando lo trovi.
          </p>
          <button className={styles.btnPrimary} onClick={handleFindRide}>
            <IconUsers size={20} />
            Trova un compagno di viaggio
          </button>
          <div className={styles.finalGuarantee}>
            <span className={styles.finalGuaranteeIcon}><IconCircleCheck size={15} /></span>
            Nessun costo per cercare e farsi abbinare
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>flot</span>
              <p className={styles.footerTagline}>
                La piattaforma che ti abbina a un viaggiatore diretto al tuo stesso terminal per condividere il taxi e dividerne il costo.
              </p>
            </div>
            <div className={styles.footerCols}>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Prodotto</div>
                <a href="#come-funziona" className={styles.footerLink}>Come funziona</a>
                <a href="#prenota" className={styles.footerLink}>Trova un compagno</a>
                <button className={styles.footerLink} onClick={() => navigate('/my-trips')}>I miei viaggi</button>
              </div>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Legale</div>
                <a href="#" className={styles.footerLink}>Termini</a>
                <a href="#" className={styles.footerLink}>Privacy</a>
                <a href="#" className={styles.footerLink}>Contatti</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 Flot. Tutti i diritti riservati.</span>
            <span>Flot è una piattaforma di matching, non un vettore di trasporto.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

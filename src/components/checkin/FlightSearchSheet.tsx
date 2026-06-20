import { useState, useEffect, useRef } from 'react';
import { fetchFlightsByDay } from '../../services/flights';
import type { FlightRow, ResolvedFlight } from '../../types/flights';
import styles from './FlightSearchSheet.module.css';

interface FlightSearchSheetProps {
  open: boolean
  onClose: () => void
  onSelect: (flight: ResolvedFlight) => void
  flightDate: string
  /** Trip direction label (e.g. "TO_ROME"); only the FROM_ prefix matters here. */
  direction: string
  /** Hub airport — drives the AeroDataBox query and labels. */
  airportCode?: string
  airportName?: string
}

type LoadState = 'idle' | 'loading' | 'done' | 'error';
type Period = 'all' | 'am' | 'pm' | 'eve';

const MONTHS_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

function formatDate(iso: string): string {
  if (!iso) return 'Scegli la data';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return 'Scegli la data';
  return `${d} ${MONTHS_IT[m - 1]} ${y}`;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'am', label: 'Mattina' },
  { id: 'pm', label: 'Pomeriggio' },
  { id: 'eve', label: 'Sera' },
];

export function FlightSearchSheet({
  open,
  onClose,
  onSelect,
  flightDate,
  direction,
  airportCode = 'MXP',
  airportName = 'Milan Malpensa',
}: FlightSearchSheetProps) {
  const [apiDir, setApiDir] = useState<'arrivals' | 'departures'>(
    direction.startsWith('FROM') ? 'departures' : 'arrivals',
  );
  const [period, setPeriod] = useState<Period>('all');
  const [selectedDate, setSelectedDate] = useState(flightDate || '');
  const [airportFilter, setAirportFilter] = useState('');
  const [flights, setFlights] = useState<FlightRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSelectedDate(flightDate || '');
  }, [flightDate]);

  // Load the whole day once per (direction, date, airport). Filter chips and
  // the airport search are applied client-side and never trigger a new request.
  useEffect(() => {
    if (!open || !selectedDate) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadState('loading');
    setFlights([]);

    fetchFlightsByDay(apiDir, selectedDate, airportCode, controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setFlights(rows);
        setLoadState('done');
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setLoadState('error');
      });

    return () => controller.abort();
  }, [open, apiDir, selectedDate, airportCode, airportName]);

  // Lock background scroll while the full-screen search is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Fresh load (new direction/date) → reset to "Tutti" so we never sit on a
  // period the new data has no flights for.
  useEffect(() => { setPeriod('all'); }, [apiDir, selectedDate]);

  if (!open) return null;

  const handleSelect = (row: FlightRow) => {
    const flightTime = row.scheduledTimeLocal
      ? new Date(row.scheduledTimeLocal).toISOString()
      : '';
    const displayTime = row.scheduledTimeLocal?.substring(11, 16) ?? '';
    onSelect({
      flightNumber: row.number.replace(/\s/g, ''),
      origin: row.originIata,
      originName: row.originName,
      destination: row.destIata,
      flightTime,
      displayTime,
      date: row.scheduledTimeLocal?.substring(0, 10) ?? selectedDate,
      status: row.status,
    });
  };

  const now = new Date();
  const q = airportFilter.trim().toLowerCase();

  const inPeriod = (r: FlightRow, p: Period) => {
    if (p === 'all' || !r.scheduledTimeLocal) return true;
    const h = Number(r.scheduledTimeLocal.substring(11, 13));
    if (p === 'am') return h < 12;
    if (p === 'pm') return h >= 12 && h < 18;
    return h >= 18; // eve
  };

  // Upcoming flights matching the airport text — the pool the chips filter over.
  const pool = flights
    .filter((r) => !r.scheduledTimeLocal || new Date(r.scheduledTimeLocal) >= now)
    .filter((r) =>
      q
        ? r.originName.toLowerCase().includes(q) ||
          r.originIata.toLowerCase().includes(q) ||
          r.destName.toLowerCase().includes(q) ||
          r.destIata.toLowerCase().includes(q)
        : true,
    );

  // Per-period availability — drives chip disabling / count badges.
  const periodCount: Record<Period, number> = {
    all: pool.length,
    am: pool.filter((r) => inPeriod(r, 'am')).length,
    pm: pool.filter((r) => inPeriod(r, 'pm')).length,
    eve: pool.filter((r) => inPeriod(r, 'eve')).length,
  };

  const visible = pool
    .filter((r) => inPeriod(r, period))
    // Order by scheduled time, earliest first.
    .sort((a, b) => (a.scheduledTimeLocal ?? '').localeCompare(b.scheduledTimeLocal ?? ''));

  const airportPlaceholder = apiDir === 'departures'
    ? 'Dove vai? (es. London, STN)'
    : 'Da dove arrivi? (es. London, LGW)';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Cerca il tuo volo">
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onClose} aria-label="Indietro">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
            </svg>
          </button>
          <div className={styles.headerTitle}>Cerca il tuo volo</div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.segment} role="tablist" aria-label="Direzione">
            <button
              role="tab"
              aria-selected={apiDir === 'arrivals'}
              className={`${styles.segBtn} ${apiDir === 'arrivals' ? styles.segBtnOn : ''}`}
              onClick={() => setApiDir('arrivals')}
            >
              In arrivo a {airportCode}
            </button>
            <button
              role="tab"
              aria-selected={apiDir === 'departures'}
              className={`${styles.segBtn} ${apiDir === 'departures' ? styles.segBtnOn : ''}`}
              onClick={() => setApiDir('departures')}
            >
              In partenza da {airportCode}
            </button>
          </div>

          <label className={styles.dateBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
            </svg>
            <span className={styles.dateBtnText}>{formatDate(selectedDate)}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
            <input
              type="date"
              className={styles.dateNative}
              value={selectedDate}
              min={new Date().toISOString().substring(0, 10)}
              onChange={(e) => {
                const today = new Date().toISOString().substring(0, 10);
                if (e.target.value >= today) setSelectedDate(e.target.value);
              }}
              aria-label="Data del volo"
            />
          </label>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={airportPlaceholder}
              value={airportFilter}
              onChange={(e) => setAirportFilter(e.target.value)}
              aria-label="Filtra per aeroporto"
            />
          </div>

          <div className={styles.chips}>
            {PERIODS.map((p) => {
              const count = periodCount[p.id];
              const empty = loadState === 'done' && p.id !== 'all' && count === 0;
              return (
                <button
                  key={p.id}
                  className={`${styles.chip} ${period === p.id ? styles.chipOn : ''}`}
                  onClick={() => setPeriod(p.id)}
                  aria-pressed={period === p.id}
                  disabled={empty}
                  title={empty ? 'Nessun volo in questa fascia' : undefined}
                >
                  {p.label}{loadState === 'done' && p.id !== 'all' ? ` · ${count}` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className={styles.results}>
          <div className={styles.resultsHead}>
            <span className={styles.resultsCount}>
              {loadState === 'done' ? `${visible.length} voli` : 'Voli'} · {formatDate(selectedDate)}
            </span>
            <span className={styles.resultsHint}>Tocca per selezionare</span>
          </div>

          <div className={styles.resultsList}>
            {!selectedDate && (
              <EmptyState title="Scegli prima la data" body="Seleziona la data del volo per vedere i risultati." />
            )}
            {selectedDate && loadState === 'loading' && (
              <>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </>
            )}
            {selectedDate && loadState === 'error' && (
              <EmptyState title="Errore di caricamento" body="Riprova tra poco.">
                <button className={styles.retryBtn} onClick={() => setPeriod((p) => p)}>Riprova</button>
              </EmptyState>
            )}
            {selectedDate && loadState === 'done' && visible.length === 0 && (
              <EmptyState title="Nessun volo trovato" body="Prova a cambiare aeroporto, direzione o fascia oraria." />
            )}
            {selectedDate && loadState === 'done' && visible.map((row) => (
              <FlightCard key={`${row.number}-${row.scheduledTimeLocal}`} row={row} dir={apiDir} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function isOnTime(status: string): boolean {
  return !/gate|delay|cancel|board|divert/i.test(status || '');
}

function FlightCard({ row, dir, onSelect }: {
  row: FlightRow;
  dir: 'arrivals' | 'departures';
  onSelect: (r: FlightRow) => void;
}) {
  const time = row.scheduledTimeLocal?.substring(11, 16) ?? '';
  const label = dir === 'departures' ? 'DEPARTS' : 'ARRIVES';
  const route = dir === 'departures'
    ? `${row.originIata} → ${row.destName} ${row.destIata}`
    : `${row.originName} ${row.originIata} → ${row.destIata}`;
  const onTime = isOnTime(row.status);
  return (
    <button className={styles.card} onClick={() => onSelect(row)}>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardNo}>{row.number}</span>
          <span className={styles.cardLabel}>{label}</span>
        </div>
        <div className={styles.cardRoute}>{route}</div>
      </div>
      <div className={styles.cardRight}>
        <span className={styles.cardTime}>{time}</span>
        {row.status && (
          <span className={`${styles.statusPill} ${onTime ? styles.statusOk : styles.statusWarn}`}>{row.status}</span>
        )}
      </div>
    </button>
  );
}

function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className={styles.empty}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.emptyIcon}>
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
      <div className={styles.emptyTitle}>{title}</div>
      <div className={styles.emptyBody}>{body}</div>
      {children}
    </div>
  );
}

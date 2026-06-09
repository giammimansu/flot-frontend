import { useState, useEffect, useRef } from 'react';
import { fetchFlightByNumber } from '../../services/flights';
import type { ResolvedFlight } from '../../types/flights';
import { FlightSearchSheet } from './FlightSearchSheet';
import styles from './FlightInput.module.css';

interface FlightInputProps {
  value: string
  onChange: (code: string) => void
  onFlightResolved: (flight: ResolvedFlight | null) => void
  flightDate: string
  /** Trip direction label (e.g. "TO_ROME"); only the FROM_ prefix matters here. */
  direction: string
  /** Hub airport — drives flight search + display. */
  airportCode?: string
  airportName?: string
  onSheetOpenChange?: (open: boolean) => void
}

type Status = 'idle' | 'loading' | 'found' | 'not_found' | 'unavailable';

export function FlightInput({
  value,
  onChange,
  onFlightResolved,
  flightDate,
  direction,
  airportCode = 'MXP',
  airportName = 'Milan Malpensa',
  onSheetOpenChange,
}: FlightInputProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [resolved, setResolved] = useState<ResolvedFlight | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clean = value.replace(/\s/g, '').toUpperCase();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setResolved(null);
    onFlightResolved(null);

    if (clean.length < 4) {
      setStatus('idle');
      return;
    }

    if (!flightDate) {
      setStatus('idle');
      return;
    }

    setStatus('loading');

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const flight = await fetchFlightByNumber(clean, flightDate, controller.signal);
        if (controller.signal.aborted) return;

        if (flight) {
          setResolved(flight);
          setStatus('found');
          onFlightResolved(flight);
        } else {
          setStatus('not_found');
          onFlightResolved(null);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setStatus('unavailable');
        onFlightResolved(null);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [clean, flightDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (flight: ResolvedFlight) => {
    onChange(flight.flightNumber);
    setResolved(flight);
    setStatus('found');
    onFlightResolved(flight);
    setSheetOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} ${status === 'not_found' ? styles.inputError : ''}`}
          type="text"
          placeholder="es. AZ613"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={7}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label="Numero volo"
        />
        <StatusPill status={status} />
      </div>

      {!flightDate && clean.length >= 4 && (
        <span className={styles.hint}>Seleziona prima la data del volo</span>
      )}

      {status === 'found' && resolved && (
        <div className={styles.flightInfo}>
          <span className={styles.flightInfoHighlight}>{resolved.flightNumber}</span>
          {' · '}
          {resolved.origin}→{resolved.destination || airportCode}
          {' · partenza '}
          <span className={styles.flightInfoHighlight}>{resolved.displayTime}</span>
        </div>
      )}

      <button
        type="button"
        className={styles.findLink}
        onClick={() => { setSheetOpen(true); onSheetOpenChange?.(true); }}
      >
        Non conosci il numero del volo? Cercalo →
      </button>

      <FlightSearchSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); onSheetOpenChange?.(false); }}
        onSelect={handleSelect}
        flightDate={flightDate}
        direction={direction}
        airportCode={airportCode}
        airportName={airportName}
      />
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === 'idle') return null;
  if (status === 'loading') {
    return (
      <span className={`${styles.statusPill} ${styles.pillLoading}`}>
        <span className={styles.spinner} />
      </span>
    );
  }
  if (status === 'found') {
    return <span className={`${styles.statusPill} ${styles.pillFound}`}>✓ Trovato</span>;
  }
  if (status === 'not_found') {
    return <span className={`${styles.statusPill} ${styles.pillNotFound}`}>✗ Non trovato</span>;
  }
  return <span className={`${styles.statusPill} ${styles.pillUnavailable}`}>⚠ Non disponibile</span>;
}

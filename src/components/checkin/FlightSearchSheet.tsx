import { useState, useEffect, useRef } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { MSegment } from '../ui/MSegment';
import { fetchFlightsBySlot } from '../../services/flights';
import type { FlightRow, ResolvedFlight } from '../../types/flights';
import styles from './FlightSearchSheet.module.css';

interface FlightSearchSheetProps {
  open: boolean
  onClose: () => void
  onSelect: (flight: ResolvedFlight) => void
  flightDate: string
  direction: 'TO_MILAN' | 'FROM_MILAN'
}

type LoadState = 'idle' | 'loading' | 'done' | 'error';

const DIRECTION_OPTIONS = [
  { id: 'arrivals', label: '✈ Arriving at MXP' },
  { id: 'departures', label: '✈ Departing from MXP' },
];

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h < 24; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

function nearestSlot(slots: string[]): string {
  const now = new Date();
  const totalMins = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.round(totalMins / 30) * 30;
  const h = Math.floor(rounded / 60) % 24;
  const m = rounded % 60;
  const candidate = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return slots.includes(candidate) ? candidate : slots[0];
}

const SLOTS = buildSlots();

export function FlightSearchSheet({
  open,
  onClose,
  onSelect,
  flightDate,
  direction,
}: FlightSearchSheetProps) {
  const [apiDir, setApiDir] = useState<'arrivals' | 'departures'>(
    direction === 'FROM_MILAN' ? 'departures' : 'arrivals',
  );
  const [slot, setSlot] = useState(() => nearestSlot(SLOTS));
  const [selectedDate, setSelectedDate] = useState(flightDate || '');
  const [airportFilter, setAirportFilter] = useState('');
  const [flights, setFlights] = useState<FlightRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const activeSlotRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedDate(flightDate || '');
  }, [flightDate]);

  useEffect(() => {
    if (!open || !selectedDate) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadState('loading');
    setFlights([]);
    setAirportFilter('');

    fetchFlightsBySlot(apiDir, slot, selectedDate, controller.signal)
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
  }, [open, apiDir, slot, selectedDate]);

  useEffect(() => {
    if (open) {
      setTimeout(() => activeSlotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 100);
    }
  }, [open]);

  const handleSelect = (row: FlightRow) => {
    const flightTime = row.scheduledTimeLocal
      ? new Date(row.scheduledTimeLocal).toISOString()
      : '';
    const displayTime = row.scheduledTimeLocal?.substring(11, 16) ?? '';
    onSelect({
      flightNumber: row.number.replace(/\s/g, ''),
      origin: row.originIata,
      originName: row.originName,
      flightTime,
      displayTime,
      date: row.scheduledTimeLocal?.substring(0, 10) ?? selectedDate,
      status: row.status,
    });
  };

  return (
    <BottomSheet open={open} onClose={onClose} aria-label="Find your flight">
      <div className={styles.header}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        <span className={styles.headerTitle}>Find your flight</span>
        <span style={{ width: 32 }} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>You are…</div>
        <MSegment
          options={DIRECTION_OPTIONS}
          value={apiDir}
          onChange={(v) => { setApiDir(v as 'arrivals' | 'departures'); setSelectedDate(''); }}
          aria-label="Direction"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>{apiDir === 'arrivals' ? 'Arrival date' : 'Departure date'}</div>
        <div className={styles.dateInputWrapper}>
          <span className={styles.dateInputIcon}>📅</span>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            min={new Date().toISOString().substring(0, 10)}
            onChange={(e) => {
              const today = new Date().toISOString().substring(0, 10);
              if (e.target.value >= today) setSelectedDate(e.target.value);
            }}
            aria-label="Flight date"
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Roughly when?</div>
        <div className={styles.slotScroll} role="listbox" aria-label="Time slots">
          {SLOTS.map((s) => (
            <button
              key={s}
              ref={s === slot ? activeSlotRef : undefined}
              className={`${styles.slotChip} ${s === slot ? styles.slotChipActive : ''}`}
              onClick={() => setSlot(s)}
              role="option"
              aria-selected={s === slot}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>{apiDir === 'arrivals' ? 'From airport' : 'To airport'}</div>
        <input
          type="text"
          className={styles.dateInput}
          placeholder="e.g. London, LGW…"
          value={airportFilter}
          onChange={(e) => setAirportFilter(e.target.value)}
          aria-label="Filter by airport"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.flightList}>
          {!selectedDate && (
            <div className={styles.emptyState}>Select a date to see flights</div>
          )}
          {loadState === 'loading' && (
            <>
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
              <div className={styles.skeleton} />
            </>
          )}
          {loadState === 'done' && flights.length === 0 && (
            <div className={styles.emptyState}>No flights found for this slot</div>
          )}
          {loadState === 'error' && (
            <div className={styles.emptyState}>
              Couldn't load flights. Try again.
              <br />
              <button className={styles.retryBtn} onClick={() => setSlot((s) => s)}>
                Retry
              </button>
            </div>
          )}
          {loadState === 'done' && (() => {
            const q = airportFilter.trim().toLowerCase();
            const filtered = q
              ? flights.filter((r) =>
                  r.originName.toLowerCase().includes(q) ||
                  r.originIata.toLowerCase().includes(q) ||
                  r.destName.toLowerCase().includes(q) ||
                  r.destIata.toLowerCase().includes(q),
                )
              : flights;
            if (filtered.length === 0) return <div className={styles.emptyState}>No flights match "{airportFilter}"</div>;
            return filtered.map((row) => (
              <FlightRowItem key={row.number} row={row} onSelect={handleSelect} direction={apiDir} />
            ));
          })()}
        </div>
      </div>

    </BottomSheet>
  );
}

function FlightRowItem({ row, onSelect, direction }: { row: FlightRow; onSelect: (r: FlightRow) => void; direction: 'arrivals' | 'departures' }) {
  const time = row.scheduledTimeLocal?.substring(11, 16) ?? '';
  const timeLabel = direction === 'arrivals' ? 'lands' : 'departs';
  return (
    <div className={styles.flightRow} onClick={() => onSelect(row)} role="button" tabIndex={0}>
      <span className={styles.flightRowIcon}>✈</span>
      <div className={styles.flightRowBody}>
        <div className={styles.flightRowNumber}>{row.number}</div>
        <div className={styles.flightRowRoute}>{row.originName} ({row.originIata}) → {row.destName} ({row.destIata})</div>
        {row.status && <div className={styles.flightRowStatus}>{row.status}</div>}
      </div>
      <div className={styles.flightRowTime}>
        <div>{time}</div>
        <div className={styles.flightRowTimeLabel}>{timeLabel}</div>
      </div>
    </div>
  );
}

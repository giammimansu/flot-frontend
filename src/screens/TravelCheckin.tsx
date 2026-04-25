import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon, MSegment, MStepper, MBtn, MDestInput, BottomSheet } from '../components/ui';
import { HomeIndicator } from '../components/layout';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useAuthStore } from '../stores/authStore';
import { buildDestinations, findZoneForDestination } from '../lib/buildDestinations';
import { formatCurrency, calcSavings } from '../lib/formatters';
import { DEFAULT_DIRECTION } from '../lib/constants';
import styles from './TravelCheckin.module.css';

/**
 * Destination Sheet — search and pick a destination.
 * All destinations come from airport zone config, never hardcoded.
 */
function DestSheet({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (name: string) => void;
}) {
  const [query, setQuery] = useState('');
  const airport = useAirportStore((s) => s.selectedAirport);
  const destinations = useMemo(
    () => (airport ? buildDestinations(airport) : []),
    [airport],
  );

  const filtered = query
    ? destinations.filter((d) =>
        d.name.toLowerCase().includes(query.toLowerCase()),
      )
    : destinations;

  return (
    <>
      {/* Sheet header */}
      <div className={styles.sheetHeader}>
        <h3 className={styles.sheetTitle}>Where are you going?</h3>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <MIcon name="x" size={16} sw={2.5} />
        </button>
      </div>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <MIcon name="search" size={18} color="var(--ink-subtle)" />
        <input
          autoFocus
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destination…"
          aria-label="Search destination"
        />
      </div>

      {/* Results */}
      <div>
        {filtered.length === 0 && (
          <div className={styles.emptySearch}>No destinations found</div>
        )}
        {filtered.map((dest) => (
          <button
            key={dest.name}
            className={styles.destItem}
            onClick={() => onPick(dest.name)}
          >
            <div className={styles.destItemIcon}>
              <MIcon name="map-pin" size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={styles.destItemName}>{dest.name}</div>
              <div className={styles.destItemSub}>{dest.sub}</div>
            </div>
            <span className={styles.destItemZone}>{dest.zone}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * Travel Check-in screen.
 * - Terminal selection (from airport config)
 * - Destination picker (bottom sheet from airport zones)
 * - Passengers + Luggage steppers
 * - Dynamic savings calculation
 * - POST /trips on submit
 */
export function TravelCheckin() {
  const navigate = useNavigate();
  const airport = useAirportStore((s) => s.selectedAirport);
  const submitTrip = useTripStore((s) => s.submitTrip);
  const tripStatus = useTripStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // Form state
  const [terminal, setTerminal] = useState(
    airport?.terminals[0]?.label ?? 'Terminal 1',
  );
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Dynamic values from airport config
  const baseFare = airport?.baseFare ?? 12000;
  const currency = airport?.currency ?? 'EUR';
  const terminalOptions = airport?.terminals.map((t) => t.label) ?? ['Terminal 1', 'Terminal 2'];
  const savings = calcSavings(baseFare, passengers);
  const ready = !!destination;
  const isSubmitting = tripStatus === 'creating';

  // User initials for avatar
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
        .toUpperCase()
        .trim() || '?'
    : '?';

  const handleSubmit = async () => {
    if (!airport || !destination) return;

    // Find terminal code from label
    const terminalObj = airport.terminals.find((t) => t.label === terminal);
    const terminalCode = terminalObj?.code ?? 'T1';

    // Find zone for destination
    const destZone = findZoneForDestination(airport, destination) ?? '';

    const result = await submitTrip({
      airportCode: airport.code,
      terminal: terminalCode,
      direction: DEFAULT_DIRECTION,
      destination,
      destZone,
      flightTime: new Date().toISOString(), // TODO: add flight time picker
      paxCount: passengers,
      luggage,
    });

    if (result) {
      navigate('/search');
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.scrollable}>
        {/* Custom top nav: back + FLOT + avatar */}
        <div style={{
          padding: '16px 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            className={styles.closeBtn}
            style={{
              width: 40,
              height: 40,
              border: '1px solid var(--hairline)',
              background: 'var(--surface-1)',
              borderRadius: 'var(--radius-pill)',
            }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <MIcon name="chevron-left" size={20} />
          </button>
          <span className={styles.navCenter}>FLOT</span>
          <div className={styles.avatar}>{initials}</div>
        </div>

        {/* Hero copy */}
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>Where are you headed?</h2>
          <p className={styles.heroSub}>
            Tell us your terminal, destination and party size.
          </p>
        </div>

        {/* Terminal */}
        <div className={styles.formSection}>
          <div className={styles.sectionLabel}>Terminal</div>
          <MSegment
            options={terminalOptions}
            value={terminal}
            onChange={setTerminal}
            aria-label="Select terminal"
          />
        </div>

        {/* Destination */}
        <div className={styles.formSectionSm}>
          <div className={styles.sectionLabel}>Destination</div>
          <MDestInput
            value={destination}
            placeholder="Where are you going?"
            onClick={() => setSheetOpen(true)}
            aria-label="Select destination"
          />
        </div>

        {/* Passengers + Luggage */}
        <div className={styles.formSectionSm}>
          <div className={styles.stepperGrid}>
            <div className={styles.stepperCard}>
              <div className={styles.stepperHeader}>
                <MIcon name="users" size={16} />
                <span className={styles.stepperLabel}>Passengers</span>
              </div>
              <MStepper
                value={passengers}
                onChange={setPassengers}
                min={1}
                max={4}
                aria-label="Number of passengers"
              />
            </div>
            <div className={styles.stepperCard}>
              <div className={styles.stepperHeader}>
                <MIcon name="luggage" size={16} />
                <span className={styles.stepperLabel}>Luggage</span>
              </div>
              <MStepper
                value={luggage}
                onChange={setLuggage}
                min={0}
                max={4}
                aria-label="Number of luggage items"
              />
            </div>
          </div>
        </div>

        {/* Savings card */}
        <div className={styles.savingsCard}>
          <div className={styles.savingsIcon}>
            <MIcon name="sparkles" size={18} sw={2} />
          </div>
          <div>
            <div className={styles.savingsText}>
              You could save{' '}
              <span className={styles.savingsAmount}>
                ~{formatCurrency(savings, currency)}
              </span>
            </div>
            <div className={styles.savingsNote}>
              Fixed {formatCurrency(baseFare, currency)} fare split in{' '}
              {passengers + 1}
            </div>
          </div>
        </div>

        {/* CTA spacer */}
        <div className={styles.ctaSpacer} />
      </div>

      {/* Floating CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 20px 28px',
        background: 'linear-gradient(transparent, var(--surface-0) 24px)',
        zIndex: 50,
      }}>
        <MBtn
          variant="primary"
          disabled={!ready || isSubmitting}
          icon="search"
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Looking…' : 'Find my ride partner'}
        </MBtn>
      </div>

      {/* Destination bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        aria-label="Select destination"
      >
        <DestSheet
          onClose={() => setSheetOpen(false)}
          onPick={(name) => {
            setDestination(name);
            setSheetOpen(false);
          }}
        />
      </BottomSheet>

      <HomeIndicator />
    </div>
  );
}

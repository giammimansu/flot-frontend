import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon } from '../components/ui';
import { TopNav, HomeIndicator } from '../components/layout';
import { useAirportStore } from '../stores/airportStore';
import { formatCurrency } from '../lib/formatters';
import styles from './AirportPicker.module.css';

/**
 * Airport Picker screen.
 * - Fetches GET /airports on mount
 * - If only 1 active airport → auto-select and skip to /check-in
 * - Otherwise shows a list of airports to pick from
 */
export function AirportPicker() {
  const navigate = useNavigate();
  const { airports, loading, error, selectedAirport, loadAirports, selectAirport } =
    useAirportStore();

  // Load airports on mount
  useEffect(() => {
    loadAirports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-skip if single airport or already selected
  useEffect(() => {
    if (selectedAirport) {
      navigate('/check-in', { replace: true });
    }
  }, [selectedAirport, navigate]);

  const handleSelect = (code: string) => {
    selectAirport(code);
    navigate('/check-in');
  };

  return (
    <div className={styles.screen}>
      <TopNav
        showLogo
        actions={[
          {
            icon: 'help-circle',
            onClick: () => { /* Help */ },
            'aria-label': 'Help',
          },
        ]}
      />

      <div className={styles.content}>
        <h2 className={styles.headline}>Where are you flying from?</h2>
        <p className={styles.subtitle}>
          Select your departure airport to get started.
        </p>

        {/* Loading */}
        {loading && (
          <>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </>
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Airport list */}
        {!loading && !error && airports.map((airport) => (
          <button
            key={airport.code}
            className={styles.airportCard}
            onClick={() => handleSelect(airport.code)}
            aria-label={`Select ${airport.name}`}
          >
            <div className={styles.airportIconWrap}>
              <MIcon name="plane-landing" size={22} />
            </div>
            <div>
              <div className={styles.airportName}>{airport.name}</div>
              <div className={styles.airportCity}>
                {airport.city}, {airport.country} · Base fare{' '}
                {formatCurrency(airport.baseFare, airport.currency)}
              </div>
            </div>
            <div className={styles.chevron}>
              <MIcon name="chevron-right" size={20} color="var(--ink-subtle)" />
            </div>
          </button>
        ))}
      </div>

      <HomeIndicator />
    </div>
  );
}

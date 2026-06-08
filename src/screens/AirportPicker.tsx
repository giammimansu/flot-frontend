import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { airports, loading, error, selectedAirport, loadAirports, selectAirport } =
    useAirportStore();

  const forceChange = (location.state as { force?: boolean } | null)?.force === true;

  // Load airports on mount
  useEffect(() => {
    loadAirports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-skip if single airport or already selected — but not when user explicitly wants to change
  useEffect(() => {
    if (selectedAirport && !forceChange) {
      navigate('/check-in', { replace: true });
    }
  }, [selectedAirport, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (code: string) => {
    selectAirport(code);
    if (forceChange) {
      navigate(-1);
    } else {
      navigate('/check-in');
    }
  };

  return (
    <div className={styles.screen}>
      {forceChange ? (
        <TopNav showBack showAvatar={false} />
      ) : (
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
      )}

      <div className={styles.content}>
        <h2 className={styles.headline}>
          {forceChange ? 'Change airport' : 'Where are you flying from?'}
        </h2>
        <p className={styles.subtitle}>
          {forceChange
            ? 'Select a different departure airport.'
            : 'Select your departure airport to get started.'}
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
        {!loading && !error && airports.map((apt) => {
          const isSelected = selectedAirport?.code === apt.code;
          return (
            <button
              key={apt.code}
              className={`${styles.airportCard} ${isSelected ? styles.airportCardSelected : ''}`}
              onClick={() => handleSelect(apt.code)}
              aria-label={`Select ${apt.name}`}
              aria-pressed={isSelected}
            >
              <div className={`${styles.airportIconWrap} ${isSelected ? styles.airportIconSelected : ''}`}>
                {isSelected
                  ? <MIcon name="check" size={22} />
                  : <MIcon name="plane-landing" size={22} />}
              </div>
              <div>
                <div className={styles.airportName}>{apt.name}</div>
                <div className={styles.airportCity}>
                  {apt.city}, {apt.country} · Base fare{' '}
                  {formatCurrency(apt.baseFare, apt.currency)}
                </div>
              </div>
              <div className={styles.chevron}>
                <MIcon name="chevron-right" size={20} color="var(--ink-subtle)" />
              </div>
            </button>
          );
        })}
      </div>

      <HomeIndicator />
    </div>
  );
}

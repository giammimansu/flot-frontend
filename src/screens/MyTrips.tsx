import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon, MSegment, MBtn } from '../components/ui';
import { TripCard } from '../components/trips/TripCard';
import { PushPrompt } from '../components/trips/PushPrompt';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { getMyTrips, cancelTrip } from '../services/trips';
import type { MyTripsResponse } from '../types/api';
import styles from './MyTrips.module.css';

export function MyTrips() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const airport = useAirportStore((s) => s.selectedAirport);
  const [trips, setTrips] = useState<MyTripsResponse['trips']>([]);
  const [tab, setTab] = useState<'attivi' | 'passati'>('attivi');
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    try {
      const data = await getMyTrips();
      // Sort desc by createdAt
      const sorted = data.trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTrips(sorted);
    } catch {
      // Silent fail — show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCancel = async (tripId: string) => {
    if (!window.confirm('Vuoi cancellare questa prenotazione?')) return;
    try {
      await cancelTrip(tripId);
      // Refresh list
      fetchTrips();
    } catch {
      alert('Impossibile cancellare il viaggio.');
    }
  };

  const activeStatuses = ['scheduled', 'searching', 'matched', 'unlocked'];
  const pastStatuses = ['completed', 'expired', 'cancelled'];

  const displayedTrips = trips.filter(t => 
    tab === 'attivi' ? activeStatuses.includes(t.status) : pastStatuses.includes(t.status)
  );

  const totalSaved = trips
    .filter(t => t.status === 'completed' || t.status === 'unlocked')
    .length * Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const totalCompleted = trips.filter(t => t.status === 'completed').length;

  const initials = user?.firstName ? user.firstName[0].toUpperCase() : 'U';

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.greeting}>Ciao, {user?.firstName || 'Viaggiatore'} 👋</div>
          <h1 className={styles.title}>I miei viaggi</h1>
        </div>
        <div className={styles.avatar}>{initials}</div>
      </header>

      <div className={styles.statsStrip}>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statValue}>
            <MIcon name="sparkles" size={18} sw={2} />
            €{totalSaved}
          </div>
          <div className={styles.statLabel}>risparmiati</div>
        </div>
        <div className={`${styles.statCard} ${styles.surface}`}>
          <div className={styles.statValue}>
            <MIcon name="check" size={18} sw={2} />
            {totalCompleted}
          </div>
          <div className={styles.statLabel}>completati</div>
        </div>
      </div>

      <div className={styles.pushPromptWrap}>
        <PushPrompt />
      </div>

      <div className={styles.tabs}>
        <MSegment
          options={[
            { id: 'attivi', label: `Attivi (${trips.filter(t => activeStatuses.includes(t.status)).length})` },
            { id: 'passati', label: `Passati (${trips.filter(t => pastStatuses.includes(t.status)).length})` },
          ]}
          value={tab}
          onChange={(v) => setTab(v as 'attivi' | 'passati')}
        />
      </div>

      <div className={styles.list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>Caricamento...</div>
        ) : displayedTrips.length > 0 ? (
          displayedTrips.map(trip => (
            <TripCard key={trip.tripId} trip={trip} onCancelClick={handleCancel} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyCircle}>
              <MIcon name="search" size={28} sw={2} />
            </div>
            <div className={styles.emptyTitle}>Nessun viaggio qui</div>
            <div className={styles.emptySub}>I tuoi viaggi appariranno qui</div>
            <MBtn variant="primary" onClick={() => navigate('/check-in')}>
              Prenota un viaggio
            </MBtn>
          </div>
        )}
      </div>

      <button className={styles.fab} onClick={() => navigate('/check-in')}>
        <MIcon name="plus" size={26} sw={2.5} />
      </button>
    </div>
  );
}

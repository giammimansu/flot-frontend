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
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTrips = async () => {
    setFetchError(null);
    try {
      const data = await getMyTrips();
      // Sort desc by createdAt
      const sorted = data.trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTrips(sorted);
    } catch (err) {
      console.error('getMyTrips failed:', err);
      setFetchError('Could not load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCancel = async (tripId: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await cancelTrip(tripId);
      // Refresh list
      fetchTrips();
    } catch {
      alert('Could not cancel the trip.');
    }
  };

  const activeStatuses = ['scheduled', 'searching', 'matched', 'unlocked'];
  const pastStatuses = ['completed', 'expired', 'cancelled'];

  const displayedTrips = trips.filter(t =>
    tab === 'active' ? activeStatuses.includes(t.status) : pastStatuses.includes(t.status)
  );

  const totalSaved = trips
    .filter(t => t.status === 'completed' || t.status === 'unlocked')
    .length * Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const totalCompleted = trips.filter(t => t.status === 'completed').length;

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase().trim() || '?'
    : '?';

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.greeting}>Hey, {user?.firstName || 'Traveler'} 👋</div>
          <h1 className={styles.title}>My trips</h1>
        </div>
        <div className={styles.avatar}>{initials}</div>
      </header>

      <div className={styles.statsStrip}>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statValue}>
            <MIcon name="sparkles" size={18} sw={2} />
            €{totalSaved}
          </div>
          <div className={styles.statLabel}>saved</div>
        </div>
        <div className={`${styles.statCard} ${styles.surface}`}>
          <div className={styles.statValue}>
            <MIcon name="check" size={18} sw={2} />
            {totalCompleted}
          </div>
          <div className={styles.statLabel}>completed</div>
        </div>
      </div>

      <div className={styles.pushPromptWrap}>
        <PushPrompt />
      </div>

      <div className={styles.tabs}>
        <MSegment
          options={[
            { id: 'active', label: `Active (${trips.filter(t => activeStatuses.includes(t.status)).length})` },
            { id: 'past', label: `Past (${trips.filter(t => pastStatuses.includes(t.status)).length})` },
          ]}
          value={tab}
          onChange={(v) => setTab(v as 'active' | 'past')}
        />
      </div>

      <div className={styles.list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>Loading...</div>
        ) : fetchError ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyCircle}>
              <MIcon name="x" size={28} sw={2} />
            </div>
            <div className={styles.emptyTitle}>Network error</div>
            <div className={styles.emptySub}>{fetchError}</div>
            <MBtn variant="primary" onClick={() => { setLoading(true); fetchTrips(); }}>
              Retry
            </MBtn>
          </div>
        ) : displayedTrips.length > 0 ? (
          displayedTrips.map(trip => (
            <TripCard key={trip.tripId} trip={trip} onCancelClick={handleCancel} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyCircle}>
              <MIcon name="search" size={28} sw={2} />
            </div>
            <div className={styles.emptyTitle}>No trips here</div>
            <div className={styles.emptySub}>Your trips will appear here</div>
            <MBtn variant="primary" onClick={() => navigate('/check-in')}>
              Book a trip
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

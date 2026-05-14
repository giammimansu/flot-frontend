import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MIcon, MSegment, MBtn } from '../components/ui';
import { BottomSheet } from '../components/ui/BottomSheet';
import { TripCard } from '../components/trips/TripCard';
import { PushPrompt } from '../components/trips/PushPrompt';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { getMyTrips, cancelTrip } from '../services/trips';
import type { MyTripsResponse } from '../types/api';
import { TopNav } from '../components/layout/TopNav';
import styles from './MyTrips.module.css';

export function MyTrips() {
  const navigate = useNavigate();
  const location = useLocation();
  const cancelledTripId = (location.state as { cancelledTripId?: string } | null)?.cancelledTripId;
  const { user } = useAuth();
  const airport = useAirportStore((s) => s.selectedAirport);
  const [trips, setTrips] = useState<MyTripsResponse['trips']>([]);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cancelTripId, setCancelTripId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchTrips = async () => {
    setFetchError(null);
    try {
      const data = await getMyTrips();
      // Sort desc by createdAt
      const sorted = data.trips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const patched = cancelledTripId
        ? sorted.map(t => t.tripId === cancelledTripId ? { ...t, status: 'cancelled' as const } : t)
        : sorted;
      setTrips(patched);
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

  const handleCancel = (tripId: string) => {
    setCancelTripId(tripId);
  };

  const confirmCancel = async () => {
    if (!cancelTripId) return;
    const idToCancel = cancelTripId;
    setCancelling(true);
    try {
      await cancelTrip(idToCancel);
      setTrips(prev => prev.map(t => t.tripId === idToCancel ? { ...t, status: 'cancelled' } : t));
      setCancelTripId(null);
      fetchTrips();
    } catch {
      setCancelTripId(null);
    } finally {
      setCancelling(false);
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

  return (
    <div className={styles.screen}>
      <TopNav showLogo />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.greeting}>Hey, {user?.firstName || 'Traveler'} 👋</div>
          <h1 className={styles.title}>My trips</h1>
        </div>
      </header>

      <div className={styles.statsStrip}>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statValue}>
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

      <BottomSheet
        open={!!cancelTripId}
        onClose={() => setCancelTripId(null)}
        aria-label="Cancel booking"
      >
        <div className={styles.cancelSheet}>
          <h2 className={styles.cancelTitle}>Vuoi davvero cancellare il viaggio?</h2>
          <MBtn variant="dark" onClick={confirmCancel} loading={cancelling}>
            Sì
          </MBtn>
          <MBtn variant="secondary" onClick={() => setCancelTripId(null)} disabled={cancelling}>
            No
          </MBtn>
        </div>
      </BottomSheet>
    </div>
  );
}

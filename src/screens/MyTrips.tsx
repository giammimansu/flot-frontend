import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MIcon, MSegment, MBtn } from '../components/ui';
import { BottomSheet } from '../components/ui/BottomSheet';
import { TripCard } from '../components/trips/TripCard';
import { PushPrompt } from '../components/trips/PushPrompt';
import { ReviewSheet } from '../components/ReviewSheet/ReviewSheet';
import { NotificationsSheet } from '../components/NotificationsSheet/NotificationsSheet';
import { getNotifications } from '../services/notifications';
import type { NotificationItem } from '../types/api';
import { useAuth } from '../hooks/useAuth';
import { useAirportStore } from '../stores/airportStore';
import { getMyTrips, cancelTrip } from '../services/trips';
import { getReviewedMatchIds, markMatchReviewed } from '../lib/reviewedMatches';
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
  const [reviewMatchId, setReviewMatchId] = useState<string | null>(null);
  const [reviewedMatchIds, setReviewedMatchIds] = useState<Set<string>>(() => getReviewedMatchIds());
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
      setFetchError('Impossibile caricare i viaggi. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    getNotifications()
      .then((res) => {
        setNotifs(res.notifications);
        setUnreadCount(res.notifications.filter((n) => !n.read).length);
      })
      .catch(() => { /* feed is best-effort */ })
      .finally(() => setNotifsLoading(false));
  }, []);

  const openNotifs = () => {
    setNotifsOpen(true);
    setUnreadCount(0); // mark seen locally (no backend mark-read endpoint)
  };

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
          <div className={styles.greeting}>Ciao, {user?.firstName || user?.name?.split(' ')[0] || 'Viaggiatore'} 👋</div>
          <h1 className={styles.title}>I tuoi viaggi</h1>
        </div>
        <button
          type="button"
          className={styles.bellBtn}
          onClick={openNotifs}
          aria-label={`Notifiche${unreadCount ? `, ${unreadCount} non lette` : ''}`}
        >
          🔔
          {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
      </header>

      <div className={styles.statsStrip}>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statValue}>
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
            { id: 'active', label: `Attivi (${trips.filter(t => activeStatuses.includes(t.status)).length})` },
            { id: 'past', label: `Passati (${trips.filter(t => pastStatuses.includes(t.status)).length})` },
          ]}
          value={tab}
          onChange={(v) => setTab(v as 'active' | 'past')}
        />
      </div>

      <div className={styles.list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>Caricamento…</div>
        ) : fetchError ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyCircle}>
              <MIcon name="x" size={28} sw={2} />
            </div>
            <div className={styles.emptyTitle}>Errore di rete</div>
            <div className={styles.emptySub}>{fetchError}</div>
            <MBtn variant="primary" onClick={() => { setLoading(true); fetchTrips(); }}>
              Riprova
            </MBtn>
          </div>
        ) : displayedTrips.length > 0 ? (
          displayedTrips.map(trip => (
            <TripCard
              key={trip.tripId}
              trip={trip}
              onCancelClick={handleCancel}
              onReviewClick={setReviewMatchId}
              reviewed={!!trip.matchId && reviewedMatchIds.has(trip.matchId)}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyCircle}>
              <MIcon name="search" size={28} sw={2} />
            </div>
            <div className={styles.emptyTitle}>Nessun viaggio qui</div>
            <div className={styles.emptySub}>I tuoi viaggi appariranno qui</div>
            <MBtn variant="primary" onClick={() => navigate('/')}>
              Prenota un viaggio
            </MBtn>
          </div>
        )}
      </div>

      <button className={styles.fab} onClick={() => navigate('/')}>
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

      <ReviewSheet
        open={!!reviewMatchId}
        matchId={reviewMatchId}
        onClose={() => setReviewMatchId(null)}
        onSubmitted={(matchId) => {
          markMatchReviewed(matchId);
          setReviewedMatchIds((prev) => new Set(prev).add(matchId));
          setReviewMatchId(null);
        }}
      />

      <NotificationsSheet
        open={notifsOpen}
        items={notifs}
        loading={notifsLoading}
        onClose={() => setNotifsOpen(false)}
      />
    </div>
  );
}

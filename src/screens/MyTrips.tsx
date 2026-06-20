import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { MIcon, MBtn } from '../components/ui';
import { BottomSheet } from '../components/ui/BottomSheet';
import { TripCard } from '../components/trips/TripCard';
import { PushPrompt } from '../components/trips/PushPrompt';
import { ReviewSheet } from '../components/ReviewSheet/ReviewSheet';
import { NotificationsSheet } from '../components/NotificationsSheet/NotificationsSheet';
import { getNotifications } from '../services/notifications';
import type { NotificationItem } from '../types/api';
import { getMyTrips, cancelTrip } from '../services/trips';
import { getReviewedMatchIds, markMatchReviewed } from '../lib/reviewedMatches';
import type { MyTripsResponse } from '../types/api';
import styles from './MyTrips.module.css';

export function MyTrips() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const cancelledTripId = (location.state as { cancelledTripId?: string } | null)?.cancelledTripId;
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

  // Deep-link from a review-reminder push: /my-trips?review=<matchId>
  useEffect(() => {
    const reviewParam = searchParams.get('review');
    if (!reviewParam) return;
    setTab('past');
    setReviewMatchId(reviewParam);
    // Consume the param so refresh/back doesn't re-open the sheet.
    searchParams.delete('review');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

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

  const activeCount = trips.filter(t => activeStatuses.includes(t.status)).length;
  const pastCount = trips.filter(t => pastStatuses.includes(t.status)).length;

  const displayedTrips = trips.filter(t =>
    tab === 'active' ? activeStatuses.includes(t.status) : pastStatuses.includes(t.status)
  );

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Viaggi</h1>
          <div className={styles.subtitle}>I tuoi taxi condivisi</div>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={openNotifs}
          aria-label={`Notifiche${unreadCount ? `, ${unreadCount} non lette` : ''}`}
        >
          <MIcon name="bell" size={19} sw={2} />
          {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
      </header>

      <div className={styles.tabs}>
        <div className={styles.segment}>
          <button
            type="button"
            className={tab === 'active' ? styles.segOn : styles.segOff}
            onClick={() => setTab('active')}
          >
            <span>Attivi</span>
            <span className={tab === 'active' ? styles.chipOn : styles.chipOff}>{activeCount}</span>
          </button>
          <button
            type="button"
            className={tab === 'past' ? styles.segOn : styles.segOff}
            onClick={() => setTab('past')}
          >
            <span>Passati</span>
            <span className={tab === 'past' ? styles.chipOn : styles.chipOff}>{pastCount}</span>
          </button>
        </div>
      </div>

      <div className={styles.pushPromptWrap}>
        <PushPrompt />
      </div>

      <div className={styles.list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--neutral-500)' }}>Caricamento…</div>
        ) : fetchError ? (
          <div className={styles.emptyState}>
            <div className={`${styles.emptyCircle} ${styles.emptyCircleError}`}>
              <MIcon name="x" size={40} sw={2} />
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
              <MIcon name="route" size={44} sw={2} color="var(--primary-400)" />
            </div>
            <div className={styles.emptyTitle}>Nessun viaggio qui</div>
            <div className={styles.emptySub}>
              Quando prenoti una tratta, la trovi qui. Inizia condividendo un taxi da Malpensa.
            </div>
            <MBtn variant="primary" icon="plus" onClick={() => navigate('/')}>
              Prenota un viaggio
            </MBtn>
          </div>
        )}
      </div>

      <button className={styles.fab} onClick={() => navigate('/')} aria-label="Prenota un viaggio">
        <MIcon name="plus" size={28} sw={2.5} />
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

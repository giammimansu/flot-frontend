import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MIcon, MBtn } from '../components/ui';
import { ReviewSheet } from '../components/ReviewSheet/ReviewSheet';
import { PartnerProfileSheet } from '../components/PartnerProfileSheet/PartnerProfileSheet';
import { TopNav } from '../components/layout/TopNav';
import { useAirportStore } from '../stores/airportStore';
import { useAuthStore } from '../stores/authStore';
import { getMyTrips } from '../services/trips';
import { fetchMatch, fetchPartnerProfile, partnerIdOf } from '../services/matches';
import { formatDateShort, formatTimeShort } from '../lib/formatters';
import { isMatchReviewed, markMatchReviewed } from '../lib/reviewedMatches';
import type { MyTripsResponse, UnlockedPartner } from '../types/api';
import styles from './TripPast.module.css';

type PastTrip = MyTripsResponse['trips'][0];

export function TripPast() {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const airport = useAirportStore((s) => s.selectedAirport);
  const airports = useAirportStore((s) => s.airports);
  const loadAirports = useAirportStore((s) => s.loadAirports);
  const selectAirport = useAirportStore((s) => s.selectAirport);
  const currentUser = useAuthStore((s) => s.user);

  const [trip, setTrip] = useState<PastTrip | null>(null);
  const [partner, setPartner] = useState<UnlockedPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyTrips();
        const found = res.trips.find((t) => t.tripId === tripId) ?? null;
        if (cancelled) return;
        setTrip(found);
        if (found?.matchId) setReviewed(isMatchReviewed(found.matchId));
        if (found?.matchId && currentUser) {
          try {
            const match = await fetchMatch(found.matchId);
            const p = await fetchPartnerProfile(partnerIdOf(match, currentUser.userId));
            if (!cancelled) setPartner(p);
          } catch { /* partner is best-effort */ }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tripId, currentUser]);

  // Load airports on refresh / direct link.
  useEffect(() => {
    if (!airport && airports.length === 0) loadAirports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!airport && airports.length > 0 && trip?.airportCode) selectAirport(trip.airportCode);
  }, [airports, trip]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className={styles.screen}>
        <TopNav showBack />
        <div className={styles.center}>Caricamento…</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className={styles.screen}>
        <TopNav showBack />
        <div className={styles.center}>Viaggio non trovato.</div>
      </div>
    );
  }

  const terminalCode = trip.terminal || '';
  const airportShort = (airport?.name?.replace(/^Milano\s+/i, '') || trip.airportCode).trim();
  const airportLabel = terminalCode ? `${airportShort} ${terminalCode}` : airportShort;
  const cityLabel = (trip.originLabel || 'Milano').split(',')[0].trim();
  const isFromMilan = trip.direction === 'FROM_MILAN';
  const fromLabel = isFromMilan ? cityLabel : airportLabel;
  const toLabel = isFromMilan ? airportLabel : cityLabel;

  const partnerName = partner
    ? `${partner.firstName ?? ''} ${partner.lastName ?? ''}`.trim()
    : null;
  const partnerInitials = partner
    ? `${partner.firstName?.[0] ?? ''}${partner.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const isCompleted = trip.status === 'completed';
  const statusLabel = isCompleted ? 'Completato' : trip.status === 'expired' ? 'Scaduto' : 'Annullato';

  return (
    <div className={styles.screen}>
      <TopNav showBack right={<div className={styles.tripBadge}>#{trip.tripId.slice(-6).toUpperCase()}</div>} />

      <div className={styles.scrollArea}>
        <div className={styles.statusRow}>
          <span className={styles.statusPill}>{statusLabel}</span>
          <span className={styles.date}>
            {formatDateShort(trip.flightTime)} · {formatTimeShort(trip.flightTime)}
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.routeSection}>
            <div className={styles.routeVisual}>
              <div className={styles.routeDotOutline} />
              <div className={styles.routeLine} />
              <div className={styles.routeDotFill} />
            </div>
            <div className={styles.routeDetails}>
              <div className={styles.routeStep}>
                <span className={styles.routeLabel}>Da</span>
                <span className={styles.routeValue}>{fromLabel}</span>
              </div>
              <div className={styles.routeStep}>
                <span className={styles.routeLabel}>A</span>
                <span className={styles.routeValue}>{toLabel}</span>
              </div>
            </div>
          </div>
          {trip.flightNumber && (
            <>
              <div className={styles.divider} />
              <div className={styles.flightRow}>
                <MIcon name="plane-landing" size={14} sw={2} />
                <span className={styles.flightNumber}>{trip.flightNumber}</span>
              </div>
            </>
          )}
        </div>

        {trip.matchId && (
          <div className={styles.card}>
            <div className={styles.sectionTitle}>Con chi hai viaggiato</div>
            {partnerName && partner ? (
              <button
                type="button"
                className={styles.partnerRow}
                onClick={() => setProfileOpen(true)}
                aria-label={`Vedi profilo di ${partner.firstName}`}
              >
                {partner.photoUrl ? (
                  <img src={partner.photoUrl} alt={partnerName} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>{partnerInitials}</div>
                )}
                <div className={styles.partnerInfo}>
                  <div className={styles.partnerName}>{partnerName}</div>
                  {partner.city && <div className={styles.partnerCity}>{partner.city}</div>}
                </div>
                <MIcon name="chevron-right" size={18} sw={2} />
              </button>
            ) : (
              <div className={styles.partnerMuted}>Compagno non disponibile</div>
            )}
          </div>
        )}
      </div>

      {isCompleted && trip.matchId && (
        <div className={styles.actionArea}>
          {reviewed ? (
            <MBtn variant="ghost" disabled icon="check">Recensito</MBtn>
          ) : (
            <MBtn variant="primary" icon="sparkles" onClick={() => setReviewOpen(true)}>
              Lascia recensione
            </MBtn>
          )}
        </div>
      )}

      <ReviewSheet
        open={reviewOpen}
        matchId={trip.matchId}
        partnerName={partner?.firstName}
        onClose={() => setReviewOpen(false)}
        onSubmitted={(matchId) => {
          markMatchReviewed(matchId);
          setReviewed(true);
          setReviewOpen(false);
        }}
      />

      {partner && (
        <PartnerProfileSheet
          open={profileOpen}
          partner={partner}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}

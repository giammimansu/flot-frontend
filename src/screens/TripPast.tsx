import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MIcon } from '../components/ui';
import { ReviewSheet } from '../components/ReviewSheet/ReviewSheet';
import { PartnerProfileSheet } from '../components/PartnerProfileSheet/PartnerProfileSheet';
import { useAirportStore } from '../stores/airportStore';
import { useAuthStore } from '../stores/authStore';
import { getMyTrips } from '../services/trips';
import { fetchMatch, fetchPartnerProfile, partnerIdOf } from '../services/matches';
import { formatDateShort, formatTimeShort } from '../lib/formatters';
import { isMatchReviewed, markMatchReviewed } from '../lib/reviewedMatches';
import type { Match, MyTripsResponse, UnlockedPartner } from '../types/api';
import styles from './TripPast.module.css';

type PastTrip = MyTripsResponse['trips'][0];

function initialsOf(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

export function TripPast() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const airport = useAirportStore((s) => s.selectedAirport);
  const airports = useAirportStore((s) => s.airports);
  const loadAirports = useAirportStore((s) => s.loadAirports);
  const selectAirport = useAirportStore((s) => s.selectAirport);
  const currentUser = useAuthStore((s) => s.user);

  const [trip, setTrip] = useState<PastTrip | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
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
            const m = await fetchMatch(found.matchId);
            if (!cancelled) setMatch(m);
            const p = await fetchPartnerProfile(partnerIdOf(m, currentUser.userId));
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
    return <div className={styles.screen}><div className={styles.center}>Caricamento…</div></div>;
  }
  if (!trip) {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Indietro">
            <MIcon name="chevron-left" size={20} sw={2} />
          </button>
        </header>
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
  const fromSub = isFromMilan
    ? 'Milano'
    : (terminalCode ? `Stand taxi · ${terminalCode}` : 'Stand taxi');
  const toSub = isFromMilan
    ? (terminalCode ? `Stand taxi · ${terminalCode}` : 'Stand taxi')
    : 'Milano';
  const pickupTime = match?.pickupTime ? formatTimeShort(match.pickupTime) : null;

  const partnerName = partner
    ? `${partner.firstName ?? ''} ${partner.lastName ?? ''}`.trim()
    : null;
  const partnerInitials = initialsOf(partner?.firstName, partner?.lastName);
  const ratingAvg = partner?.rating?.average;
  const userInitials = initialsOf(currentUser?.firstName, currentUser?.lastName);

  const isCompleted = trip.status === 'completed';
  const statusLabel = isCompleted ? 'Completato' : trip.status === 'expired' ? 'Scaduto' : 'Annullato';

  // Fares (cents → euros). Airport base fare is the full taxi fare; rider pays half.
  const fullFareEuros = Math.round((airport?.baseFare ?? 12000) / 100);
  const halfFareEuros = Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const showSavings = isCompleted;
  const showReceipt = isCompleted;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Indietro">
          <MIcon name="chevron-left" size={20} sw={2} />
        </button>
        <div className={styles.headerCenter}>
          <div className={styles.headerKicker}>Prenotazione</div>
          <div className={styles.headerCode}>#{trip.tripId.slice(-6).toUpperCase()}</div>
        </div>
        {currentUser?.photoUrl ? (
          <img src={currentUser.photoUrl} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.userAvatar}>{userInitials}</div>
        )}
      </header>

      <div className={styles.scrollArea}>
        {/* Hero: status + savings */}
        <div className={`${styles.hero} ${isCompleted ? styles.heroDone : styles.heroNeutral}`}>
          <div className={styles.heroTop}>
            <span className={styles.heroBadge}>
              <MIcon name={isCompleted ? 'check-circle' : 'x'} size={14} sw={2.2} />
              {statusLabel}
            </span>
            <span className={styles.heroDate}>
              <MIcon name="calendar" size={14} sw={2} />
              {formatDateShort(trip.flightTime)} · {formatTimeShort(trip.flightTime)}
            </span>
          </div>
          {showSavings && (
            <div className={styles.heroSavings}>
              <div className={styles.heroSavingsLabel}>Hai risparmiato su questa corsa</div>
              <div className={styles.heroSavingsRow}>
                <span className={styles.heroAmount}>€{halfFareEuros}</span>
                <span className={styles.heroChip}>−50%</span>
              </div>
            </div>
          )}
        </div>

        {/* Route */}
        <div className={styles.card}>
          <div className={styles.routeSection}>
            <div className={styles.routeVisual}>
              <div className={styles.routeDotStart} />
              <div className={styles.routeLine} />
              <div className={styles.routeDotEnd} />
            </div>
            <div className={styles.routeDetails}>
              <div className={styles.routeStep}>
                <span className={styles.routeLabel}>Da</span>
                <span className={styles.routeValue}>{fromLabel}</span>
                <span className={styles.routeSub}>
                  {fromSub}{pickupTime ? ` · ritiro ${pickupTime}` : ''}
                </span>
              </div>
              <div className={styles.routeStep}>
                <span className={styles.routeLabel}>A</span>
                <span className={styles.routeValue}>{toLabel}</span>
                <span className={styles.routeSub}>{toSub}</span>
              </div>
            </div>
          </div>
          {trip.flightNumber && (
            <>
              <div className={styles.divider} />
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <div className={styles.metaIcon}>
                    <MIcon name="plane-takeoff" size={18} sw={2} color="var(--primary-600)" />
                  </div>
                  <div>
                    <div className={styles.metaLabel}>Volo</div>
                    <div className={styles.metaValueMono}>{trip.flightNumber}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Co-rider */}
        {trip.matchId && (
          <div className={styles.coriderSection}>
            <div className={styles.sectionTitle}>Con chi hai viaggiato</div>
            {partnerName && partner ? (
              <button
                type="button"
                className={styles.partnerRow}
                onClick={() => setProfileOpen(true)}
                aria-label={`Vedi profilo di ${partner.firstName}`}
              >
                {(partner.photoUrl || partner.blurredPhotoUrl) ? (
                  <img src={partner.photoUrl || partner.blurredPhotoUrl} alt={partnerName} className={styles.avatar} referrerPolicy="no-referrer" />
                ) : (
                  <div className={styles.avatarFallback}>{partnerInitials}</div>
                )}
                <div className={styles.partnerInfo}>
                  <div className={styles.partnerName}>{partnerName}</div>
                  <div className={styles.partnerMeta}>
                    {ratingAvg != null && (
                      <><span className={styles.star}>★</span> {ratingAvg.toFixed(1)} · </>
                    )}
                    {partner.tripCount ?? 0} viaggi
                    {partner.verified && (
                      <span className={styles.verified}>
                        <MIcon name="shield-check" size={13} sw={2} />Verificato
                      </span>
                    )}
                  </div>
                </div>
                <MIcon name="chevron-right" size={20} sw={2} color="var(--neutral-300)" />
              </button>
            ) : (
              <div className={styles.partnerMuted}>Compagno non disponibile</div>
            )}
          </div>
        )}

        {/* Receipt */}
        {showReceipt && (
          <div className={styles.card}>
            <div className={styles.sectionTitle}>Riepilogo costi</div>
            <div className={styles.receiptRow}>
              <span className={styles.receiptLabel}>Tariffa taxi intera</span>
              <span className={styles.receiptStrike}>€{fullFareEuros}</span>
            </div>
            <div className={styles.receiptRow}>
              <span className={styles.receiptLabel}>La tua quota · 1/2</span>
              <span className={styles.receiptValue}>€{halfFareEuros}</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.receiptRow}>
              <span className={styles.payMethod}>
                <MIcon name="credit-card" size={17} sw={2} color="var(--neutral-500)" />Pagamento
              </span>
              <span className={styles.payRight}>
                <span className={styles.paidPill}>
                  <MIcon name="check-circle" size={12} sw={2.2} />Pagato
                </span>
                <span className={styles.receiptValue}>€{halfFareEuros}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {isCompleted && trip.matchId && (
        <div className={styles.actionArea}>
          {reviewed ? (
            <div className={styles.submittedPill}>
              <MIcon name="check-circle" size={19} sw={2} />Recensione inviata
            </div>
          ) : (
            <button type="button" className={styles.reviewBtn} onClick={() => setReviewOpen(true)}>
              <MIcon name="star" size={19} sw={2} fill="currentColor" />Lascia recensione
            </button>
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

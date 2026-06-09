import { useNavigate } from 'react-router-dom';
import { MBtn } from '../ui';
import { TripStatusBadge } from './TripStatusBadge';
import { useAirportStore } from '../../stores/airportStore';
import { formatDateShort, formatCurrency } from '../../lib/formatters';
import styles from './TripCard.module.css';

interface TripCardProps {
  trip: import('../../types/api').MyTripsResponse['trips'][0];
  onCancelClick?: (tripId: string) => void;
  /** Open the review sheet for a completed trip's match. */
  onReviewClick?: (matchId: string) => void;
  /** Whether this trip's match has already been reviewed. */
  reviewed?: boolean;
}

export function TripCard({ trip, onCancelClick, onReviewClick, reviewed }: TripCardProps) {
  const navigate = useNavigate();
  const airport = useAirportStore((s) => s.selectedAirport);

  const terminalLabel = airport?.terminals.find((t) => t.code === trip.terminal)?.label || trip.terminal || 'Airport';
  const addressLabel = trip.originLabel || 'Milano';
  const routeLabel = trip.direction === 'FROM_MILAN'
    ? `${addressLabel} → ${terminalLabel}`
    : `${terminalLabel} → ${addressLabel}`;

  const handleViewMatch = () => {
    if (trip.matchId) navigate(`/match/${trip.matchId}`);
  };

  const handleOpenChat = () => {
    if (trip.matchId) navigate(`/connection/${trip.matchId}`);
  };

  const isCompleted = trip.status === 'completed';
  const isMatched = trip.status === 'matched';
  const isUnlocked = trip.status === 'unlocked';
  const isScheduled = trip.status === 'scheduled';
  const isCancelled = trip.status === 'cancelled';

  // Savings = half the airport's fixed fare (per-airport, never hardcoded).
  const halfFareEuros = Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const savingsFmt = formatCurrency(halfFareEuros, airport?.currency ?? 'EUR');
  const savingsAmount = isCompleted || isUnlocked ? savingsFmt : `~${savingsFmt}`;

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <TripStatusBadge status={trip.status} />
        <div className={styles.tripId}>{trip.tripId.slice(-6).toUpperCase()}</div>
      </div>

      <div className={styles.routeArea}>
        <div className={styles.routeVisual}>
          <div className={styles.routeDotStart} />
          <div className={styles.routeLine} />
          <div className={styles.routeDotEnd} />
        </div>
        <div className={styles.routeText}>
          <div className={styles.routeTo}>{routeLabel}</div>
          <div className={styles.routeDate}>{formatDateShort(trip.flightTime)}</div>
        </div>
      </div>

      {!isCancelled && <>
        <div className={styles.divider} />

        <div className={styles.footerRow}>
          <div className={styles.partnerInfo}>
            {(isMatched || isUnlocked || isCompleted) ? (
              <>
                <div className={styles.partnerAvatar}>P</div>
                <div className={styles.partnerText}>Match {isUnlocked ? 'Sbloccato' : 'Trovato'}</div>
              </>
            ) : (
              <>
                <div className={styles.partnerAvatar}>?</div>
                <div className={styles.partnerText}>In attesa di match...</div>
              </>
            )}
          </div>
          <div className={`${styles.savings} ${!isMatched && !isUnlocked && !isCompleted ? styles.empty : ''}`}>
            {isMatched || isUnlocked || isCompleted ? `-${savingsAmount}` : '---'}
          </div>
        </div>

        <div className={styles.ctaRow}>
          {isScheduled && onCancelClick && (
            <>
              <MBtn variant="ghost" small onClick={() => onCancelClick(trip.tripId)}>
                Cancella
              </MBtn>
              <MBtn variant="outline" small onClick={() => navigate(`/trip/${trip.tripId}`)} icon="arrow-right">
                Dettagli
              </MBtn>
            </>
          )}
          {isMatched && trip.matchId && (
            <MBtn variant="primary" small onClick={() => handleViewMatch()} icon="arrow-right">
              Vedi match
            </MBtn>
          )}
          {isUnlocked && (
            <MBtn variant="primary" small onClick={() => handleOpenChat()} icon="message-circle">
              Apri chat
            </MBtn>
          )}
          {isCompleted && trip.matchId && onReviewClick && (
            reviewed ? (
              <MBtn variant="ghost" small disabled icon="check">
                Recensito
              </MBtn>
            ) : (
              <MBtn variant="primary" small onClick={() => onReviewClick(trip.matchId!)} icon="sparkles">
                Recensisci
              </MBtn>
            )
          )}
        </div>
      </>}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { MBtn } from '../ui';
import { TripStatusBadge } from './TripStatusBadge';
import { useAirportStore } from '../../stores/airportStore';
import { formatDateShort, formatTimeShort } from '../../lib/formatters';
import styles from './TripCard.module.css';

interface TripCardProps {
  trip: import('../../types/api').MyTripsResponse['trips'][0];
  onCancelClick?: (tripId: string) => void;
  /** Open the review sheet for a completed trip's match. */
  onReviewClick?: (matchId: string) => void;
  /** Whether this trip's match has already been reviewed. */
  reviewed?: boolean;
}

const STREET_ABBR: Array<[RegExp, string]> = [
  [/^Viale\s+/i, 'V.le '],
  [/^Corso\s+/i, 'C.so '],
  [/^Piazza\s+/i, 'P.za '],
  [/^Largo\s+/i, 'L.go '],
];

/** Keep the first (street) segment of a long address and abbreviate the prefix. */
function shortenAddress(label: string): string {
  const street = (label.split(',')[0] ?? label).trim();
  for (const [re, repl] of STREET_ABBR) {
    if (re.test(street)) return street.replace(re, repl);
  }
  return street;
}

export function TripCard({ trip, onCancelClick, onReviewClick, reviewed }: TripCardProps) {
  const navigate = useNavigate();
  const airport = useAirportStore((s) => s.selectedAirport);

  const terminalCode = trip.terminal || '';
  // "Milano Malpensa" → "Malpensa"; fall back to the airport code.
  const airportShort = (airport?.name?.replace(/^Milano\s+/i, '') || trip.airportCode).trim();
  const airportLabel = terminalCode ? `${airportShort} ${terminalCode}` : airportShort;
  const cityShort = shortenAddress(trip.originLabel || 'Milano');
  const routeLabel = trip.direction === 'FROM_MILAN'
    ? `${cityShort} → ${airportLabel}`
    : `${airportLabel} → ${cityShort}`;

  const dateTimeLabel = `${formatDateShort(trip.flightTime)} · ${formatTimeShort(trip.flightTime)}`;

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
  const isSearching = trip.status === 'searching';
  const isCancelled = trip.status === 'cancelled';
  const isExpired = trip.status === 'expired';
  const isPast = isCompleted || isExpired || isCancelled;

  // Savings = half the airport's fixed fare (per-airport, never hardcoded).
  const halfFareEuros = Math.round((airport?.baseFare ?? 12000) / 2 / 100);
  const priceCompact = `${halfFareEuros}€`;

  // Final price for confirmed/completed, estimate while searching/matched.
  let priceText: string;
  let priceMuted = false;
  if (isUnlocked || isCompleted) {
    priceText = `Risparmi ${priceCompact}`;
  } else if (isMatched) {
    priceText = `Risparmi ~${priceCompact}`;
  } else {
    priceText = `~${priceCompact} stimati`;
    priceMuted = true;
  }

  return (
    <div
      className={styles.card}
      onClick={isPast ? () => navigate(`/trip-past/${trip.tripId}`) : undefined}
      role={isPast ? 'button' : undefined}
      tabIndex={isPast ? 0 : undefined}
      style={isPast ? { cursor: 'pointer' } : undefined}
    >
      <div className={styles.topRow}>
        <TripStatusBadge status={trip.status} />
        <div className={styles.tripId}>Cod. {trip.tripId.slice(-6).toUpperCase()}</div>
      </div>

      <div className={styles.routeArea}>
        <div className={styles.routeVisual}>
          <div className={styles.routeDotStart} />
          <div className={styles.routeLine} />
          <div className={styles.routeDotEnd} />
        </div>
        <div className={styles.routeText}>
          <div className={styles.routeTo}>{routeLabel}</div>
          <div className={styles.routeDate}>{dateTimeLabel}</div>
        </div>
      </div>

      {!isCancelled && <>
        <div className={styles.divider} />

        <div className={styles.footerRow}>
          {isPast ? <div /> : (
            <div className={`${styles.savings} ${priceMuted ? styles.empty : ''}`}>
              {priceText}
            </div>
          )}

          <div className={styles.ctaRow}>
            {(isScheduled || isSearching) && onCancelClick && (
              <MBtn variant="ghost" small onClick={() => onCancelClick(trip.tripId)}>
                Annulla
              </MBtn>
            )}
            {isScheduled && (
              <MBtn variant="outline" small onClick={() => navigate(`/trip/${trip.tripId}`)} icon="arrow-right">
                Dettagli
              </MBtn>
            )}
            {isMatched && trip.matchId && (
              <MBtn variant="primary" small onClick={handleViewMatch} icon="arrow-right">
                Vedi match
              </MBtn>
            )}
            {isUnlocked && trip.matchId && (
              <MBtn variant="primary" small onClick={handleOpenChat} icon="arrow-right">
                Vedi dettagli
              </MBtn>
            )}
            {isCompleted && trip.matchId && onReviewClick && (
              reviewed ? (
                <MBtn variant="ghost" small disabled icon="check">
                  Recensito
                </MBtn>
              ) : (
                <MBtn variant="outline" small onClick={(e) => { e.stopPropagation(); onReviewClick(trip.matchId!); }} icon="sparkles">
                  Lascia recensione
                </MBtn>
              )
            )}
          </div>
        </div>
      </>}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { MBtn, MIcon } from '../ui';
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
  const fromLabel = trip.direction === 'FROM_MILAN' ? cityShort : airportLabel;
  const toLabel = trip.direction === 'FROM_MILAN' ? airportLabel : cityShort;

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

  // Fare = airport's fixed fare; split = half (per-airport, never hardcoded).
  const fullFareEuros = Math.round((airport?.baseFare ?? 12000) / 100);
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

  // Whole-card tap target: open the match (locked) / connection (unlocked) /
  // past-trip detail. Searching/scheduled cards stay non-clickable (they have
  // their own Modifica/Annulla actions).
  const cardHref =
    isPast
      ? `/trip-past/${trip.tripId}`
      : isMatched && trip.matchId
        ? `/match/${trip.matchId}`
        : isUnlocked && trip.matchId
          ? `/connection/${trip.matchId}`
          : null;

  const luggageLabel = `${trip.luggage} ${trip.luggage === 1 ? 'bagaglio' : 'bagagli'}`;
  // searching here = the design's "in ricerca" state (also covers scheduled).
  const isSearchingState = isSearching || isScheduled;

  const partner = trip.partner;
  const partnerName = partner
    ? [partner.firstName, partner.lastName ? `${partner.lastName[0]}.` : '']
        .filter(Boolean)
        .join(' ')
    : '';
  const partnerInitials = partner
    ? `${partner.firstName[0] ?? ''}${partner.lastName?.[0] ?? ''}`.toUpperCase()
    : '';
  const partnerRating =
    partner?.rating?.average != null ? partner.rating.average.toFixed(1) : null;

  return (
    <div
      className={`${styles.card} ${isMatched ? styles.cardMatch : ''}`}
      onClick={cardHref ? () => navigate(cardHref) : undefined}
      onKeyDown={cardHref ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(cardHref); } } : undefined}
      role={cardHref ? 'button' : undefined}
      tabIndex={cardHref ? 0 : undefined}
      style={cardHref ? { cursor: 'pointer' } : undefined}
    >
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
          <div className={styles.routeFrom}>{fromLabel}</div>
          <div className={styles.routeTo}>{toLabel}</div>
        </div>
      </div>

      {/* Meta chips — only on active trips */}
      {!isPast && (
        <div className={styles.metaChips}>
          {trip.flightNumber && (
            <span className={styles.chip}>
              <MIcon name="plane-takeoff" size={14} sw={2} color="var(--primary-500)" />
              <span className={styles.chipMono}>{trip.flightNumber}</span>
            </span>
          )}
          <span className={styles.chip}>
            <MIcon name="clock" size={14} sw={2} color="var(--primary-500)" />
            {dateTimeLabel}
          </span>
          <span className={styles.chip}>
            <MIcon name="luggage" size={14} sw={2} color="var(--primary-500)" />
            {luggageLabel}
          </span>
        </div>
      )}

      <div className={styles.divider} />

      {/* ── ACTIVE: searching / scheduled ── */}
      {!isPast && isSearchingState && (
        <div className={styles.stateBody}>
          <div className={styles.searchHead}>
            <span className={styles.searchPing}>
              <span className={styles.pingRing} />
              <span className={styles.pingCore}>
                <MIcon name="search" size={16} sw={2} color="var(--primary-600)" />
              </span>
            </span>
            <div className={styles.searchText}>
              <div className={styles.searchTitle}>In ricerca del compagno…</div>
              <div className={styles.searchSub}>Ti avvisiamo appena troviamo un match</div>
            </div>
          </div>
          <div className={styles.searchFooter}>
            <div className={styles.priceWrap}>
              <span className={styles.priceFull}>€{fullFareEuros}</span>
              <span className={styles.priceSplit}>€{halfFareEuros}</span>
              <span className={styles.priceUnit}>a testa</span>
            </div>
            <div className={styles.ctaRow}>
              {onCancelClick && (
                <MBtn variant="ghost" small onClick={() => onCancelClick(trip.tripId)}>
                  Annulla
                </MBtn>
              )}
              <MBtn variant="outline" small onClick={() => navigate(`/trip/${trip.tripId}`)} icon="pencil">
                Modifica
              </MBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE: match found (not yet unlocked) ── */}
      {!isPast && isMatched && (
        <div className={styles.stateBody}>
          <div className={styles.matchHead}>
            <div className={styles.avatarWrap}>
              {partner?.blurredPhotoUrl ? (
                <img className={styles.avatarPhoto} src={partner.blurredPhotoUrl} alt="" />
              ) : (
                <div className={styles.avatarBlur}>{partner?.firstName?.[0] ?? '?'}</div>
              )}
              <div className={styles.avatarLock}>
                <MIcon name="lock" size={11} sw={2} color="var(--neutral-500)" />
              </div>
            </div>
            <div className={styles.matchInfo}>
              <div className={styles.matchName}>
                {partnerName || 'Compagno trovato'}
                {partner?.verified && (
                  <span className={styles.verifiedTag}>
                    <MIcon name="shield-check" size={11} sw={2} />Verificato
                  </span>
                )}
              </div>
              <div className={styles.matchSub}>Profilo pronto da sbloccare</div>
            </div>
          </div>
          <div className={styles.compatBar}>
            <MIcon name="check-circle" size={16} sw={2} color="var(--success-500)" />
            <span>Orario e terminal compatibili</span>
          </div>
          <button type="button" className={styles.unlockBtn} onClick={(e) => { e.stopPropagation(); handleViewMatch(); }}>
            <MIcon name="lock-open" size={17} sw={2} />
            Sblocca match · €1,99
          </button>
        </div>
      )}

      {/* ── ACTIVE: confirmed (unlocked) ── */}
      {!isPast && isUnlocked && (
        <div className={styles.confirmedRow}>
          <div className={styles.coriderInfo}>
            {partner?.photoUrl ? (
              <img className={styles.coriderPhoto} src={partner.photoUrl} alt="" />
            ) : (
              <span className={styles.coriderAvatar}>
                {partnerInitials || <MIcon name="user" size={20} sw={2} color="var(--primary-700)" />}
              </span>
            )}
            <div>
              <div className={styles.coriderName}>{partnerName || 'Compagno confermato'}</div>
              <div className={styles.coriderMeta}>
                {partnerRating && (
                  <>
                    <span className={styles.ratingStar}>★</span>
                    <span className={styles.ratingVal}>{partnerRating}</span>
                    <span className={styles.metaDot} />
                  </>
                )}
                <span className={styles.coriderConfirmed}>Confermato</span>
              </div>
            </div>
          </div>
          {trip.matchId && (
            <MBtn variant="primary" small onClick={(e) => { e?.stopPropagation(); handleOpenChat(); }} icon="message-circle">
              Chatta
            </MBtn>
          )}
        </div>
      )}

      {/* ── PAST: footer ── */}
      {isPast && (
        <div className={styles.footerRow}>
          <div className={styles.footerMeta}>
            {!isCancelled && (
              <div className={`${styles.savings} ${priceMuted ? styles.empty : ''}`}>
                {priceText}
              </div>
            )}
            <div className={styles.dateRow}>
              <MIcon name="calendar" size={14} sw={2} />
              {dateTimeLabel}
            </div>
          </div>

          <div className={styles.ctaRow}>
            {isCompleted && trip.matchId && onReviewClick && (
              reviewed ? (
                <div className={styles.rated}>
                  <span className={styles.ratedStars}>★★★★★</span>
                  <span className={styles.ratedLabel}>Recensito</span>
                </div>
              ) : (
                <MBtn variant="outline" small onClick={(e) => { e.stopPropagation(); onReviewClick(trip.matchId!); }} icon="star">
                  Lascia recensione
                </MBtn>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

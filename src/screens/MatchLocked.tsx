import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MIcon } from '../components/ui';
import { TopNav } from '../components/layout/TopNav';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useMatchStore } from '../stores/matchStore';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { fetchMatch, unlockTrip, declineMatch } from '../services/matches';
import { fetchUser } from '../services/users';
import { getUserRating } from '../services/reviews';
import { parseApiError } from '../services/api';
import { PaymentSheet } from '../components/PaymentSheet/PaymentSheet';
import { useCountdown } from '../hooks/useCountdown';
import type { Match, PublicUser, UserRating, ReviewDimensionName } from '../types/api';
import type { IconName } from '../components/ui/MIcon';
import styles from './MatchLocked.module.css';

const DIMENSIONS: { key: ReviewDimensionName; label: string; icon: IconName }[] = [
  { key: 'punctuality', label: 'Puntualità', icon: 'clock' },
  { key: 'sociability', label: 'Socialità', icon: 'message-circle' },
  { key: 'reliability', label: 'Affidabilità', icon: 'shield-check' },
  { key: 'cleanliness', label: 'Comfort', icon: 'sparkles' },
];

function starString(value: number): string {
  const n = Math.round(value);
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

/** Live countdown text for the unlock deadline. */
function CountdownLabel({ deadline }: { deadline: string | null }) {
  const totalSeconds = useMemo(() => {
    if (!deadline) return 0;
    return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
  }, [deadline]);
  const { display, isComplete } = useCountdown({ totalSeconds });
  if (!deadline) return <>a breve</>;
  if (isComplete) return <>scaduto</>;
  return <>{display}</>;
}

const TERMINAL_STATES = ['unlock_expired', 'dissolved', 'expired'] as const;
function isTerminal(status: string): boolean {
  return (TERMINAL_STATES as readonly string[]).includes(status);
}

function formatFlightDate(dateStr: string): string {
  if (!dateStr) return '—';
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'oggi';
  if (dateStr === tomorrow) return 'domani';
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function formatTime(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function DeadlineCountdown({ deadline }: { deadline: string | null }) {
  const totalSeconds = useMemo(() => {
    if (!deadline) return 0;
    const diff = Math.floor((new Date(deadline).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [deadline]);

  const { display, isComplete } = useCountdown({ totalSeconds });

  if (!deadline || isComplete) return null;

  return (
    <span className={styles.deadlinePill}>
      <MIcon name="clock" size={12} sw={2} />
      Scade in {display}
    </span>
  );
}

function WaitingExpiry({ deadline }: { deadline: string }) {
  const totalSeconds = useMemo(() => {
    const diff = Math.floor((new Date(deadline).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [deadline]);
  const { display, isComplete } = useCountdown({ totalSeconds });
  if (isComplete) return <span>Match scaduto</span>;
  return <span>Il match scade tra {display}</span>;
}

export function MatchLocked() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const airports = useAirportStore((s) => s.airports);
  const selectedAirport = useAirportStore((s) => s.selectedAirport);
  const tripId = useTripStore((s) => s.tripId);
  const cachedMatch = useMatchStore((s) => s.currentMatch);
  const setMatch = useMatchStore((s) => s.setMatch);
  const currentUser = useAuthStore((s) => s.user);
  const ws = useWebSocket();

  const [match, setLocalMatch] = useState<Match | null>(
    cachedMatch && cachedMatch.matchId === matchId ? cachedMatch : null,
  );
  const [partner, setPartner] = useState<PublicUser | null>(null);
  const [partnerRating, setPartnerRating] = useState<UserRating | null>(null);
  const [loading, setLoading] = useState(!match);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'partially_unlocked' | 'unlocked' | null>(null);
  const [showUnlockSheet, setShowUnlockSheet] = useState(false);
  const [showRejectSheet, setShowRejectSheet] = useState(false);

  const refetch = useCallback(async () => {
    if (!matchId) return;
    const m = await fetchMatch(matchId);
    setLocalMatch(m);
    setMatch(m);
    return m;
  }, [matchId, setMatch]);

  useEffect(() => {
    if (!matchId) return;
    if (match && match.matchId === matchId) return;
    setLoading(true);
    fetchMatch(matchId)
      .then((m) => {
        setLocalMatch(m);
        setMatch(m);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load match');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const iAmUnlocker = !!(currentUser && match?.unlockedBy?.includes(currentUser.userId));
  const isPending = match?.status === 'pending';
  const isPartial = match?.status === 'partially_unlocked';
  const waiting = isPartial && iAmUnlocker;
  const urgent = isPartial && !iAmUnlocker;
  const canUnlock = isPending || urgent;

  useEffect(() => {
    if (!match || !currentUser || !(isPending || isPartial)) return;
    const partnerUserId = match.userId1 === currentUser.userId ? match.userId2 : match.userId1;
    fetchUser(partnerUserId)
      .then(setPartner)
      .catch((e) => console.warn('[MatchLocked] fetchUser failed', e));
    getUserRating(partnerUserId)
      .then(setPartnerRating)
      .catch(() => { /* public rating is best-effort */ });
  }, [match, currentUser, isPending, isPartial]);

  useEffect(() => {
    if (!match) return;
    if (match.status === 'unlocked') {
      navigate(`/connection/${match.matchId}`, { replace: true });
    }
  }, [match, navigate]);

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => {
      refetch().catch(() => { /* keep polling */ });
    }, 5000);
    return () => window.clearInterval(id);
  }, [waiting, refetch]);

  useEffect(() => {
    const off = ws.on('match.partner_unlocked', (data) => {
      if (data.matchId === matchId) refetch().catch(() => { /* noop */ });
    });
    return off;
  }, [matchId, ws, refetch]);

  const airport =
    (match && airports.find((a) => a.code === match.airportCode)) || selectedAirport || null;

  const resolveByStatus = useCallback(async (status: 'partially_unlocked' | 'unlocked' | undefined) => {
    if (status === 'unlocked') {
      navigate(`/connection/${matchId}`, { replace: true });
    } else {
      await refetch();
    }
  }, [matchId, navigate, refetch]);

  const handleUnlock = async () => {
    if (!matchId || !tripId || unlocking) return;
    setUnlocking(true);
    setError(null);
    try {
      const res = await unlockTrip(tripId, { matchId });
      if (res.paymentIntentClientSecret) {
        setPendingStatus(res.matchStatus ?? null);
        setPaymentClientSecret(res.paymentIntentClientSecret);
        return;
      }
      await resolveByStatus(res.matchStatus);
    } catch (err) {
      const { message } = await parseApiError(err);
      setError(message || 'Sblocco fallito');
    } finally {
      setUnlocking(false);
    }
  };

  const handleAuthorized = async () => {
    const status = pendingStatus ?? undefined;
    setPaymentClientSecret(null);
    setPendingStatus(null);
    await resolveByStatus(status);
  };

  const handleDecline = async () => {
    if (!matchId || declining) return;
    setDeclining(true);
    try {
      await declineMatch(matchId);
      navigate('/my-trips', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rifiuto fallito');
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.screen}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className={styles.screen}>
        <TopNav showLogo showBack />
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!match) return null;

  if (isTerminal(match.status)) {
    const msg =
      match.status === 'unlock_expired'
        ? 'Il partner non ha sbloccato in tempo. Nessun addebito — cerchiamo un nuovo partner per te.'
        : match.status === 'dissolved'
          ? 'Questo match è stato sciolto. Ti rimettiamo nel pool per un nuovo abbinamento.'
          : 'Il match è scaduto. Crea o riprendi un trip per cercare un nuovo partner.';
    return (
      <div className={styles.screen}>
        <TopNav showLogo showBack />
        <div className={styles.sheet}>
          <div className={styles.celebration}>
            <div className={styles.celebrationIcon}><MIcon name="clock" size={22} sw={2.5} /></div>
            <div className={styles.celebrationText}>
              <h2 className={styles.celebrationTitle}>Match non più disponibile</h2>
              <p className={styles.celebrationCopy}>{msg}</p>
            </div>
          </div>
          <button type="button" className={styles.unlockBtn} onClick={() => navigate('/my-trips', { replace: true })}>
            Vai ai miei trip
          </button>
        </div>
      </div>
    );
  }

  if (match.status === 'completed') {
    return (
      <div className={styles.screen}>
        <TopNav showLogo showBack />
        <div className={styles.sheet}>
          <div className={styles.celebration}>
            <div className={styles.celebrationIcon}>🎉</div>
            <div className={styles.celebrationText}>
              <h2 className={styles.celebrationTitle}>Viaggio completato</h2>
              <p className={styles.celebrationCopy}>Speriamo sia andata bene!</p>
            </div>
          </div>
          <button type="button" className={styles.unlockBtn} onClick={() => navigate('/my-trips', { replace: true })}>
            Vai ai miei trip
          </button>
        </div>
      </div>
    );
  }

  if (match.status === 'unlocked') return null;

  const myTrip = currentUser
    ? (match.userId1 === currentUser.userId ? match.trip1 : match.trip2)
    : match.trip1;

  const partnerFirstName = partner?.firstName ?? 'il tuo match';
  const initial = partner?.firstName?.[0]?.toUpperCase() ?? '?';
  const partnerPhoto = partner?.photoUrl ?? partner?.blurredPhotoUrl ?? null;

  // ── My flight recap (A) ──
  const airportCode = match.airportCode || airport?.code || '—';
  const myTerminal = myTrip?.terminal ?? '';
  const myDate = formatFlightDate(myTrip?.flightDate ?? '');
  const myTime = formatTime(myTrip?.flightTime);
  const myDestination = myTrip?.destination ?? '—';
  // TO_AIRPORT trip: departure is the city street (originLabel), arrival is the airport.
  const myOrigin = myTrip?.originLabel ?? null;

  // Display fee is fixed at €1,99 for the MVP. Actual charge still comes from
  // the backend PaymentIntent — keep airport.unlockFee = 199 in sync.
  const unlockFeeDisplay = '€1,99';

  // ── Design: locked "Match trovato" view ──
  const partnerNameShort = partner
    ? `${partner.firstName ?? ''}${partner.lastName ? ` ${partner.lastName[0]}.` : ''}`.trim()
    : 'il tuo match';
  const overallAvg = partnerRating?.average ?? null;
  const overallCount = partnerRating?.count ?? 0;
  const dimRows = DIMENSIONS.map(({ key, label, icon }) => {
    const dim = partnerRating?.dimensions?.[key];
    const avg = (dim && dim.count > 0 && dim.average != null) ? dim.average : overallAvg;
    return { label, icon, stars: avg != null ? starString(avg) : '☆☆☆☆☆' };
  });
  const hasRating = overallAvg != null && overallCount > 0;

  const fullEur = Math.round((airport?.baseFare ?? 12000) / 100);
  const halfEur = Math.round((airport?.baseFare ?? 12000) / 2 / 100);

  const airportName = airport?.name || myDestination;
  const fromTitle = myOrigin ? myOrigin : `${airportName} · ${airportCode}`;
  const toTitle = myOrigin ? `${airportName} · ${airportCode}` : myDestination;
  const userInitials = `${currentUser?.firstName?.[0] ?? ''}${currentUser?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const lockedRows: { icon: IconName; label: string }[] = [
    { icon: 'map-pin', label: 'Punto di ritrovo' },
    { icon: 'clock', label: 'Orario di ritrovo' },
    { icon: 'message-circle', label: `Chat con ${partnerNameShort}` },
  ];

  // ── Waiting panel: I paid, partner hasn't ────────────────────────────
  // NOTE: when isUnlockedByPartner flips true the routing effect above sends
  // status === 'unlocked' → navigate(`/connection/:matchId`). No extra work here.
  if (waiting) {
    return (
      <div className={styles.screen}>
        <TopNav showLogo showBack right={<DeadlineCountdown deadline={match.unlockDeadline} />} />
        <div className={styles.sheet}>
          <div className={styles.handle} />

          {/* A) Confirmation header */}
          <div className={styles.celebration}>
            <div className={styles.celebrationIcon}><MIcon name="check" size={22} sw={2.5} /></div>
            <div className={styles.celebrationText}>
              <h2 className={styles.celebrationTitle}>Hai sbloccato</h2>
              <p className={styles.celebrationCopy}>
                Aspettiamo che {partnerFirstName} sblocchi. <strong>€0 finché non sblocca anche lui</strong> — se non risponde in tempo, nessun addebito.
              </p>
            </div>
          </div>

          {/* B) Partner status card */}
          <div className={styles.partnerCard}>
            <div className={styles.avatarWrap}>
              {partnerPhoto ? (
                <img src={partnerPhoto} alt="" referrerPolicy="no-referrer" className={styles.avatarPhotoBlurred} />
              ) : (
                <div className={`${styles.avatar} ${styles.avatarBlurred}`}>{initial}</div>
              )}
            </div>
            <div className={styles.partnerInfo}>
              <div className={styles.partnerNameRow}>
                <span className={styles.partnerName}>{partnerFirstName}</span>
              </div>
              <div className={styles.waitingStatus}>
                <span className={styles.waitingSpinner} />
                <span>In attesa di sblocco…</span>
              </div>
            </div>
          </div>

          {/* C) What happens now */}
          <div className={styles.infoTile}>
            <div className={styles.infoRow}>
              <MIcon name="clock" size={16} sw={2} />
              <span>Di solito entro pochi minuti.</span>
            </div>
            <div className={styles.infoRow}>
              <MIcon name="bell" size={16} sw={2} />
              <span>Ti invieremo una notifica appena {partnerFirstName} sblocca — puoi chiudere l'app.</span>
            </div>
          </div>

          {/* D) Timeout / exit */}
          <div className={styles.expiryRow}>
            <MIcon name="clock" size={13} sw={2} />
            {match.unlockDeadline
              ? <WaitingExpiry deadline={match.unlockDeadline} />
              : <span>Il match scade a breve</span>}
          </div>
          <div className={styles.unlockNote}>Alla scadenza senza sblocco non c'è nessun addebito.</div>

          <button
            type="button"
            className={styles.declineBtn}
            onClick={handleDecline}
            disabled={declining}
          >
            {declining ? 'Annullo…' : 'Annulla match'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Header (teal) */}
      <header className={styles.dHeader}>
        <button type="button" className={styles.dHeaderBtn} onClick={() => navigate(-1)} aria-label="Indietro">
          <MIcon name="chevron-left" size={20} sw={2} />
        </button>
        <div className={styles.dHeaderCenter}>
          <div className={styles.dHeaderKicker}>Prenotazione</div>
          {matchId && <div className={styles.dHeaderCode}>#{matchId.slice(-6).toUpperCase()}</div>}
        </div>
        {currentUser?.photoUrl ? (
          <img src={currentUser.photoUrl} alt="" className={styles.dUserAvatar} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.dUserAvatar}>{userInitials}</div>
        )}
      </header>

      <div className={styles.dScroll}>
        {/* Hero */}
        <div className={styles.dHero}>
          <div className={styles.dHeroPill}>
            <span className={styles.dHeroDot} />
            {urgent ? `${partnerNameShort} ha già sbloccato` : 'Match trovato'}
          </div>
          <div className={styles.dHeroTitle}>Abbiamo trovato il tuo compagno di viaggio!</div>
          <div className={styles.dHeroSub}>Diretto al tuo stesso terminal, con orari compatibili. Sblocca per conoscervi e coordinarvi.</div>
        </div>

        <div className={styles.dBody}>
          {/* Co-rider card */}
          <div className={styles.dPartnerCard}>
            <div className={styles.dIdentity}>
              <div className={styles.dAvatarWrap}>
                {partnerPhoto ? (
                  <img src={partnerPhoto} alt="" referrerPolicy="no-referrer" className={styles.dAvatarImg} />
                ) : (
                  <div className={styles.dAvatarBlur}><span>{initial}</span></div>
                )}
                <div className={styles.dLockDot}><MIcon name="lock" size={13} sw={2} color="var(--neutral-500)" /></div>
              </div>
              <div className={styles.dPartnerInfo}>
                <div className={styles.dPartnerNameRow}>
                  <span className={styles.dPartnerName}>{partnerNameShort}</span>
                  {partner?.verified && (
                    <span className={styles.dVerified}><MIcon name="shield-check" size={12} sw={2} />Verificato</span>
                  )}
                </div>
                {hasRating ? (
                  <div className={styles.dRatingRow}>
                    <span className={styles.dStarsGold}>{starString(overallAvg!)}</span>
                    <span className={styles.dRatingNum}>{overallAvg!.toFixed(1)}</span>
                  </div>
                ) : (
                  <div className={styles.dTrips}>Nuovo profilo</div>
                )}
                {hasRating && (
                  <div className={styles.dTrips}>
                    <MIcon name="star" size={14} sw={2} />{overallCount} {overallCount === 1 ? 'recensione' : 'recensioni'}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.dCompat}>
              <MIcon name="check-circle" size={20} sw={2} color="var(--success-500)" />
              <div>
                <div className={styles.dCompatTitle}>Orario e volo compatibili</div>
                <div className={styles.dCompatSub}>
                  Stesso terminal {airportCode}{myTerminal ? ` ${myTerminal}` : ''} · orari allineati al tuo volo
                </div>
              </div>
            </div>

            {hasRating && partnerRating?.dimensions && (
              <>
                <div className={styles.dHr} />
                <div>
                  <div className={styles.dSubLabel}>Valutazioni</div>
                  <div className={styles.dDimGrid}>
                    {dimRows.map((d) => (
                      <div key={d.label} className={styles.dDimRow}>
                        <span className={styles.dDimLeft}>
                          <MIcon name={d.icon} size={16} sw={2} color="var(--primary-500)" />
                          <span className={styles.dDimLabel}>{d.label}</span>
                        </span>
                        <span className={styles.dDimStars}>{d.stars}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Trip summary */}
          <div className={styles.dSummary}>
            <span className={styles.dSubLabel}>Il vostro viaggio</span>
            <div className={styles.dRoute}>
              <div className={styles.dRouteRail}>
                <div className={styles.dRouteDotStart} />
                <div className={styles.dRouteLine} />
                <div className={styles.dRouteDotEnd} />
              </div>
              <div className={styles.dRouteBody}>
                <div><div className={styles.dRouteKey}>Da</div><div className={styles.dRouteVal}>{fromTitle}</div></div>
                <div><div className={styles.dRouteKey}>A</div><div className={styles.dRouteVal}>{toTitle}</div></div>
              </div>
            </div>
            <div className={styles.dHr} />
            <div className={styles.dMetaRow}>
              {myTrip?.flightNumber && (
                <div className={styles.dMetaFlight}>
                  <MIcon name="plane-takeoff" size={17} sw={2} color="var(--neutral-400)" />
                  <div>
                    <div className={styles.dMetaKey}>Volo{myTime !== '—' ? ` · ${myTime}` : ''}</div>
                    <div className={styles.dMetaMono}>{myTrip.flightNumber}</div>
                  </div>
                </div>
              )}
              <div className={styles.dMetaStats}>
                <div className={styles.dMetaStat}><div className={styles.dMetaKey}>Data</div><div className={styles.dMetaStrong}>{myDate}</div></div>
                <div className={styles.dMetaStat}><div className={styles.dMetaKey}>Pax</div><div className={styles.dMetaStrong}>{myTrip?.paxCount ?? 1}</div></div>
                <div className={styles.dMetaStat}><div className={styles.dMetaKey}>Bagagli</div><div className={styles.dMetaStrong}>{myTrip?.luggage ?? 1}</div></div>
              </div>
            </div>
            <div className={styles.dSavings}>
              <MIcon name="zap" size={21} sw={2} color="var(--primary-600)" />
              <div className={styles.dSavingsText}>
                <div className={styles.dSavingsTitle}>Risparmio stimato</div>
                <div className={styles.dSavingsNote}>Dividete €{fullEur} a metà</div>
              </div>
              <span className={styles.dSavingsValue}>~€{halfEur}</span>
            </div>
          </div>

          {/* Locked premium */}
          <div className={styles.dLockedCard}>
            <div className={styles.dLockedHead}>
              <MIcon name="lock" size={16} sw={2} color="var(--accent-500)" />
              <span>Si sblocca con {unlockFeeDisplay}</span>
            </div>
            <div className={styles.dLockedList}>
              {lockedRows.map((l) => (
                <div key={l.label} className={styles.dLockedRow}>
                  <div className={styles.dLockedIcon}><MIcon name={l.icon} size={19} sw={2} color="var(--primary-600)" /></div>
                  <div className={styles.dLockedInfo}>
                    <div className={styles.dLockedLabel}>{l.label}</div>
                    <div className={styles.dLockedBlur}>•••••••••••••••••</div>
                  </div>
                  <MIcon name="lock" size={16} sw={2} color="var(--neutral-400)" />
                </div>
              ))}
            </div>
          </div>

          {/* Reject */}
          <button type="button" className={styles.dRejectBtn} onClick={() => setShowRejectSheet(true)} disabled={declining || unlocking}>
            <MIcon name="route" size={16} sw={2} />Rifiuta e cerca un altro compagno
          </button>
          <div className={styles.dTrustLine}>
            <MIcon name="shield-check" size={14} sw={2} />Identità verificata · taxi ufficiale · costo diviso tra voi
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}
        </div>
      </div>

      {/* Sticky unlock CTA */}
      <div className={styles.dCtaBar}>
        <div className={styles.dCtaTop}>
          <span className={styles.dCtaCountdown}>
            <MIcon name="clock" size={15} sw={2} color="var(--accent-600)" />
            Sblocca entro <CountdownLabel deadline={match.unlockDeadline} /> per non perderlo
          </span>
          <span className={styles.dCtaPrice}>
            <span className={styles.dCtaPriceFee}>{unlockFeeDisplay} →</span>
            <span className={styles.dCtaPriceSave}>~€{halfEur} risparmiati</span>
          </span>
        </div>
        <button type="button" className={styles.dUnlockBtn} onClick={() => setShowUnlockSheet(true)} disabled={unlocking || !canUnlock}>
          <MIcon name="lock" size={20} sw={2} />
          {unlocking ? 'Sblocco…' : `Sblocca il match · ${unlockFeeDisplay}`}
        </button>
        <div className={styles.dCtaChips}>
          <span><MIcon name="message-circle" size={13} sw={2} color="var(--primary-500)" />Chat</span>
          <span><MIcon name="map-pin" size={13} sw={2} color="var(--primary-500)" />Punto di ritrovo</span>
          <span><MIcon name="clock" size={13} sw={2} color="var(--primary-500)" />Orario</span>
        </div>
      </div>

      {/* Unlock sheet */}
      {showUnlockSheet && (
        <>
          <div className={styles.dScrim} onClick={() => setShowUnlockSheet(false)} />
          <div className={styles.dSheet}>
            <div className={styles.dSheetHandle} />
            <div className={styles.dSheetIcon}><MIcon name="lock" size={26} sw={2} color="var(--accent-500)" /></div>
            <div className={styles.dSheetTitle}>Sblocca il tuo match con {partnerNameShort}</div>
            <div className={styles.dSheetText}>Una tantum, paghi solo ora che il compagno è stato trovato. Ottieni subito:</div>
            <div className={styles.dSheetBenefits}>
              <div><MIcon name="message-circle" size={19} sw={2} color="var(--primary-600)" />Chat diretta con il compagno</div>
              <div><MIcon name="map-pin" size={19} sw={2} color="var(--primary-600)" />Punto di ritrovo al terminal</div>
              <div><MIcon name="clock" size={19} sw={2} color="var(--primary-600)" />Orario di ritrovo concordato</div>
            </div>
            <div className={styles.dSheetTotal}>
              <span>Totale oggi</span>
              <span className={styles.dSheetTotalVal}>{unlockFeeDisplay}</span>
            </div>
            <button
              type="button"
              className={styles.dSheetPay}
              onClick={() => { setShowUnlockSheet(false); handleUnlock(); }}
              disabled={unlocking || !canUnlock}
            >
              <MIcon name="credit-card" size={19} sw={2} />{unlocking ? 'Sblocco…' : 'Paga e sblocca'}
            </button>
            <div className={styles.dSheetSecure}><MIcon name="shield-check" size={14} sw={2} />Pagamento sicuro · rimborso se il compagno annulla</div>
          </div>
        </>
      )}

      {/* Reject sheet */}
      {showRejectSheet && (
        <>
          <div className={styles.dScrim} onClick={() => setShowRejectSheet(false)} />
          <div className={styles.dSheet}>
            <div className={styles.dSheetHandle} />
            <div className={styles.dSheetTitle}>Cercare un altro compagno?</div>
            <div className={styles.dSheetText}>Rilasceremo questo match e riprenderemo la ricerca. Non hai pagato nulla, quindi nessun costo.</div>
            <button
              type="button"
              className={styles.dSheetPrimary}
              onClick={() => { setShowRejectSheet(false); handleDecline(); }}
              disabled={declining}
            >
              {declining ? 'Rilascio…' : 'Cerca un altro compagno'}
            </button>
            <button type="button" className={styles.dSheetGhost} onClick={() => setShowRejectSheet(false)}>Mantieni questo match</button>
          </div>
        </>
      )}

      <PaymentSheet
        open={!!paymentClientSecret}
        clientSecret={paymentClientSecret}
        amountLabel={unlockFeeDisplay}
        onClose={() => { setPaymentClientSecret(null); setPendingStatus(null); }}
        onAuthorized={handleAuthorized}
      />
    </div>
  );
}

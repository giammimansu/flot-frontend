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
import { parseApiError } from '../services/api';
import { PaymentSheet } from '../components/PaymentSheet/PaymentSheet';
import { formatCurrency } from '../lib/formatters';
import { useCountdown } from '../hooks/useCountdown';
import type { Match, PublicUser } from '../types/api';
import styles from './MatchLocked.module.css';

const TERMINAL_STATES = ['unlock_expired', 'dissolved', 'expired'] as const;
function isTerminal(status: string): boolean {
  return (TERMINAL_STATES as readonly string[]).includes(status);
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
      Expires in {display}
    </span>
  );
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
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [loading, setLoading] = useState(!match);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [declining, setDeclining] = useState(false);
  // Real Stripe auth-hold (F4): set when backend returns a PaymentIntent client secret.
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'partially_unlocked' | 'unlocked' | null>(null);

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
  const waiting = isPartial && iAmUnlocker;        // I paid, waiting for partner
  const urgent = isPartial && !iAmUnlocker;        // partner paid, my turn (pressure)
  const canUnlock = isPending || urgent;

  // Load partner profile while the match is still locked/partial.
  useEffect(() => {
    if (!match || !currentUser || !(isPending || isPartial)) return;
    const partnerUserId = match.userId1 === currentUser.userId ? match.userId2 : match.userId1;
    setPartnerLoading(true);
    fetchUser(partnerUserId)
      .then(setPartner)
      .catch((e) => console.warn('[MatchLocked] fetchUser failed', e))
      .finally(() => setPartnerLoading(false));
  }, [match, currentUser, isPending, isPartial]);

  // Route on resolved states.
  useEffect(() => {
    if (!match) return;
    if (match.status === 'unlocked') {
      navigate(`/connection/${match.matchId}`, { replace: true });
    }
    // terminal + completed are rendered inline (see below).
  }, [match, navigate]);

  // While I'm waiting for the partner, backend pushes no "fully unlocked" WS event
  // to me → poll until the match flips to unlocked (or a terminal state).
  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => {
      refetch().catch(() => { /* keep polling */ });
    }, 5000);
    return () => window.clearInterval(id);
  }, [waiting, refetch]);

  // Partner unlocked first → refetch so the urgent CTA / deadline update.
  useEffect(() => {
    const off = ws.on('match.partner_unlocked', (data) => {
      if (data.matchId === matchId) refetch().catch(() => { /* noop */ });
    });
    return off;
  }, [matchId, ws, refetch]);

  const airport =
    (match && airports.find((a) => a.code === match.airportCode)) || selectedAirport || null;
  const currency = airport?.currency ?? 'EUR';
  const savingsCents = airport?.baseFare ? Math.round(airport.baseFare / 2) : 0;

  // Navigate based on the match status the backend reported.
  const resolveByStatus = useCallback(async (status: 'partially_unlocked' | 'unlocked' | undefined) => {
    if (status === 'unlocked') {
      navigate(`/connection/${matchId}`, { replace: true });
    } else {
      await refetch(); // partially_unlocked → waiting panel
    }
  }, [matchId, navigate, refetch]);

  const handleUnlock = async () => {
    if (!matchId || !tripId || unlocking) return;
    setUnlocking(true);
    setError(null);
    try {
      const res = await unlockTrip(tripId, { matchId });
      if (res.paymentIntentClientSecret) {
        // Real payment: authorize the hold via Stripe, then resolve by status.
        setPendingStatus(res.matchStatus ?? null);
        setPaymentClientSecret(res.paymentIntentClientSecret);
        return;
      }
      // Beta / fake-door: backend already applied the unlock.
      await resolveByStatus(res.matchStatus);
    } catch (err) {
      const { message } = await parseApiError(err);
      setError(message || 'Unlock failed');
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
      setError(err instanceof Error ? err.message : 'Decline failed');
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

  // ── Terminal states (timeout / dissolved / expired) ──────────────────
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

  // ── Completed (review handled later — F5) ────────────────────────────
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

  // status === 'unlocked' is handled by the routing effect (redirect).
  if (match.status === 'unlocked') return null;

  const partnerTrip = currentUser
    ? (match.userId1 === currentUser.userId ? match.trip2 : match.trip1)
    : match.trip2;
  const myTrip = currentUser
    ? (match.userId1 === currentUser.userId ? match.trip1 : match.trip2)
    : match.trip1;

  const partnerFirstName = partnerLoading ? '…' : (partner?.firstName ?? '?');
  const initial = partner?.firstName?.[0]?.toUpperCase() ?? '?';
  const partnerDestination = partnerTrip?.destination ?? '—';
  const partnerLuggage = partnerTrip?.luggage ?? 0;
  const fromTerminal = myTrip?.terminal ?? '—';

  const unlockFeeDisplay = airport?.unlockFee
    ? formatCurrency(airport.unlockFee, currency)
    : '€0.99';

  // ── Waiting panel: I paid, partner hasn't ────────────────────────────
  if (waiting) {
    return (
      <div className={styles.screen}>
        <TopNav showLogo showBack right={<DeadlineCountdown deadline={match.unlockDeadline} />} />
        <div className={styles.sheet}>
          <div className={styles.handle} />
          <div className={styles.celebration}>
            <div className={styles.celebrationIcon}><MIcon name="check" size={22} sw={2.5} /></div>
            <div className={styles.celebrationText}>
              <h2 className={styles.celebrationTitle}>Hai sbloccato ✓</h2>
              <p className={styles.celebrationCopy}>
                Aspettiamo che {partnerFirstName} sblocchi. <strong>€0 finché non sblocca anche lui</strong> — se non risponde in tempo, nessun addebito.
              </p>
            </div>
          </div>
          <div className={styles.partnerCard}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarBlur}>{initial}</div>
            </div>
            <div className={styles.partnerInfo}>
              <div className={styles.partnerNameRow}>
                <span className={styles.partnerName}>{partnerFirstName}</span>
              </div>
              <div className={styles.partnerMeta}><span>In attesa di sblocco…</span></div>
            </div>
            <div className={styles.lockBadge}><MIcon name="clock" size={16} sw={2} /></div>
          </div>
          <div className={styles.unlockNote}>Ti avviseremo appena {partnerFirstName} sblocca.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <TopNav showLogo showBack right={
        <DeadlineCountdown deadline={match.unlockDeadline} />
      } />

      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* Header: small icon + title inline */}
        <div className={styles.celebration}>
          <div className={styles.celebrationIcon}>
            <MIcon name="check" size={22} sw={2.5} />
          </div>
          <div className={styles.celebrationText}>
            <h2 className={styles.celebrationTitle}>{urgent ? `${partnerFirstName} ha già sbloccato!` : 'Match found!'}</h2>
            <p className={styles.celebrationCopy}>
              {urgent ? 'Sblocca ora per non perdere il match — paghi solo se sbloccate entrambi.' : 'Unlock to meet your ride partner.'}
            </p>
          </div>
        </div>

        {/* Deal tile: savings + destination combined */}
        <div className={styles.dealTile}>
          <div className={styles.dealRow}>
            <div className={styles.dealCol}>
              <div className={styles.dealLabel}>You save</div>
              <div className={styles.dealSavings}>
                {savingsCents > 0 ? formatCurrency(savingsCents, currency) : '—'}
              </div>
            </div>
            <div className={styles.dealDivider} />
            <div className={styles.dealCol}>
              <div className={styles.dealLabel}>Destination</div>
              <div className={styles.dealDest}>{partnerDestination}</div>
            </div>
          </div>
          {/* Trip summary strip */}
          <div className={styles.tripStrip}>
            <MIcon name="map-pin" size={12} sw={2} />
            <span>{fromTerminal} → {partnerDestination}</span>
          </div>
        </div>

        {/* Partner card */}
        <div className={styles.partnerCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarBlur}>{initial}</div>
            <div className={styles.avatarLock}>
              <MIcon name="eye" size={18} sw={2} />
            </div>
          </div>
          <div className={styles.partnerInfo}>
            <div className={styles.partnerNameRow}>
              <span className={styles.partnerName}>{partnerFirstName}</span>
              {partner?.verified && (
                <span className={styles.verifiedBadge}>
                  <MIcon name="shield-check" size={12} sw={2} />
                  Verified
                </span>
              )}
            </div>
            <div className={styles.partnerMeta}>
              <span>→ {partnerDestination}</span>
              {partnerLuggage > 0 && (
                <span className={styles.metaDot}>·</span>
              )}
              {partnerLuggage > 0 && (
                <span>
                  <MIcon name="briefcase" size={12} sw={2} />
                  {' '}{partnerLuggage} bag{partnerLuggage !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className={styles.lockBadge}>
            <MIcon name="lock" size={16} sw={2} />
          </div>
        </div>

        <button
          type="button"
          className={styles.unlockBtn}
          onClick={handleUnlock}
          disabled={unlocking || !canUnlock}
        >
          <MIcon name="zap" size={20} sw={2} />
          {unlocking ? 'Unlocking…' : `Unlock for ${unlockFeeDisplay}`}
        </button>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.unlockNote}>
          Beta · gratuito per i primi 100 utenti
        </div>

        <button
          type="button"
          className={styles.declineBtn}
          onClick={handleDecline}
          disabled={declining || unlocking}
        >
          {declining ? 'Declining…' : 'Decline match'}
        </button>
      </div>

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

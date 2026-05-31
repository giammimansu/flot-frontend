import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MIcon } from '../components/ui';
import { TopNav } from '../components/layout/TopNav';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useMatchStore } from '../stores/matchStore';
import { useAuthStore } from '../stores/authStore';
import { fetchMatch, unlockTrip, declineMatch } from '../services/matches';
import { fetchUser } from '../services/users';
import { formatCurrency } from '../lib/formatters';
import { useCountdown } from '../hooks/useCountdown';
import type { LockedMatch, MatchResponse, PublicUser } from '../types/api';
import styles from './MatchLocked.module.css';

function BetaUnlockSheet({
  onConfirm,
  onCancel,
  confirming,
  error,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
  error: string | null;
}) {
  return (
    <div className={styles.paymentSheet}>
      <div className={styles.betaIconRow}>
        <div className={styles.betaIcon}>🎉</div>
      </div>
      <div className={styles.paymentHeader}>
        <div className={styles.paymentTitle}>You're in beta!</div>
        <div className={styles.betaBody}>
          Sei tra i primi 100 utenti di Flot. Grazie per far parte di questo viaggio con noi — il tuo unlock è completamente <strong>gratuito</strong>.
        </div>
      </div>
      {error && <div className={styles.payError}>{error}</div>}
      <div className={styles.paymentActions}>
        <button className={styles.payBtn} onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Unlocking…' : 'Unlock gratis 🚀'}
        </button>
        <button className={styles.payCancel} onClick={onCancel} disabled={confirming}>Cancel</button>
      </div>
    </div>
  );
}

function isLocked(m: MatchResponse | null): m is LockedMatch {
  return !!m && m.status === 'pending';
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
  const airport = useAirportStore((s) => s.selectedAirport);
  const tripId = useTripStore((s) => s.tripId);
  const cachedMatch = useMatchStore((s) => s.currentMatch);
  const setMatch = useMatchStore((s) => s.setMatch);
  const currentUser = useAuthStore((s) => s.user);

  const [match, setLocalMatch] = useState<MatchResponse | null>(
    cachedMatch && cachedMatch.matchId === matchId ? cachedMatch : null,
  );
  const [partner, setPartner] = useState<PublicUser | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [loading, setLoading] = useState(!match);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showBetaSheet, setShowBetaSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);

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

  useEffect(() => {
    if (!match || match.status !== 'pending' || !currentUser) return;
    const partnerUserId = match.userId1 === currentUser.userId ? match.userId2 : match.userId1;
    setPartnerLoading(true);
    fetchUser(partnerUserId)
      .then(setPartner)
      .catch((e) => console.warn('[MatchLocked] fetchUser failed', e))
      .finally(() => setPartnerLoading(false));
  }, [match, currentUser]);

  useEffect(() => {
    if (match && !isLocked(match)) {
      navigate(`/connection/${match.matchId}`, { replace: true });
    }
  }, [match, navigate]);

  const currency = airport?.currency ?? 'EUR';
  const savingsCents = isLocked(match) && match.savings ? Math.round(match.savings * 100) : 0;

  const handleUnlock = () => {
    if (!matchId || !tripId || unlocking) return;
    setError(null);
    setShowBetaSheet(true);
  };

  const handleBetaConfirm = async () => {
    if (!matchId || !tripId || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      await unlockTrip(tripId, { matchId });
      navigate(`/connection/${matchId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed');
      setConfirming(false);
    }
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

  if (match && !isLocked(match)) return null;

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

  // Cost split: if savings exist, full fare = savings + each share; derive payAmount
  // We don't have yourShare here (only in UnlockedMatch), so show savings only.
  const unlockFeeDisplay = airport?.unlockFee
    ? formatCurrency(airport.unlockFee, currency)
    : '€0.99';

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
            <h2 className={styles.celebrationTitle}>Match found!</h2>
            <p className={styles.celebrationCopy}>Unlock to meet your ride partner.</p>
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
          disabled={unlocking}
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

      {showBetaSheet && (
        <div className={styles.paymentOverlay}>
          <BetaUnlockSheet
            onConfirm={handleBetaConfirm}
            onCancel={() => { setShowBetaSheet(false); setError(null); }}
            confirming={confirming}
            error={error}
          />
        </div>
      )}
    </div>
  );
}

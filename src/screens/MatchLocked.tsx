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
  const [loading, setLoading] = useState(!match);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [declining, setDeclining] = useState(false);
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
  const waiting = isPartial && iAmUnlocker;
  const urgent = isPartial && !iAmUnlocker;
  const canUnlock = isPending || urgent;

  useEffect(() => {
    if (!match || !currentUser || !(isPending || isPartial)) return;
    const partnerUserId = match.userId1 === currentUser.userId ? match.userId2 : match.userId1;
    fetchUser(partnerUserId)
      .then(setPartner)
      .catch((e) => console.warn('[MatchLocked] fetchUser failed', e));
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
  const currency = airport?.currency ?? 'EUR';

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

  // ── Meeting time (B) — free decisional filter; placeholder until backend wires it.
  const meetingTime = myTrip?.flightTime ? formatTime(myTrip.flightTime) : '—';

  // Trust signal — placeholder until rating/trip count is wired.
  const trustSignal = '★ Nuovo profilo';

  const unlockFeeDisplay = airport?.unlockFee
    ? formatCurrency(airport.unlockFee / 100, currency)
    : '€1,99';

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
                <img src={partnerPhoto} alt="" className={styles.avatarPhotoBlurred} />
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
      <TopNav showLogo showBack right={<DeadlineCountdown deadline={match.unlockDeadline} />} />

      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.celebration}>
          <div className={styles.celebrationIcon}>
            <MIcon name="check" size={22} sw={2.5} />
          </div>
          <div className={styles.celebrationText}>
            <h2 className={styles.celebrationTitle}>
              {urgent ? `${partnerFirstName} ha già sbloccato!` : 'Match trovato!'}
            </h2>
            <p className={styles.celebrationCopy}>
              {urgent
                ? 'Sblocca ora — paghi solo se sbloccate entrambi.'
                : 'Condividete la stessa tratta.'}
            </p>
          </div>
        </div>

        {/* ── A) My flight recap ── */}
        <div className={styles.recapTile}>
          <div className={styles.recapLabel}>Il tuo volo</div>
          <div className={styles.recapRoute}>
            <span className={styles.recapAirport}>{airportCode}{myTerminal ? ` ${myTerminal}` : ''}</span>
            <MIcon name="arrow-right" size={14} sw={2} />
            <span className={styles.recapDest}>{myDestination}</span>
          </div>
          <div className={styles.recapMeta}>
            <MIcon name="clock" size={13} sw={2} />
            <span>{myDate} · {myTime}</span>
            {myTrip?.flightNumber && (
              <>
                <span className={styles.metaDot}>·</span>
                <span>{myTrip.flightNumber}</span>
              </>
            )}
          </div>
        </div>

        {/* ── B) Match partner (partially visible) ── */}
        <div className={styles.partnerCard}>
          <div className={styles.avatarWrap}>
            {partnerPhoto ? (
              <img src={partnerPhoto} alt="" className={styles.avatarPhotoBlurred} />
            ) : (
              <div className={`${styles.avatar} ${styles.avatarBlurred}`}>{initial}</div>
            )}
          </div>
          <div className={styles.partnerInfo}>
            <div className={styles.partnerNameRow}>
              <span className={styles.partnerName}>{partnerFirstName}</span>
              {partner?.verified && (
                <span className={styles.verifiedBadge}>
                  <MIcon name="shield" size={12} sw={2} />
                  Verificato
                </span>
              )}
            </div>
            <div className={styles.partnerMeta}>
              <span className={styles.trustSignal}>{trustSignal}</span>
            </div>
            <div className={styles.meetingRow}>
              <MIcon name="clock" size={13} sw={2} />
              <span>Ritrovo: {myDate} {meetingTime}</span>
            </div>
          </div>
        </div>

        {/* ── C) Locked content list ── */}
        <div className={styles.lockedList}>
          <div className={styles.lockedListHeader}>
            <MIcon name="lock" size={13} sw={2} />
            Sblocca per vedere
          </div>
          <div className={styles.lockedItem}>
            <MIcon name="map-pin" size={16} sw={2} />
            <div className={styles.lockedItemText}>
              <span className={styles.lockedItemTitle}>Pick-up point</span>
              <span className={styles.lockedItemBlur}>Punto di incontro preciso</span>
            </div>
          </div>
          <div className={styles.lockedItem}>
            <MIcon name="message-circle" size={16} sw={2} />
            <div className={styles.lockedItemText}>
              <span className={styles.lockedItemTitle}>Chat con {partnerFirstName}</span>
              <span className={styles.lockedItemBlur}>Scrivi per coordinarvi</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.unlockBtn}
          onClick={handleUnlock}
          disabled={unlocking || !canUnlock}
        >
          <MIcon name="zap" size={20} sw={2} />
          {unlocking ? 'Sblocco…' : `Sblocca per ${unlockFeeDisplay}`}
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
          {declining ? 'Rifiuto…' : 'Rifiuta match'}
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

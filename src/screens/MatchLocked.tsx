import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { MIcon, ComingSoonModal } from '../components/ui';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useMatchStore } from '../stores/matchStore';
import { fetchMatch, unlockTrip } from '../services/matches';
import { formatCurrency } from '../lib/formatters';
import type { LockedMatch, MatchResponse } from '../types/api';
import styles from './MatchLocked.module.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

/** Inner form rendered inside <Elements> — has access to stripe hooks */
function StripePaymentForm({
  onSuccess,
  onCancel,
  matchId,
  amount,
  currency,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  matchId: string;
  amount: number;
  currency: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError(null);
    const returnUrl = `${window.location.origin}${window.location.pathname}#/connection/${matchId}`;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });
    if (error) {
      setPayError(error.message ?? 'Payment failed');
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className={styles.paymentSheet}>
      <div className={styles.paymentHeader}>
        <div className={styles.paymentTitle}>Complete your unlock</div>
        <div className={styles.paymentSub}>
          {formatCurrency(amount, currency.toUpperCase())} · {currency.toUpperCase()}
        </div>
      </div>
      <PaymentElement />
      {payError && <div className={styles.payError}>{payError}</div>}
      <div className={styles.paymentActions}>
        <button className={styles.payBtn} onClick={handlePay} disabled={!stripe || paying}>
          {paying ? 'Processing…' : 'Pay & unlock'}
        </button>
        <button className={styles.payCancel} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

const FAKE_DOOR_MODE = import.meta.env.VITE_FAKE_DOOR_MODE === 'true';

function isLocked(m: MatchResponse | null): m is LockedMatch {
  return !!m && m.status === 'pending';
}

export function MatchLocked() {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const airport = useAirportStore((s) => s.selectedAirport);
  const tripId = useTripStore((s) => s.tripId);
  const cachedMatch = useMatchStore((s) => s.currentMatch);
  const setMatch = useMatchStore((s) => s.setMatch);

  const [match, setLocalMatch] = useState<MatchResponse | null>(
    cachedMatch && cachedMatch.matchId === matchId ? cachedMatch : null,
  );
  const [loading, setLoading] = useState(!match);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [paymentData, setPaymentData] = useState<{ clientSecret: string; amount: number; currency: string } | null>(null);

  // Fetch match
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

  const currency = airport?.currency ?? 'EUR';
  const unlockFeeCents = airport?.unlockFee ?? 99;
  const savingsCents = isLocked(match) ? Math.round(match.savings * 100) : 0;

  const handleUnlock = async () => {
    if (!matchId || !tripId || unlocking) return;
    setUnlocking(true);
    setError(null);
    try {
      const resp = await unlockTrip(tripId, { matchId, fakeDoor: FAKE_DOOR_MODE });
      if (FAKE_DOOR_MODE) {
        setModalOpen(true);
      } else {
        // Show Stripe payment sheet with the PaymentIntent client secret
        setPaymentData({
          clientSecret: resp.paymentIntentClientSecret,
          amount: resp.amount,
          currency: resp.currency,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed');
    } finally {
      setUnlocking(false);
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
        <div className={styles.topNav}>
          <div className={styles.brand}>
            <div className={styles.brandDot} />
            <span className={styles.brandText}>FLOT</span>
          </div>
        </div>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!isLocked(match)) {
    // Already unlocked → forward
    if (match) navigate(`/connection/${match.matchId}`, { replace: true });
    return null;
  }

  const partner = match.partner;
  const initial = partner.firstName?.[0]?.toUpperCase() ?? '?';

  return (
    <div className={styles.screen}>
      <div className={styles.topNav}>
        <div className={styles.brand}>
          <div className={styles.brandDot} />
          <span className={styles.brandText}>FLOT</span>
        </div>
        <span className={styles.foundPill}>
          <span className={styles.foundDot} />
          Match found
        </span>
      </div>

      <div className={styles.glow}>
        <div className={styles.glowOuter}>
          <div className={styles.glowInner}>
            <MIcon name="check" size={36} sw={2.5} />
          </div>
        </div>
      </div>

      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.celebration}>
          <h2 className={styles.celebrationTitle}>Match found!</h2>
          <p className={styles.celebrationCopy}>
            Unlock to meet your ride partner.
          </p>
        </div>

        <div className={styles.valueGrid}>
          <div className={styles.valueTile}>
            <div className={styles.valueLabel}>Destination</div>
            <div className={styles.valueDest}>{partner.destination}</div>
          </div>
          <div className={styles.valueTileSavings}>
            <div className={styles.valueLabelSavings}>You save</div>
            <div className={styles.valueSavings}>
              {formatCurrency(savingsCents, currency)}
            </div>
          </div>
        </div>

        <div className={styles.partnerCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarBlur}>{initial}</div>
            <div className={styles.avatarLock}>
              <MIcon name="eye" size={18} sw={2} />
            </div>
          </div>
          <div className={styles.partnerInfo}>
            <div className={styles.partnerName}>{partner.firstName}</div>
            <div className={styles.partnerDest}>
              Heading to {partner.destination}
            </div>
            <span className={styles.partnerSavings}>
              Saves {formatCurrency(savingsCents, currency)} together
            </span>
          </div>
          <div className={styles.lockBadge}>
            <MIcon name="eye" size={16} sw={2} />
          </div>
        </div>

        <button
          type="button"
          className={styles.unlockBtn}
          onClick={handleUnlock}
          disabled={unlocking}
        >
          <MIcon name="zap" size={20} sw={2} />
          {unlocking ? 'Unlocking…' : `Unlock for ${formatCurrency(unlockFeeCents, currency)}`}
        </button>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.unlockNote}>
          One-time unlock · no subscription required
        </div>
      </div>

      <ComingSoonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Stripe Payment Sheet overlay */}
      {paymentData && matchId && (
        <div className={styles.paymentOverlay}>
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: paymentData.clientSecret, appearance: { theme: 'stripe' } }}
          >
            <StripePaymentForm
              matchId={matchId}
              amount={paymentData.amount}
              currency={paymentData.currency}
              onSuccess={() => navigate(`/connection/${matchId}`)}
              onCancel={() => setPaymentData(null)}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FLOT — PaymentSheet (F4)
   Authorizes the unlock hold (Stripe manual-capture PaymentIntent).
   Confirming a manual-capture PI authorizes the €1.99 hold; the actual
   capture happens server-side only when BOTH partners have authorized.
   ============================================================ */

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BottomSheet } from '../ui/BottomSheet';
import { MBtn } from '../ui';
import { getStripe } from '../../lib/stripe';
import styles from './PaymentSheet.module.css';

interface PaymentSheetProps {
  open: boolean;
  clientSecret: string | null;
  amountLabel: string;     // e.g. "€1.99"
  onClose: () => void;
  /** Hold authorized successfully — proceed by matchStatus. */
  onAuthorized: () => void;
}

function PaymentForm({ amountLabel, onAuthorized, onClose }: {
  amountLabel: string;
  onAuthorized: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Pagamento non riuscito. Riprova.');
      setSubmitting(false);
      return;
    }

    // Manual capture → authorized hold sits in requires_capture (or processing).
    if (paymentIntent && ['requires_capture', 'succeeded', 'processing'].includes(paymentIntent.status)) {
      onAuthorized();
      return;
    }

    setError('Autorizzazione non completata. Riprova.');
    setSubmitting(false);
  };

  return (
    <div className={styles.form}>
      <div className={styles.trust}>
        Addebito solo quando <strong>entrambi</strong> sbloccate. Nessun mutuo sblocco = nessun addebito.
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <div className={styles.error}>{error}</div>}
      <MBtn variant="dark" onClick={pay} loading={submitting} disabled={!stripe || submitting}>
        Autorizza {amountLabel}
      </MBtn>
      <MBtn variant="secondary" onClick={onClose} disabled={submitting}>
        Annulla
      </MBtn>
    </div>
  );
}

export function PaymentSheet({ open, clientSecret, amountLabel, onClose, onAuthorized }: PaymentSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} aria-label="Sblocca il match">
      <div className={styles.sheet}>
        <h2 className={styles.title}>Sblocca il contatto</h2>
        {clientSecret ? (
          <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: 'flat' } }}>
            <PaymentForm amountLabel={amountLabel} onAuthorized={onAuthorized} onClose={onClose} />
          </Elements>
        ) : (
          <div className={styles.error}>Sessione di pagamento non disponibile.</div>
        )}
      </div>
    </BottomSheet>
  );
}

/* ============================================================
   FLOT — IdentityVerification Screen
   /verify  (ProtectedRoute)
   ============================================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { TopNav } from '../../components/layout/TopNav';
import { HomeIndicator } from '../../components/layout/HomeIndicator';
import { verifyIdentity } from '../../services/users';
import styles from './IdentityVerification.module.css';

type State = 'idle' | 'loading' | 'success' | 'error';

export function IdentityVerification() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleStart() {
    setState('loading');
    setErrorMsg(null);
    try {
      const { clientSecret } = await verifyIdentity();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
      if (!stripe) throw new Error('Stripe non disponibile');
      const result = await stripe.verifyIdentity(clientSecret);
      if (result.error) {
        setErrorMsg(result.error.message ?? 'Verifica annullata.');
        setState('error');
      } else {
        setState('success');
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Errore durante la verifica.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className={styles.root}>
        <TopNav showBack showLogo={false} title="Verifica identità" showAvatar={false} />
        <div className={styles.successState}>
          <div className={styles.successIcon}>✓</div>
          <div className={styles.successTitle}>Identità verificata!</div>
          <div className={styles.successSub}>
            Il tuo badge verificato è ora visibile agli altri utenti.
          </div>
          <button className={styles.primaryBtn} onClick={() => navigate('/profile')}>
            Torna al profilo
          </button>
        </div>
        <HomeIndicator />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <TopNav showBack showLogo={false} title="Verifica identità" showAvatar={false} />

      <div className={styles.scrollArea}>
        {/* Explanation card */}
        <div className={styles.explainCard}>
          <div className={styles.explainIcon}>🪪</div>
          <div className={styles.explainTitle}>Cosa verificheremo</div>
          <div className={styles.explainText}>
            Caricherai un documento d&apos;identità valido (carta d&apos;identità o passaporto).
            Il processo richiede circa 2 minuti ed è gestito da Stripe Identity in modo sicuro.
          </div>
        </div>

        {/* Benefits */}
        <div className={styles.sectionLabel}>Perché verificarsi</div>
        <div className={styles.benefitsList}>
          <div className={styles.benefitRow}>
            <span className={styles.benefitIcon}>🔒</span>
            <div className={styles.benefitBody}>
              <div className={styles.benefitTitle}>Massima privacy</div>
              <div className={styles.benefitSub}>I tuoi dati non vengono condivisi con i partner di viaggio.</div>
            </div>
          </div>
          <div className={styles.benefitRow}>
            <span className={styles.benefitIcon}>✓</span>
            <div className={styles.benefitBody}>
              <div className={styles.benefitTitle}>Badge verificato</div>
              <div className={styles.benefitSub}>Aumenta la fiducia e le probabilità di match.</div>
            </div>
          </div>
          <div className={styles.benefitRow}>
            <span className={styles.benefitIcon}>⚡️</span>
            <div className={styles.benefitBody}>
              <div className={styles.benefitTitle}>Priorità nei match</div>
              <div className={styles.benefitSub}>Gli utenti verificati vengono abbinati prima.</div>
            </div>
          </div>
        </div>

        {state === 'error' && errorMsg && (
          <div className={styles.errorBox}>{errorMsg}</div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={handleStart}
            disabled={state === 'loading'}
            type="button"
          >
            {state === 'loading' ? 'Avvio verifica…' : 'Inizia verifica'}
          </button>
          <button
            className={styles.skipBtn}
            onClick={() => navigate(-1)}
            type="button"
          >
            Salta per ora
          </button>
        </div>

        <HomeIndicator />
      </div>
    </div>
  );
}

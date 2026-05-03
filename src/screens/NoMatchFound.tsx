/* ============================================================
   FLOT — No Match Found Screen
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { MIcon } from '../components/ui';
import { useAirportStore } from '../stores/airportStore';
import { useTripStore } from '../stores/tripStore';
import { useMatchStore } from '../stores/matchStore';
import styles from './NoMatchFound.module.css';

const WHY_REASONS = [
  'Fewer travelers on this route at this time.',
  'Your destination zone had low demand.',
  'Try again — matches improve with more users.',
];

export function NoMatchFound() {
  const navigate = useNavigate();
  const airport = useAirportStore((s) => s.selectedAirport);
  const tripTerminal = useTripStore((s) => s.terminal);
  const currentTrip = useTripStore((s) => s.currentTrip);
  const resetTrip = useTripStore((s) => s.reset);
  const resetMatch = useMatchStore((s) => s.reset);

  const isLive = !currentTrip?.mode || currentTrip.mode === 'live';
  const terminalLabel = tripTerminal ?? 'the terminal';
  const timeoutMin = Math.round((airport?.searchTimeoutSec ?? 180) / 60);

  const handleCancel = () => {
    resetTrip();
    resetMatch();
    navigate('/check-in', { replace: true });
  };

  const handleSchedule = () => {
    resetMatch();
    navigate('/check-in', { state: { defaultMode: 'scheduled' }, replace: true });
  };

  const handleHome = () => {
    resetTrip();
    resetMatch();
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topNav}>
        <div className={styles.brand}>
          <div className={styles.brandDot} />
          <span className={styles.brandText}>FLOT</span>
        </div>
      </div>

      <div className={styles.body}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIconOuter}>
            <div className={styles.heroIconInner}>
              <MIcon name="clock" size={32} sw={1.75} />
            </div>
          </div>
          <h2 className={styles.heroTitle}>
            {isLive ? 'Nessuno trovato ora' : 'No partners found this time.'}
          </h2>
          <p className={styles.heroCopy}>
            {isLive
              ? 'Sei ancora in lista — ti avvisiamo se qualcuno cerca nella tua direzione.'
              : `We scanned ${terminalLabel} for ${timeoutMin} minutes but couldn't find anyone heading your way right now.`}
          </p>
        </div>

        {/* Guarantee */}
        <div className={styles.guaranteeCard}>
          <div className={styles.guaranteeIcon}>
            <MIcon name="shield" size={22} sw={2} />
          </div>
          <div>
            <div className={styles.guaranteeTitle}>
              {isLive ? "Sei in lista d'attesa." : "You haven't been charged."}
            </div>
            <div className={styles.guaranteeBody}>
              {isLive
                ? 'Ti notificheremo se qualcuno cerca nella tua direzione.'
                : 'Your hold has been fully released.'}
            </div>
          </div>
        </div>

        {/* Why */}
        <div className={styles.whyCard}>
          <div className={styles.whyHeader}>
            <MIcon name="info" size={16} />
            <span className={styles.whyHeaderLabel}>Why this happens</span>
          </div>
          {WHY_REASONS.map((text, i) => (
            <div
              key={i}
              className={`${styles.whyItem} ${i < WHY_REASONS.length - 1 ? styles.whyItemBorder : ''}`}
            >
              <div className={styles.whyDot} />
              <span className={styles.whyText}>{text}</span>
            </div>
          ))}
        </div>

        {/* Hint */}
        <div className={styles.hintCard}>
          <div className={styles.hintIcon}>
            <MIcon name="zap" size={16} />
          </div>
          <div>
            <div className={styles.hintTitle}>
              More travelers arrive at peak flight times.
            </div>
            <div className={styles.hintBody}>
              Try again then for a better chance of matching.
            </div>
          </div>
        </div>

        <div className={styles.spacer} />
      </div>

      {/* Action area */}
      <div className={styles.actionArea}>
        {isLive ? (
          <>
            <button type="button" className={styles.tryAgainBtn} onClick={handleCancel}>
              <MIcon name="x" size={20} sw={2} />
              Annulla ricerca
            </button>
            <button type="button" className={styles.homeBtn} onClick={handleSchedule}>
              <MIcon name="timer" size={16} sw={2} />
              Prenota per dopo
            </button>
          </>
        ) : (
          <>
            <button type="button" className={styles.tryAgainBtn} onClick={handleCancel}>
              <MIcon name="search" size={20} sw={2} />
              Try again
            </button>
            <button type="button" className={styles.homeBtn} onClick={handleHome}>
              Back to home
            </button>
          </>
        )}
        <div className={styles.disclaimer}>
          {isLive
            ? 'FLOT non ti addebita nulla se non trovi un match.'
            : 'FLOT never charges for unmatched searches.'}
        </div>
      </div>
    </div>
  );
}

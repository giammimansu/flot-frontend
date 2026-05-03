import { useState } from 'react';
import { MIcon } from '../ui';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import styles from './PushPrompt.module.css';

interface PushPromptProps {
  onDismiss?: () => void;
}

export function PushPrompt({ onDismiss }: PushPromptProps) {
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (!isSupported) {
    return (
      <div className={styles.promptCard}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <MIcon name="bell" size={20} sw={2} />
          </div>
          <div className={styles.textWrap}>
            <div className={styles.title}>Riceverai un'email</div>
            <div className={styles.subtitle}>
              Il tuo browser non supporta le notifiche. Ti invieremo un'email appena troviamo un match.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className={styles.promptCard}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${styles.success}`}>
            <MIcon name="check" size={20} sw={2.5} />
          </div>
          <div className={styles.textWrap}>
            <div className={styles.title}>Notifiche attive</div>
            <div className={styles.subtitle}>
              Ti avviseremo appena troviamo un compagno per il tuo viaggio.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dismissed || permission === 'denied') return null;

  return (
    <div className={styles.promptCard}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <MIcon name="bell" size={20} sw={2} />
        </div>
        <div className={styles.textWrap}>
          <div className={styles.title}>Attiva le notifiche</div>
          <div className={styles.subtitle}>
            Ti avviseremo appena troviamo un compagno e quando sarà ora di partire.
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={() => requestPermission()}>
          <MIcon name="bell" size={16} sw={2} />
          Attiva
        </button>
        <button className={styles.secondaryBtn} onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}>
          Non ora
        </button>
      </div>
    </div>
  );
}

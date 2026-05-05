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
            <div className={styles.title}>You'll get an email</div>
            <div className={styles.subtitle}>
              Your browser doesn't support notifications. We'll email you as soon as we find a match.
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
            <div className={styles.title}>Notifications enabled</div>
            <div className={styles.subtitle}>
              We'll notify you as soon as we find a companion for your trip.
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
          <div className={styles.title}>Enable notifications</div>
          <div className={styles.subtitle}>
            We'll alert you when we find a companion and when it's time to leave.
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.primaryBtn} onClick={() => requestPermission()}>
          <MIcon name="bell" size={16} sw={2} />
          Enable
        </button>
        <button className={styles.secondaryBtn} onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}>
          Not now
        </button>
      </div>
    </div>
  );
}

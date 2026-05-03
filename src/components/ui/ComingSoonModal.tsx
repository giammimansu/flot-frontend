/* ============================================================
   FLOT — Coming Soon (Fake Door) Modal
   Shown on unlock when VITE_FAKE_DOOR_MODE=true
   ============================================================ */

import { useEffect } from 'react';
import { MIcon } from './MIcon';
import styles from './ComingSoonModal.module.css';

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  badge?: string;
}

export function ComingSoonModal({
  open,
  onClose,
  title = 'Coming soon',
  message = 'Unlocking match details will be available when FLOT launches publicly. During beta, all matches are free.',
  badge = 'Beta',
}: ComingSoonModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.scrim}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <div className={styles.iconOuter}>
            <div className={styles.iconInner}>
              <MIcon name="sparkles" size={24} sw={2} />
            </div>
          </div>
        </div>
        <div className={styles.body}>
          <span className={styles.badge}>{badge}</span>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.copy}>{message}</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.grid}>
          <div>
            <div className={styles.gridLabel}>Beta access</div>
            <div className={styles.gridValueOk}>Free</div>
          </div>
          <div>
            <div className={styles.gridLabel}>Launch</div>
            <div className={styles.gridValue}>Q3 2026</div>
          </div>
        </div>
        <button
          type="button"
          className={styles.dismiss}
          onClick={onClose}
        >
          Got it, thanks
        </button>
      </div>
    </div>
  );
}

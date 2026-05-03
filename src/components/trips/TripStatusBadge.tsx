import { MIcon } from '../ui';
import styles from './TripStatusBadge.module.css';

type TripStatus = 'scheduled' | 'searching' | 'matched' | 'unlocked' | 'completed' | 'expired' | 'cancelled';

interface TripStatusBadgeProps {
  status: TripStatus;
}

const CONFIG: Record<TripStatus, { label: string; bg: string; color: string; dot?: boolean; icon?: 'check' }> = {
  scheduled: { label: 'Programmato', bg: 'var(--amber-soft)', color: '#92400E', dot: true },
  searching: { label: 'Ricerca in corso', bg: 'var(--amber-soft)', color: '#92400E', dot: true },
  matched: { label: 'Match trovato', bg: 'var(--success-soft)', color: '#15803D', dot: true },
  unlocked: { label: 'Sbloccato', bg: '#EFF6FF', color: '#1D4ED8' },
  completed: { label: 'Completato', bg: 'var(--surface-2)', color: 'var(--ink-muted)', icon: 'check' },
  expired: { label: 'Scaduto', bg: 'var(--error-soft)', color: '#DC2626' },
  cancelled: { label: 'Cancellato', bg: 'var(--surface-2)', color: 'var(--ink-subtle)' },
};

export function TripStatusBadge({ status }: TripStatusBadgeProps) {
  const conf = CONFIG[status] || CONFIG.scheduled;
  
  return (
    <div 
      className={styles.badge} 
      style={{ backgroundColor: conf.bg, color: conf.color }}
    >
      {conf.dot && (
        <span className={`${styles.dot} ${styles.pulsingDot}`} />
      )}
      {conf.icon && (
        <span className={styles.icon}>
          <MIcon name={conf.icon as any} size={10} sw={3} />
        </span>
      )}
      {conf.label}
    </div>
  );
}

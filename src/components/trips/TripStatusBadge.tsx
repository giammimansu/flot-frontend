import styles from './TripStatusBadge.module.css';

type TripStatus = 'scheduled' | 'searching' | 'matched' | 'unlocked' | 'completed' | 'expired' | 'cancelled';

interface TripStatusBadgeProps {
  status: TripStatus;
}

const CONFIG: Record<TripStatus, { label: string; variant: string; dot?: boolean }> = {
  scheduled: { label: 'Programmato', variant: 'warning', dot: true },
  searching: { label: 'In cerca', variant: 'warning', dot: true },
  matched: { label: 'Match trovato', variant: 'success', dot: true },
  unlocked: { label: 'Confermato', variant: 'accent' },
  completed: { label: 'Completato', variant: 'neutral' },
  expired: { label: 'Scaduto', variant: 'error' },
  cancelled: { label: 'Cancellato', variant: 'error' },
};

export function TripStatusBadge({ status }: TripStatusBadgeProps) {
  const conf = CONFIG[status] || CONFIG.scheduled;

  return (
    <div className={`${styles.badge} ${styles[conf.variant]}`}>
      {conf.dot && <span className={`${styles.dot} ${styles.pulsingDot}`} />}
      {conf.label}
    </div>
  );
}

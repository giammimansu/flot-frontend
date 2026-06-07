/* ============================================================
   FLOT — NotificationsSheet (F10)
   In-app notification feed.
   ============================================================ */

import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../ui/BottomSheet';
import type { NotificationItem } from '../../types/api';
import styles from './NotificationsSheet.module.css';

interface NotificationsSheetProps {
  open: boolean;
  items: NotificationItem[];
  loading?: boolean;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ora';
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

export function NotificationsSheet({ open, items, loading, onClose }: NotificationsSheetProps) {
  const navigate = useNavigate();

  const go = (n: NotificationItem) => {
    const matchId = n.payload?.matchId as string | undefined;
    const tripId = n.payload?.tripId as string | undefined;
    if (matchId) navigate(`/match/${matchId}`);
    else if (tripId) navigate(`/trip/${tripId}`);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} aria-label="Notifiche">
      <div className={styles.sheet}>
        <h2 className={styles.title}>Notifiche</h2>

        {loading ? (
          <div className={styles.empty}>Caricamento…</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>Nessuna notifica.</div>
        ) : (
          <div className={styles.list}>
            {items.map((n) => {
              const clickable = !!(n.payload?.matchId || n.payload?.tripId);
              return (
                <button
                  key={n.sk}
                  type="button"
                  className={`${styles.item} ${n.read ? '' : styles.unread}`}
                  onClick={clickable ? () => go(n) : undefined}
                  style={clickable ? undefined : { cursor: 'default' }}
                >
                  <div className={styles.itemHead}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                  </div>
                  <div className={styles.itemBody}>{n.body}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

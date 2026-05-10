import { motion, AnimatePresence } from 'framer-motion';
import { MIcon } from './MIcon';
import type { FlightLookupStatus, FlightInfo } from '../../hooks/useFlightLookup';
import type { AirlineInfo } from '../../lib/airlinePrefix';
import styles from './FlightLookupFeedback.module.css';

interface Props {
  status: FlightLookupStatus;
  airline: AirlineInfo | null;
  flightInfo: FlightInfo | null;
  errorMessage: string | null;
  flightDate: string;
}

export function FlightLookupFeedback({ status, airline, flightInfo, errorMessage, flightDate }: Props) {
  return (
    <AnimatePresence mode="wait">
      {status === 'prefix_found' && airline && (
        <motion.div
          key="prefix"
          className={styles.row}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <MIcon name="plane-landing" size={14} className={styles.iconNeutral} />
          <span className={styles.textNeutral}>
            {airline.name}
            {!flightDate && ' — add flight date to verify'}
          </span>
        </motion.div>
      )}

      {status === 'loading' && (
        <motion.div
          key="loading"
          className={styles.row}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span className={styles.spinner} />
          <span className={styles.textNeutral}>Checking flight…</span>
        </motion.div>
      )}

      {status === 'found' && flightInfo && (
        <motion.div
          key="found"
          className={`${styles.card} ${styles.cardSuccess}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.cardRow}>
            <MIcon name="check-circle" size={16} className={styles.iconSuccess} />
            <span className={styles.textSuccess}>{flightInfo.airline.name}</span>
            {!!flightInfo.delayMinutes && flightInfo.delayMinutes > 0 && (
              <span className={styles.delayBadge}>+{flightInfo.delayMinutes} min</span>
            )}
          </div>
          <div className={styles.cardRow}>
            <MIcon name="clock" size={14} className={styles.iconMuted} />
            <span className={styles.textMuted}>
              Arrives {formatLocalTime(flightInfo.arrivalTimeLocal)}
              {flightInfo.origin && ` from ${flightInfo.origin}`}
            </span>
          </div>
          <div className={styles.cardRow}>
            <MIcon name="radio" size={14} className={styles.iconSuccess} />
            <span className={styles.textMuted}>{flightInfo.status}</span>
          </div>
        </motion.div>
      )}

      {status === 'not_found' && (
        <motion.div
          key="not_found"
          className={styles.row}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <MIcon name="alert-circle" size={14} className={styles.iconError} />
          <span className={styles.textError}>{errorMessage}</span>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          key="error"
          className={styles.row}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <MIcon name="wifi-off" size={14} className={styles.iconMuted} />
          <span className={styles.textMuted}>{errorMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatLocalTime(isoLocal: string | undefined): string {
  if (!isoLocal) return '—';
  try {
    return new Date(isoLocal).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoLocal;
  }
}

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MIcon } from './MIcon';
import { useNotificationStore } from '../../stores/notificationStore';
import styles from './Toast.module.css';

export function Toast() {
  const { toast, hideToast } = useNotificationStore();

  // Auto hide after 5s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [toast, hideToast]);

  return (
    <div className={styles.toastWrap}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={styles.toast}
            onClick={() => {
              toast.onClick?.();
              hideToast();
            }}
          >
            <div className={styles.toastIcon}>
              <MIcon name="bell" size={20} sw={2} />
            </div>
            <div className={styles.toastContent}>
              <div className={styles.toastTitle}>{toast.title}</div>
              <div className={styles.toastBody}>{toast.body}</div>
            </div>
            <button
              className={styles.toastClose}
              onClick={(e) => {
                e.stopPropagation();
                hideToast();
              }}
            >
              <MIcon name="x" size={16} sw={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

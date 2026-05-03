import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MIcon } from '../ui';
import type { IconName } from '../ui';
import { useAuthStore } from '../../stores/authStore';
import { authSignOut } from '../../services/auth';
import styles from './ProfileMenu.module.css';

interface ProfileMenuProps {
  open: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: IconName;
  path?: string;
  action?: () => void | Promise<void>;
  danger?: boolean;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
};

const sheetTransition = {
  type: 'spring' as const,
  damping: 32,
  stiffness: 420,
};

export function ProfileMenu({ open, onClose }: ProfileMenuProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);

  const handleLogout = useCallback(async () => {
    onClose();
    await authSignOut();
    reset();
    navigate('/');
  }, [onClose, reset, navigate]);

  const menuItems: MenuItem[] = [
    { label: 'Profilo', icon: 'user', path: '/profile' },
    { label: 'Verifica identità', icon: 'badge-check', path: '/verify' },
    { label: 'Abbonamento PRO', icon: 'crown', path: '/pro' },
    { label: 'Impostazioni', icon: 'settings', path: '/settings' },
    { label: 'Esci', icon: 'log-out', action: handleLogout, danger: true },
  ];

  const handleItem = (item: MenuItem) => {
    if (item.action) {
      void item.action();
    } else if (item.path) {
      onClose();
      navigate(item.path);
    }
  };

  const initials = user?.firstName?.[0]?.toUpperCase() ?? '?';
  const hasPhoto = Boolean(user?.photoUrl);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          onClick={onClose}
          aria-hidden="true"
        >
          <motion.div
            className={styles.sheet}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={sheetTransition}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menu profilo"
          >
            {/* Handle */}
            <div className={styles.handle}>
              <div className={styles.handleBar} />
            </div>

            {/* User header */}
            <div className={styles.userHeader}>
              <div className={styles.avatarLarge}>
                {hasPhoto ? (
                  <img
                    src={user!.photoUrl!}
                    alt={user?.firstName ?? 'Profilo'}
                    className={styles.avatarImg}
                  />
                ) : (
                  <span className={styles.avatarInitials}>{initials}</span>
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </span>
                <span className={styles.userEmail}>{user?.email}</span>
              </div>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Menu items */}
            <nav role="menu" aria-label="Menu profilo" className={styles.menu}>
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''}`}
                  onClick={() => handleItem(item)}
                >
                  <span className={styles.menuIcon}>
                    <MIcon name={item.icon} size={20} sw={1.75} />
                  </span>
                  <span className={styles.menuLabel}>{item.label}</span>
                  {!item.danger && (
                    <MIcon name="chevron-right" size={16} sw={1.5} />
                  )}
                </button>
              ))}
            </nav>

            <div className={styles.safeArea} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

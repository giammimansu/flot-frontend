/* ============================================================
   FLOT — Profile Screen
   /profile  (ProtectedRoute, TabBar shown)
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../../components/layout/TopNav';
import { TabBar } from '../../components/layout/TabBar';
import { HomeIndicator } from '../../components/layout/HomeIndicator';
import { useAuthStore } from '../../stores/authStore';
import { getMe } from '../../services/users';
import type { User } from '../../types/api';
import styles from './Profile.module.css';

/* ── Sub-components ── */

interface RowProps {
  icon: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}
function Row({ icon, label, sub, right, onClick, danger }: RowProps) {
  return (
    <button
      className={`${styles.row} ${danger ? styles.rowDanger : ''}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowBody}>
        <span className={styles.rowLabel}>{label}</span>
        {sub && <span className={styles.rowSub}>{sub}</span>}
      </span>
      {right !== undefined ? (
        right
      ) : onClick ? (
        <span className={styles.chevron}>›</span>
      ) : null}
    </button>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}
function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.toggle} ${checked ? styles.toggleOn : styles.toggleOff}`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

/* ── Main screen ── */

export function Profile() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const authReset = useAuthStore((s) => s.reset);

  const [user, setUser] = useState<User | null>(authUser);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifOffers, setNotifOffers] = useState(false);

  useEffect(() => {
    getMe().then(setUser).catch(() => { /* fallback to cached auth user */ });
  }, []);

  function handleLogout() {
    authReset();
    navigate('/');
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase().trim() || '?'
    : '?';

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  return (
    <div className={styles.root}>
      <TopNav showLogo={false} title="Profile" showBack={false} showAvatar={false} />

      <div className={styles.scrollArea}>
        {/* Profile card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarInitials}>{initials}</div>
            <button className={styles.editBadge} aria-label="Edit photo" type="button">
              ✎
            </button>
          </div>

          <div className={styles.profileName}>{fullName || '—'}</div>
          <div className={styles.profileEmail}>{user?.email ?? ''}</div>

          {user?.verified && (
            <span className={styles.verifiedBadge}>✓ Verified</span>
          )}

          <div className={styles.statsStrip}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>—</div>
              <div className={styles.statLabel}>Trips</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>—</div>
              <div className={styles.statLabel}>Saved</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>4.9 ★</div>
              <div className={styles.statLabel}>Rating</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className={styles.sectionLabel}>Notifications</div>
        <div className={styles.section}>
          <Row
            icon="🔔"
            label="Match found"
            right={<Toggle checked={notifMatch} onChange={setNotifMatch} label="Match found" />}
          />
          <Row
            icon="✈️"
            label="Trip reminder"
            right={<Toggle checked={notifReminder} onChange={setNotifReminder} label="Trip reminder" />}
          />
          <Row
            icon="🎁"
            label="Special offers"
            right={<Toggle checked={notifOffers} onChange={setNotifOffers} label="Special offers" />}
          />
        </div>

        {/* Account */}
        <div className={styles.sectionLabel}>Account</div>
        <div className={styles.section}>
          <Row
            icon="🪪"
            label="Verify identity"
            sub={user?.verified ? 'Verified' : 'Get the verified badge'}
            onClick={() => navigate('/verify')}
          />
          <Row
            icon="💳"
            label="Payment method"
          />
          <Row
            icon="🌍"
            label="Language"
            sub={user?.lang ? user.lang.toUpperCase() : 'EN'}
          />
          <Row
            icon="🔒"
            label="Privacy & security"
          />
        </div>

        {/* Support */}
        <div className={styles.sectionLabel}>Support</div>
        <div className={styles.section}>
          <Row
            icon="❓"
            label="Help center"
            onClick={() => window.open('https://flot.app/help', '_blank', 'noopener,noreferrer')}
          />
          <Row
            icon="📄"
            label="Terms of service"
            onClick={() => window.open('https://flot.app/terms', '_blank', 'noopener,noreferrer')}
          />
        </div>

        {/* Logout */}
        <div className={styles.section}>
          <Row icon="🚪" label="Sign out" onClick={handleLogout} danger />
        </div>

        <div className={styles.version}>FLOT v1.0.0-beta · Made in Milan</div>

        <HomeIndicator />
      </div>

      <TabBar />
    </div>
  );
}

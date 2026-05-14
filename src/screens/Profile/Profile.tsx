/* ============================================================
   FLOT — Profile Screen
   /profile  (ProtectedRoute, TabBar shown)
   ============================================================ */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../../components/layout/TopNav';
import { TabBar } from '../../components/layout/TabBar';
import { HomeIndicator } from '../../components/layout/HomeIndicator';
import { InstallPrompt } from '../../components/ui/InstallPrompt';
import { useAuthStore } from '../../stores/authStore';
import { useAirportStore } from '../../stores/airportStore';
import { getMe } from '../../services/users';
import { getMyTrips } from '../../services/trips';
import { usePushNotifications } from '../../hooks/usePushNotifications';
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
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [totalSaved, setTotalSaved] = useState<number | null>(null);
  const airport = useAirportStore((s) => s.selectedAirport);
  const { permission, requestPermission, isSupported } = usePushNotifications();

  useEffect(() => {
    getMe().then(setUser).catch(() => { /* fallback to cached auth user */ });
    getMyTrips().then((res) => {
      const completed = res.trips.filter((t) => t.status === 'completed' || t.status === 'unlocked');
      setTripCount(completed.length);
      const baseFare = airport?.baseFare ?? 12000;
      setTotalSaved(completed.length * Math.round(baseFare / 2 / 100));
    }).catch(() => {});
  }, []);

  function handleLogout() {
    authReset();
    navigate('/');
  }

  const initials = user
    ? (user.name ?? '').split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'
    : '?';

  const fullName = user?.name ?? '';

  return (
    <div className={styles.root}>
      <TopNav showLogo showBack={false} />

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
              <div className={styles.statValue}>{tripCount ?? '—'}</div>
              <div className={styles.statLabel}>Trips</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>{totalSaved != null ? `€${totalSaved}` : '—'}</div>
              <div className={styles.statLabel}>Saved</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>—</div>
              <div className={styles.statLabel}>Rating</div>
            </div>
          </div>
        </div>

        {/* Install prompt */}
        <InstallPrompt className={styles.installPrompt} />

        {/* Notifications */}
        {isSupported && (
          <>
            <div className={styles.sectionLabel}>Notifiche</div>
            <div className={styles.section}>
              <Row
                icon="🔔"
                label="Notifiche push"
                sub={
                  permission === 'granted' ? 'Attive' :
                  permission === 'denied' ? 'Bloccate — cambia nelle impostazioni del browser' :
                  'Tocca per attivare'
                }
                right={
                  permission === 'denied' ? null :
                  <Toggle
                    checked={permission === 'granted'}
                    onChange={(v) => { if (v) requestPermission(); }}
                    label="Notifiche push"
                  />
                }
                onClick={permission === 'default' ? () => requestPermission() : undefined}
              />
            </div>
          </>
        )}

        {/* Logout */}
        <div className={styles.section}>
          <Row icon="🚪" label="Esci" onClick={handleLogout} danger />
        </div>

        <div className={styles.version}>FLOT v1.0.0-beta · Made in Milan</div>

        <HomeIndicator />
      </div>

      <TabBar />
    </div>
  );
}

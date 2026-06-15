/* ============================================================
   FLOT — Profile Screen
   /profile  (ProtectedRoute, TabBar shown)
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../../components/layout/TopNav';
import { TabBar } from '../../components/layout/TabBar';
import { HomeIndicator } from '../../components/layout/HomeIndicator';
import { InstallPrompt } from '../../components/ui/InstallPrompt';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { MBtn } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useAirportStore } from '../../stores/airportStore';
import { getMe, requestPhotoUploadUrl, uploadPhotoToS3, waitForPhotoUpdate, updateProfile } from '../../services/users';
import { getMyTrips } from '../../services/trips';
import { getUserRating } from '../../services/reviews';
import { parseApiError } from '../../services/api';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { changeAppLanguage, normalizeLang, type AppLang } from '../../i18n/config';
import type { User } from '../../types/api';
import styles from './Profile.module.css';

const LANG_OPTIONS = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
];
const GENDER_OPTION_VALUES = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
const GENDER_LABEL_KEY: Record<string, 'profile:genderMale' | 'profile:genderFemale' | 'profile:genderOther' | 'profile:genderPreferNot'> = {
  male: 'profile:genderMale',
  female: 'profile:genderFemale',
  other: 'profile:genderOther',
  prefer_not_to_say: 'profile:genderPreferNot',
};
const AGE_OPTIONS = ['18-25', '26-35', '36-45', '46-55', '56+'].map((v) => ({ value: v, label: v }));

const langLabelOf = (v?: string) => LANG_OPTIONS.find((o) => o.value === v)?.label ?? '—';

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
  const hasInteractiveRight = right != null;
  const className = `${styles.row} ${danger ? styles.rowDanger : ''}`;
  const inner = (
    <>
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowBody}>
        <span className={styles.rowLabel}>{label}</span>
        {sub && <span className={styles.rowSub}>{sub}</span>}
      </span>
      {right !== undefined ? right : onClick ? <span className={styles.chevron}>›</span> : null}
    </>
  );
  if (hasInteractiveRight) {
    const handleKeyDown = onClick
      ? (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
        }
      : undefined;
    return (
      <div
        className={className}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        {inner}
      </div>
    );
  }
  return (
    <button className={className} onClick={onClick} type="button">
      {inner}
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
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      type="button"
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

/* ── Main screen ── */

export function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const authReset = useAuthStore((s) => s.reset);

  const [user, setUser] = useState<User | null>(authUser);
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [totalSaved, setTotalSaved] = useState<number | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const airport = useAirportStore((s) => s.selectedAirport);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ lang: '', gender: '', ageGroup: '' });
  const langAtOpenRef = useRef<string>('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { permission, requestPermission, isSupported } = usePushNotifications();

  useEffect(() => {
    if (user?.photoUrl) setPhotoLoadError(false);
  }, [user?.photoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      if (u?.photoUrl) setPhotoLoadError(false);
      if (u?.userId) {
        getUserRating(u.userId).then((r) => setRatingAvg(r.average)).catch(() => {});
      }
    }).catch(() => { /* fallback to cached auth user */ });
    getMyTrips().then((res) => {
      const completed = res.trips.filter((t) => t.status === 'completed' || t.status === 'unlocked');
      setTripCount(completed.length);
      const baseFare = airport?.baseFare ?? 12000;
      setTotalSaved(completed.length * Math.round(baseFare / 2 / 100));
    }).catch(() => {});
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowed.includes(file.type)) {
      setPhotoError(t('profile:photoBadFormat'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError(t('profile:photoTooLarge'));
      return;
    }

    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const { uploadUrl, uploadFields, photoKey } = await requestPhotoUploadUrl(file.type);
      await uploadPhotoToS3(uploadUrl, uploadFields, file);

      // Optimistic update with CDN URL immediately
      const optimisticPhotoUrl = `${import.meta.env.VITE_CDN_URL}/${photoKey}`;
      const optimistic = user ? { ...user, photoUrl: optimisticPhotoUrl } : null;
      if (optimistic) { setUser(optimistic); updateUser(optimistic); setPhotoLoadError(false); }

      // Then replace with processed version from Lambda (resize/blur)
      waitForPhotoUpdate(user?.photoUrl).then((updated) => {
        setUser(updated);
        updateUser(updated);
        setPhotoLoadError(false); // processed photo is live — retry <img> render
      }).catch(() => { /* Lambda timeout — optimistic URL stays */ });
    } catch {
      setPhotoError(t('profile:photoUploadFailed'));
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function openEdit() {
    langAtOpenRef.current = user?.lang ?? '';
    setForm({
      lang: user?.lang ?? '',
      gender: user?.gender ?? '',
      ageGroup: user?.ageGroup ?? '',
    });
    setSaveError(null);
    setEditing(true);
  }

  /** Restore the UI language to whatever it was when the edit sheet opened. */
  function revertLanguage() {
    if (langAtOpenRef.current) {
      void changeAppLanguage(normalizeLang(langAtOpenRef.current));
    }
  }

  /** Live preview: switch the UI immediately as the user picks a language. */
  function handleLangChange(value: string) {
    setForm((f) => ({ ...f, lang: value }));
    if (value === 'it' || value === 'en') {
      void changeAppLanguage(value as AppLang);
    }
  }

  function handleCancelEdit() {
    revertLanguage();
    setEditing(false);
  }

  async function handleSaveProfile() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProfile({
        lang: form.lang || undefined,
        gender: form.gender || undefined,
        ageGroup: form.ageGroup || undefined,
      });
      setUser(updated);
      updateUser(updated);
      langAtOpenRef.current = updated.lang ?? form.lang;
      setEditing(false);
    } catch (err) {
      // Optimistic UI switched the language live — revert it on failure.
      revertLanguage();
      const { message } = await parseApiError(err);
      setSaveError(message || t('errors:saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    authReset();
    navigate('/');
  }

  const initials = user
    ? (
        user.firstName && user.lastName
          ? (user.firstName[0] + user.lastName[0]).toUpperCase()
          : (user.name ?? '').split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
      ) || '?'
    : '?';

  const fullName = user?.name ?? '';

  return (
    <div className={styles.root}>
      <TopNav showLogo showBack={false} />

      <div className={styles.scrollArea}>
        {/* Profile card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            {user?.photoUrl && !photoLoadError ? (
              <img
                src={user.photoUrl}
                alt={fullName}
                className={styles.avatar}
                onError={() => setPhotoLoadError(true)}
              />
            ) : (
              <div className={styles.avatarInitials}>{initials}</div>
            )}
            <button
              className={`${styles.editBadge} ${photoUploading ? styles.editBadgeLoading : ''}`}
              aria-label={t('profile:editPhotoAria')}
              type="button"
              disabled={photoUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoUploading ? '…' : '✎'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className={styles.fileInput}
              onChange={handlePhotoChange}
            />
          </div>
          {photoError && <div className={styles.photoError}>{photoError}</div>}

          <div className={styles.profileName}>{fullName || '—'}</div>
          <div className={styles.profileEmail}>{user?.email ?? ''}</div>

          {user?.verified && (
            <span className={styles.verifiedBadge}>✓ {t('profile:verified')}</span>
          )}

          <div className={styles.statsStrip}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{tripCount ?? '—'}</div>
              <div className={styles.statLabel}>{t('profile:statTrips')}</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>{totalSaved != null ? `€${totalSaved}` : '—'}</div>
              <div className={styles.statLabel}>{t('profile:statSaved')}</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>{ratingAvg != null ? ratingAvg.toFixed(1) : '—'}</div>
              <div className={styles.statLabel}>{t('profile:statRating')}</div>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className={styles.sectionLabel}>{t('profile:sectionAccount')}</div>
        <div className={styles.section}>
          <Row icon="🌐" label={t('profile:rowLanguage')} sub={langLabelOf(user?.lang)} />
          <Row icon="👤" label={t('profile:rowGender')} sub={user?.gender ? t(GENDER_LABEL_KEY[user.gender]) : '—'} />
          <Row icon="🎂" label={t('profile:rowAgeGroup')} sub={user?.ageGroup ?? '—'} />
          <Row icon="✎" label={t('profile:rowEditProfile')} onClick={openEdit} />
        </div>

        {/* Install prompt */}
        <InstallPrompt className={styles.installPrompt} />

        {/* Notifications */}
        {isSupported && (
          <>
            <div className={styles.sectionLabel}>{t('profile:sectionNotifications')}</div>
            <div className={styles.section}>
              <Row
                icon="🔔"
                label={t('profile:rowPush')}
                sub={
                  permission === 'granted' ? t('profile:pushOn') :
                  permission === 'denied' ? t('profile:pushBlocked') :
                  t('profile:pushTap')
                }
                right={
                  permission === 'denied' ? null :
                  <Toggle
                    checked={permission === 'granted'}
                    onChange={(v) => { if (v) requestPermission(); }}
                    label={t('profile:rowPush')}
                  />
                }
                onClick={permission === 'default' ? () => requestPermission() : undefined}
              />
            </div>
          </>
        )}

        {/* Logout */}
        <div className={styles.section}>
          <Row icon="🚪" label={t('profile:logout')} onClick={handleLogout} danger />
        </div>

        <div className={styles.version}>{t('profile:version')}</div>

        <HomeIndicator />
      </div>

      <BottomSheet open={editing} onClose={handleCancelEdit} aria-label={t('profile:editAria')}>
        <div className={styles.editSheet}>
          <h2 className={styles.editTitle}>{t('profile:editTitle')}</h2>

          <label className={styles.editField}>
            <span className={styles.editLabel}>{t('profile:rowLanguage')}</span>
            <select
              className={styles.editSelect}
              value={form.lang}
              onChange={(e) => handleLangChange(e.target.value)}
            >
              <option value="">—</option>
              {LANG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className={styles.editField}>
            <span className={styles.editLabel}>{t('profile:rowGender')}</span>
            <select
              className={styles.editSelect}
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="">—</option>
              {GENDER_OPTION_VALUES.map((v) => <option key={v} value={v}>{t(GENDER_LABEL_KEY[v])}</option>)}
            </select>
          </label>

          <label className={styles.editField}>
            <span className={styles.editLabel}>{t('profile:rowAgeGroup')}</span>
            <select
              className={styles.editSelect}
              value={form.ageGroup}
              onChange={(e) => setForm((f) => ({ ...f, ageGroup: e.target.value }))}
            >
              <option value="">—</option>
              {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          {saveError && <div className={styles.editError}>{saveError}</div>}

          <MBtn variant="dark" onClick={handleSaveProfile} loading={saving} disabled={saving}>
            {t('common:save')}
          </MBtn>
          <MBtn variant="secondary" onClick={handleCancelEdit} disabled={saving}>
            {t('common:cancel')}
          </MBtn>
        </div>
      </BottomSheet>

      <TabBar />
    </div>
  );
}

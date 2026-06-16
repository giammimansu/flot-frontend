/* ============================================================
   FLOT — Profile Screen
   /profile  (ProtectedRoute, TabBar shown)
   ============================================================ */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TabBar } from '../../components/layout/TabBar';
import { HomeIndicator } from '../../components/layout/HomeIndicator';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { MBtn, MIcon } from '../../components/ui';
import type { IconName } from '../../components/ui';
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

interface ListRowProps {
  icon: IconName;
  /** Icon chip tint: neutral (default) or brand (teal). */
  tint?: 'neutral' | 'brand';
  label: string;
  sub?: string;
  value?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}
function ListRow({ icon, tint = 'neutral', label, sub, value, right, onClick }: ListRowProps) {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  return (
    <Tag
      className={styles.row}
      onClick={onClick}
      type={interactive ? 'button' : undefined}
    >
      <span className={`${styles.rowChip} ${tint === 'brand' ? styles.rowChipBrand : ''}`}>
        <MIcon name={icon} size={18} sw={2} />
      </span>
      <span className={styles.rowBody}>
        <span className={styles.rowLabel}>{label}</span>
        {sub && <span className={styles.rowSub}>{sub}</span>}
      </span>
      {right !== undefined ? (
        right
      ) : (
        <span className={styles.rowRight}>
          {value && <span className={styles.rowValue}>{value}</span>}
          {interactive && <MIcon name="chevron-right" size={18} className={styles.chevron} />}
        </span>
      )}
    </Tag>
  );
}

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}
function Toggle({ checked, disabled, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
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

  const notifBlocked = permission === 'denied';

  const initials = user
    ? (
        user.firstName && user.lastName
          ? (user.firstName[0] + user.lastName[0]).toUpperCase()
          : (user.name ?? '').split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
      ) || '?'
    : '?';

  const fullName = user?.name ?? '';
  const isPro = !!user?.isPro;

  return (
    <div className={styles.root}>
      <div className={styles.scrollArea}>
        {/* ── Teal identity header ── */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.headerTitle}>{t('profile:title')}</h1>
            <button
              className={styles.gearBtn}
              type="button"
              aria-label={t('profile:settingsAria')}
              onClick={openEdit}
            >
              <MIcon name="settings" size={20} />
            </button>
          </div>

          <div className={styles.identity}>
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
                className={`${styles.cameraBtn} ${photoUploading ? styles.cameraBtnLoading : ''}`}
                aria-label={t('profile:editPhotoAria')}
                type="button"
                disabled={photoUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <MIcon name="camera" size={14} sw={2} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className={styles.fileInput}
                onChange={handlePhotoChange}
              />
            </div>

            <div className={styles.identityText}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{fullName || '—'}</span>
                {isPro && (
                  <span className={styles.proBadge}>
                    <MIcon name="star" size={11} fill="currentColor" sw={0} /> PRO
                  </span>
                )}
              </div>
              <div className={styles.email}>{user?.email ?? ''}</div>
            </div>
          </div>

          <button className={styles.editBtn} type="button" onClick={openEdit}>
            <MIcon name="pencil" size={16} sw={2} />
            {t('profile:rowEditProfile')}
          </button>
        </header>

        {/* ── Stats card (overlaps header) ── */}
        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{tripCount ?? '—'}</div>
            <div className={styles.statLabel}>{t('profile:statTrips')}</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={`${styles.statValue} ${styles.statValueBrand}`}>{totalSaved != null ? `€${totalSaved}` : '—'}</div>
            <div className={styles.statLabel}>{t('profile:statSaved')}</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValueRating}>
              <span className={styles.statValue}>{ratingAvg != null ? ratingAvg.toFixed(1) : '—'}</span>
              <MIcon name="star" size={15} fill="var(--accent-500)" color="var(--accent-500)" sw={0} />
            </div>
            <div className={styles.statLabel}>{t('profile:statRating')}</div>
          </div>
        </div>

        {/* ── Sections ── */}
        <div className={styles.sections}>
          {/* PRO banner */}
          {isPro && (
            <div className={styles.proBanner}>
              <span className={styles.proBannerIcon}>
                <MIcon name="star" size={20} fill="#fff" color="#fff" sw={0} />
              </span>
              <div className={styles.proBannerText}>
                <div className={styles.proBannerTitle}>{t('profile:proActive')}</div>
                <div className={styles.proBannerSub}>{t('profile:proSub')}</div>
              </div>
              <MIcon name="chevron-right" size={18} className={styles.proBannerChevron} />
            </div>
          )}

          {/* Account */}
          <section>
            <div className={styles.sectionLabel}>{t('profile:sectionAccount')}</div>
            <div className={styles.card}>
              <ListRow icon="languages" label={t('profile:rowLanguage')} value={langLabelOf(user?.lang)} onClick={openEdit} />
              <ListRow icon="user" label={t('profile:rowGender')} value={user?.gender ? t(GENDER_LABEL_KEY[user.gender]) : '—'} onClick={openEdit} />
              <ListRow icon="calendar" label={t('profile:rowAgeGroup')} value={user?.ageGroup ?? '—'} onClick={openEdit} />
            </div>
          </section>

          {/* Notifications */}
          {isSupported && (
            <section>
              <div className={styles.sectionLabel}>{t('profile:sectionNotifications')}</div>
              <div className={styles.card}>
                <ListRow
                  icon="bell"
                  tint="brand"
                  label={t('profile:notifGeneral')}
                  sub={
                    notifBlocked ? t('profile:pushBlocked') :
                    permission === 'granted' ? t('profile:notifGeneralSub') :
                    t('profile:pushTap')
                  }
                  right={
                    <Toggle
                      checked={permission === 'granted'}
                      disabled={notifBlocked}
                      onChange={(v) => { if (v && permission === 'default') requestPermission(); }}
                      label={t('profile:notifGeneral')}
                    />
                  }
                  onClick={permission === 'default' ? () => requestPermission() : undefined}
                />
              </div>
            </section>
          )}

          {/* Add to Home Screen */}
          <div className={styles.addHome}>
            <span className={styles.addHomeIcon}>
              <MIcon name="smartphone" size={20} sw={2} />
            </span>
            <div className={styles.addHomeText}>
              <div className={styles.addHomeTitle}>{t('profile:addHomeTitle')}</div>
              <div className={styles.addHomeBody}>
                {t('profile:addHomeBefore')}{' '}
                <MIcon name="share" size={14} className={styles.addHomeInlineIcon} />{' '}
                {t('profile:addHomeAfter')}{' '}
                <span className={styles.addHomeStrong}>{t('profile:addHomeAction')}</span>{' '}
                {t('profile:addHomeEnd')}
              </div>
            </div>
          </div>

          {/* General */}
          <section>
            <div className={styles.sectionLabel}>{t('profile:sectionGeneral')}</div>
            <div className={styles.card}>
              <ListRow icon="credit-card" label={t('profile:rowPayment')} onClick={() => {}} />
              <ListRow icon="shield-check" label={t('profile:rowPrivacy')} onClick={() => {}} />
              <ListRow icon="help-circle" label={t('profile:rowSupport')} onClick={() => {}} />
              <ListRow icon="file-text" label={t('profile:rowTerms')} onClick={() => {}} />
            </div>
          </section>

          {/* Logout */}
          <div className={styles.card}>
            <button className={styles.logoutRow} type="button" onClick={handleLogout}>
              <MIcon name="log-out" size={18} sw={2} />
              <span>{t('profile:logoutAccount')}</span>
            </button>
          </div>

          <div className={styles.version}>{t('profile:version')}</div>
        </div>

        {photoError && <div className={styles.photoError}>{photoError}</div>}

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

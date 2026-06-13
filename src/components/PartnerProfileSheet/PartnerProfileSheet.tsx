/* ============================================================
   FLOT — PartnerProfileSheet
   Bottom-sheet with the unlocked partner's full profile.
   Opened by tapping the partner avatar inside ConnectionUnlocked.
   ============================================================ */

import { useEffect, useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { fetchUserReviews } from '../../services/users';
import type { UnlockedPartner, PartnerReview } from '../../types/api';
import styles from './PartnerProfileSheet.module.css';

interface PartnerProfileSheetProps {
  open: boolean;
  partner: UnlockedPartner;
  onClose: () => void;
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Uomo',
  female: 'Donna',
  other: 'Altro',
  prefer_not_to_say: '—',
};

const LANG_LABELS: Record<string, string> = {
  it: 'Italiano',
  en: 'Inglese',
  fr: 'Francese',
  de: 'Tedesco',
  es: 'Spagnolo',
};

function StarRating({ value, count }: { value: number | null; count: number }) {
  if (value == null || count === 0) {
    return <span className={styles.noRating}>Nessuna recensione</span>;
  }
  return (
    <span className={styles.stars} aria-label={`Rating ${value} su 5, ${count} recensioni`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
      <span className={styles.ratingCount}>({count})</span>
    </span>
  );
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PartnerProfileSheet({ open, partner, onClose }: PartnerProfileSheetProps) {
  const initials = `${partner.firstName?.[0] ?? ''}${partner.lastName?.[0] ?? ''}`.toUpperCase();
  const fullName = `${partner.firstName ?? ''} ${partner.lastName ?? ''}`.trim();

  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Fetch reviews lazily when the sheet opens.
  useEffect(() => {
    if (!open || !partner.userId) return;
    let cancelled = false;
    setReviewsLoading(true);
    fetchUserReviews(partner.userId)
      .then((res) => { if (!cancelled) setReviews(res.reviews); })
      .catch(() => { if (!cancelled) setReviews([]); })
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [open, partner.userId]);

  const tripCount = partner.tripCount ?? 0;
  const reviewCount = partner.rating?.count ?? 0;

  const facts: Array<{ label: string; value: string }> = [];
  if (partner.ageGroup) facts.push({ label: 'Età', value: partner.ageGroup });
  if (partner.gender && partner.gender !== 'prefer_not_to_say') {
    facts.push({ label: 'Genere', value: GENDER_LABELS[partner.gender] ?? partner.gender });
  }
  if (partner.city) facts.push({ label: 'Città', value: partner.city });
  if (partner.lang) facts.push({ label: 'Lingua', value: LANG_LABELS[partner.lang] ?? partner.lang });

  return (
    <BottomSheet open={open} onClose={onClose} aria-label={`Profilo di ${partner.firstName}`}>
      <div className={styles.root}>
        <div className={styles.avatarWrap}>
          {partner.photoUrl ? (
            <img src={partner.photoUrl} alt={fullName} className={styles.avatar} />
          ) : (
            <div className={styles.avatarInitials}>{initials}</div>
          )}
          {partner.verified && (
            <span className={styles.verifiedBadge} aria-label="Verificato">✓</span>
          )}
        </div>

        <h2 className={styles.name}>{fullName}</h2>
        <StarRating value={partner.rating?.average ?? null} count={partner.rating?.count ?? 0} />

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{tripCount}</span>
            <span className={styles.statLabel}>{tripCount === 1 ? 'Viaggio' : 'Viaggi'}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{reviewCount}</span>
            <span className={styles.statLabel}>{reviewCount === 1 ? 'Recensione' : 'Recensioni'}</span>
          </div>
        </div>

        {partner.bio && <p className={styles.bio}>{partner.bio}</p>}

        {facts.length > 0 && (
          <dl className={styles.facts}>
            {facts.map((f) => (
              <div key={f.label} className={styles.factRow}>
                <dt className={styles.factLabel}>{f.label}</dt>
                <dd className={styles.factValue}>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {(reviewsLoading || reviews.length > 0) && (
          <div className={styles.reviews}>
            <h3 className={styles.reviewsTitle}>Recensioni</h3>
            {reviewsLoading ? (
              <div className={styles.reviewsEmpty}>Caricamento…</div>
            ) : (
              reviews.map((r, i) => (
                <div key={i} className={styles.reviewItem}>
                  <div className={styles.reviewHead}>
                    <span className={styles.reviewStars} aria-label={`${r.rating} su 5`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= r.rating ? styles.starFilled : styles.starEmpty}>★</span>
                      ))}
                    </span>
                    {r.createdAt && (
                      <span className={styles.reviewDate}>{formatReviewDate(r.createdAt)}</span>
                    )}
                  </div>
                  {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        )}

        <button className={styles.closeBtn} onClick={onClose}>
          Chiudi
        </button>
      </div>
    </BottomSheet>
  );
}

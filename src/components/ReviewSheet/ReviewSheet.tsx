/* ============================================================
   FLOT — ReviewSheet (P2 #11)
   Post-completion partner rating: overall 1-5 stars (required)
   + optional comment + optional per-dimension stars.
   ============================================================ */

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { MBtn } from '../ui';
import { createReview } from '../../services/reviews';
import { parseApiError } from '../../services/api';
import type { ReviewDimensionName } from '../../types/api';
import styles from './ReviewSheet.module.css';

interface ReviewSheetProps {
  open: boolean;
  matchId: string | null;
  partnerName?: string;
  onClose: () => void;
  /** Called when the review was recorded (or already existed). */
  onSubmitted: (matchId: string) => void;
}

/** Reusable 1-5 star row. value 0 = not yet rated. */
function StarRow({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className={styles.stars} role="radiogroup" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={`${styles.star} ${i <= display ? styles.starOn : styles.starOff}`}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${i} ${i === 1 ? 'stella' : 'stelle'}`}
          aria-checked={value === i}
          role="radio"
        >
          ★
        </button>
      ))}
    </div>
  );
}

const DIMENSIONS: { key: ReviewDimensionName; label: string }[] = [
  { key: 'punctuality', label: 'Puntualità' },
  { key: 'sociability', label: 'Socialità' },
  { key: 'reliability', label: 'Affidabilità' },
  { key: 'cleanliness', label: 'Pulizia/Comfort' },
];

export function ReviewSheet({ open, matchId, partnerName, onClose, onSubmitted }: ReviewSheetProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [dims, setDims] = useState<Record<ReviewDimensionName, number>>({
    punctuality: 0,
    sociability: 0,
    reliability: 0,
    cleanliness: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(0);
    setComment('');
    setDims({ punctuality: 0, sociability: 0, reliability: 0, cleanliness: 0 });
    setError(null);
    setSubmitting(false);
    setSubmitted(false);
  };

  const close = () => {
    // The parent is notified on the thank-you screen's dismissal too, so a
    // backdrop tap after a successful submit still marks the review as done.
    if (submitted && matchId) onSubmitted(matchId);
    reset();
    onClose();
  };

  const submit = async () => {
    if (!matchId || rating < 1 || submitting) return;
    setSubmitting(true);
    setError(null);
    // Only include dimensions actually rated (> 0) so the backend skips the rest.
    const dimensions = Object.fromEntries(
      Object.entries(dims).filter(([, v]) => v > 0),
    ) as Partial<Record<ReviewDimensionName, number>>;
    try {
      await createReview(matchId, {
        rating,
        comment: comment.trim() || undefined,
        dimensions: Object.keys(dimensions).length ? dimensions : undefined,
      });
      // Show the thank-you screen; the parent is notified when it's dismissed.
      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      const { status, message } = await parseApiError(err);
      if (status === 409) {
        // Already reviewed — treat as done.
        onSubmitted(matchId);
        reset();
        return;
      }
      if (status === 410) {
        setError('La finestra per la recensione (48h) è scaduta.');
      } else {
        setError(message || 'Invio recensione fallito. Riprova.');
      }
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <BottomSheet open={open} onClose={close} aria-label="Recensione inviata">
        <div className={styles.sheet}>
          <div className={styles.thanksIcon} aria-hidden="true">✓</div>
          <h2 className={styles.title}>Grazie!</h2>
          <p className={styles.sub}>
            Il tuo feedback è molto importante per noi: ci aiuta a costruire una
            rete di utenti sicura e affidabile.
          </p>
          <MBtn variant="dark" onClick={close}>
            Chiudi
          </MBtn>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open={open} onClose={close} aria-label="Lascia una recensione">
      <div className={styles.sheet}>
        <h2 className={styles.title}>
          Com'è andata{partnerName ? ` con ${partnerName}` : ''}?
        </h2>
        <p className={styles.sub}>Lascia una recensione al tuo partner di viaggio.</p>

        <StarRow value={rating} onChange={setRating} ariaLabel="Voto complessivo" />

        <textarea
          className={styles.comment}
          placeholder="Aggiungi un commento (opzionale)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
        />

        <div className={styles.dimensions}>
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key} className={styles.dimensionRow}>
              <span className={styles.dimensionLabel}>{label}</span>
              <StarRow
                value={dims[key]}
                onChange={(v) => setDims((prev) => ({ ...prev, [key]: v }))}
                ariaLabel={label}
              />
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <MBtn variant="dark" onClick={submit} disabled={rating < 1 || submitting} loading={submitting}>
          Invia recensione
        </MBtn>
        <MBtn variant="secondary" onClick={close} disabled={submitting}>
          Annulla
        </MBtn>
      </div>
    </BottomSheet>
  );
}

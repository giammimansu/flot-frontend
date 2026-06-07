/* ============================================================
   FLOT — ReviewSheet (P2 #11)
   Post-completion partner rating: 1-5 stars + optional comment.
   ============================================================ */

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { MBtn } from '../ui';
import { createReview } from '../../services/reviews';
import { parseApiError } from '../../services/api';
import styles from './ReviewSheet.module.css';

interface ReviewSheetProps {
  open: boolean;
  matchId: string | null;
  partnerName?: string;
  onClose: () => void;
  /** Called when the review was recorded (or already existed). */
  onSubmitted: (matchId: string) => void;
}

export function ReviewSheet({ open, matchId, partnerName, onClose, onSubmitted }: ReviewSheetProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(0);
    setHover(0);
    setComment('');
    setError(null);
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!matchId || rating < 1 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createReview(matchId, { rating, comment: comment.trim() || undefined });
      onSubmitted(matchId);
      reset();
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

  const display = hover || rating;

  return (
    <BottomSheet open={open} onClose={close} aria-label="Lascia una recensione">
      <div className={styles.sheet}>
        <h2 className={styles.title}>
          Com'è andata{partnerName ? ` con ${partnerName}` : ''}?
        </h2>
        <p className={styles.sub}>Lascia una recensione al tuo partner di viaggio.</p>

        <div className={styles.stars} role="radiogroup" aria-label="Voto">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              className={`${styles.star} ${i <= display ? styles.starOn : styles.starOff}`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${i} ${i === 1 ? 'stella' : 'stelle'}`}
              aria-checked={rating === i}
              role="radio"
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className={styles.comment}
          placeholder="Aggiungi un commento (opzionale)…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
        />

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

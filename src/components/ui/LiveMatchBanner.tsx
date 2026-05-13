import { useState, useEffect } from 'react';
import styles from './LiveMatchBanner.module.css';

interface LiveMatchBannerProps {
  airport?: string;
}

const AVATARS = [
  { initial: 'A', bg: '#CBD5E1' },
  { initial: 'M', bg: '#94A3B8' },
  { initial: 'L', bg: '#64748B' },
  { initial: 'G', bg: '#475569' },
];

// Deterministic pseudo-random count seeded on 3-hour bucket.
// Changes every 3h, consistent within same bucket across page loads.
function getLiveCount(): number {
  const bucket = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
  // lcg mix
  const h = ((bucket * 1664525 + 1013904223) >>> 0) % 100;
  return 15 + (h % 22); // range 15–36
}

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export function LiveMatchBanner({ airport = 'Malpensa' }: LiveMatchBannerProps) {
  const [count, setCount] = useState(getLiveCount);

  useEffect(() => {
    const now = Date.now();
    const currentBucketStart = Math.floor(now / THREE_HOURS_MS) * THREE_HOURS_MS;
    const msUntilNextBucket = currentBucketStart + THREE_HOURS_MS - now;

    const timeout = setTimeout(() => {
      setCount(getLiveCount());
      const interval = setInterval(() => setCount(getLiveCount()), THREE_HOURS_MS);
      return () => clearInterval(interval);
    }, msUntilNextBucket);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={styles.banner}>
      <div className={styles.topRow}>
        <span className={styles.liveBadge}>
          <span className={styles.liveDot} />
          LIVE
        </span>
        <div className={styles.avatarStack}>
          {AVATARS.map((a, i) => (
            <div
              key={a.initial}
              className={styles.avatar}
              style={{ background: a.bg, marginLeft: i === 0 ? 0 : -6 }}
            >
              {a.initial}
            </div>
          ))}
          <span className={styles.avatarExtra}>+{count - 4}</span>
        </div>
      </div>
      <p className={styles.copy}>
        <strong>{count} viaggiatori</strong> cercano un compagno da {airport} questa settimana.
      </p>
    </div>
  );
}

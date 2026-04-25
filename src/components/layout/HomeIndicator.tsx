import styles from './HomeIndicator.module.css';

/**
 * iOS-style home indicator bar.
 * Renders at the bottom of each screen for consistency.
 */
export function HomeIndicator() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.bar} />
    </div>
  );
}

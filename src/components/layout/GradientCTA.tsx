import type { ReactNode } from 'react';
import styles from './GradientCTA.module.css';

interface GradientCTAProps {
  children: ReactNode;
}

/**
 * Sticky bottom container with gradient fade.
 * Used on screens that need a floating primary action.
 */
export function GradientCTA({ children }: GradientCTAProps) {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}

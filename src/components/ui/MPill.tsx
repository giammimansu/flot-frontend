import type { ReactNode } from 'react';
import { MIcon } from './MIcon';
import type { IconName } from './MIcon';
import styles from './MPill.module.css';

type PillVariant = 'neutral' | 'success' | 'live' | 'error' | 'amber';

interface MPillProps {
  variant?: PillVariant;
  children: ReactNode;
  icon?: IconName;
  live?: boolean;
}

export function MPill({
  variant = 'neutral',
  children,
  icon,
  live = false,
}: MPillProps) {
  return (
    <span className={`${styles.pill} ${styles[variant]}`}>
      {live && <span className={styles.liveDot} />}
      {icon && <MIcon name={icon} size={14} />}
      {children}
    </span>
  );
}

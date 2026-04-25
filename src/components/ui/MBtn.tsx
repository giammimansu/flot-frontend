import type { ReactNode } from 'react';
import { MIcon } from './MIcon';
import type { IconName } from './MIcon';
import styles from './MBtn.module.css';

type BtnVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'outline';

interface MBtnProps {
  variant?: BtnVariant;
  children: ReactNode;
  onClick?: () => void;
  icon?: IconName;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  type?: 'button' | 'submit';
  'aria-label'?: string;
  id?: string;
}

export function MBtn({
  variant = 'primary',
  children,
  onClick,
  icon,
  full = true,
  disabled = false,
  loading = false,
  small = false,
  type = 'button',
  'aria-label': ariaLabel,
  id,
}: MBtnProps) {
  const isDisabled = disabled || loading;
  const classNames = [
    styles.btn,
    styles[variant],
    small ? styles.small : styles.regular,
    full ? styles.full : '',
    loading ? styles.loading : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      id={id}
      className={classNames}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        icon && <MIcon name={icon} size={small ? 18 : 20} />
      )}
      {children}
    </button>
  );
}

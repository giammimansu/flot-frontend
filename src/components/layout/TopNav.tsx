import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { MIcon } from '../ui';
import type { IconName } from '../ui';
import styles from './TopNav.module.css';

interface TopNavAction {
  icon: IconName;
  onClick: () => void;
  'aria-label': string;
}

interface TopNavProps {
  /** Show the FLOT logo (default for home screens) */
  showLogo?: boolean;
  /** Show a back button instead of logo */
  showBack?: boolean;
  /** Title text shown when no logo */
  title?: string;
  /** Right-side action buttons */
  actions?: TopNavAction[];
  /** Override right-side with custom content */
  right?: ReactNode;
}

export function TopNav({
  showLogo = true,
  showBack = false,
  title,
  actions,
  right,
}: TopNavProps) {
  const navigate = useNavigate();

  return (
    <nav className={styles.root} aria-label="Top navigation">
      {/* Left side */}
      <div>
        {showBack && (
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <MIcon name="chevron-left" size={20} />
          </button>
        )}
        {showLogo && !showBack && (
          <div className={styles.logo}>
            <div className={styles.logoDot} />
            <span className={styles.logoText}>FLOT</span>
          </div>
        )}
        {title && !showLogo && !showBack && (
          <h3>{title}</h3>
        )}
      </div>

      {/* Right side */}
      <div className={styles.actions}>
        {right}
        {actions?.map((action) => (
          <button
            key={action.icon}
            className={styles.iconBtn}
            onClick={action.onClick}
            aria-label={action['aria-label']}
          >
            <MIcon name={action.icon} size={18} />
          </button>
        ))}
      </div>
    </nav>
  );
}

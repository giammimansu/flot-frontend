import { MIcon } from './MIcon';
import styles from './MDestInput.module.css';

interface MDestInputProps {
  value?: string;
  placeholder: string;
  onClick: () => void;
  focused?: boolean;
  'aria-label'?: string;
}

export function MDestInput({
  value,
  placeholder,
  onClick,
  focused = false,
  'aria-label': ariaLabel,
}: MDestInputProps) {
  return (
    <div
      className={`${styles.root} ${focused ? styles.focused : styles.idle}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? placeholder}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.iconWrap}>
        <MIcon name="map-pin" size={20} />
      </div>
      <div className={styles.content}>
        <div className={value ? styles.valueText : styles.placeholderText}>
          {value || placeholder}
        </div>
      </div>
      <div className={styles.chevron}>
        <MIcon name="chevron-right" size={18} color="var(--ink-subtle)" />
      </div>
    </div>
  );
}

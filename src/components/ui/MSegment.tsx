import styles from './MSegment.module.css';

interface MSegmentProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
}

export function MSegment({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: MSegmentProps) {
  return (
    <div className={styles.root} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            className={`${styles.option} ${active ? styles.active : ''}`}
            onClick={() => onChange(opt)}
            role="tab"
            aria-selected={active}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

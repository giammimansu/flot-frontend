import styles from './MSegment.module.css';

interface MSegmentOption {
  id: string;
  label: string;
}

interface MSegmentProps {
  options: MSegmentOption[];
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
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            className={`${styles.option} ${active ? styles.active : ''}`}
            onClick={() => onChange(opt.id)}
            role="tab"
            aria-selected={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

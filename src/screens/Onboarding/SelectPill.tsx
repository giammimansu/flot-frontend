import styles from './Onboarding.module.css';

interface SelectPillProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  id?: string;
}

export function SelectPill({ label, selected, onSelect, id }: SelectPillProps) {
  return (
    <button
      id={id}
      type="button"
      className={`${styles.pill} ${selected ? styles.selected : ''}`}
      onClick={onSelect}
      aria-checked={selected}
      role="radio"
    >
      <span>{label}</span>
      <div className={styles.radioCircle}>
        <div className={styles.radioDot} />
      </div>
    </button>
  );
}

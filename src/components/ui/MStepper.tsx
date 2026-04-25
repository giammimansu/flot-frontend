import { MIcon } from './MIcon';
import styles from './MStepper.module.css';

interface MStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  'aria-label'?: string;
}

export function MStepper({
  value,
  onChange,
  min = 1,
  max = 4,
  'aria-label': ariaLabel,
}: MStepperProps) {
  return (
    <div className={styles.root} role="group" aria-label={ariaLabel}>
      <button
        className={styles.stepBtn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease"
      >
        <MIcon name="minus" size={16} sw={2.25} />
      </button>

      <div className={styles.value} aria-live="polite">
        {value}
      </div>

      <button
        className={styles.stepBtn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase"
      >
        <MIcon name="plus" size={16} sw={2.25} />
      </button>
    </div>
  );
}

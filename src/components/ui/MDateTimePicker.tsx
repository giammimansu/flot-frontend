import type { InputHTMLAttributes } from 'react';
import { MIcon } from './MIcon';
import styles from './MDateTimePicker.module.css';

interface MDateTimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
}

export function MDateTimePicker({ value, onChange, error, className, ...props }: MDateTimePickerProps) {
  return (
    <div className={`${styles.wrapper} ${error ? styles.error : ''} ${className || ''}`}>
      <MIcon name="clock" size={20} className={styles.icon} />
      <input
        type="datetime-local"
        className={styles.input}
        value={value || ''}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}

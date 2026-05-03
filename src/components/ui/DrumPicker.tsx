import { useRef, useEffect, useCallback } from 'react';
import styles from './DrumPicker.module.css';

const ITEM_H = 44;
const VISIBLE = 3;
const PAD = Math.floor(VISIBLE / 2) * ITEM_H; // 44px — centers first/last items

interface DrumColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  ariaLabel?: string;
}

function DrumColumn({ items, selectedIndex, onChange, ariaLabel }: DrumColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticRef = useRef(false);

  const scrollTo = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    programmaticRef.current = true;
    el.scrollTo({ top: index * ITEM_H, behavior });
    setTimeout(() => { programmaticRef.current = false; }, 400);
  }, []);

  // On mount: instant scroll to selected
  useEffect(() => {
    scrollTo(selectedIndex, 'instant');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // External selectedIndex change → scroll
  const prevIndex = useRef(selectedIndex);
  useEffect(() => {
    if (prevIndex.current !== selectedIndex && !programmaticRef.current) {
      scrollTo(selectedIndex);
    }
    prevIndex.current = selectedIndex;
  }, [selectedIndex, scrollTo]);

  const handleScroll = () => {
    if (programmaticRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const index = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
      programmaticRef.current = true;
      el.scrollTo({ top: index * ITEM_H, behavior: 'smooth' });
      setTimeout(() => { programmaticRef.current = false; }, 400);
      onChange(index);
    }, 80);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.max(0, selectedIndex - 1);
      scrollTo(next);
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(items.length - 1, selectedIndex + 1);
      scrollTo(next);
      onChange(next);
    }
  };

  return (
    <div className={styles.colWrap} role="listbox" aria-label={ariaLabel}>
      <div className={styles.selBand} aria-hidden="true" />
      <div className={styles.fadeTop} aria-hidden="true" />
      <div className={styles.fadeBottom} aria-hidden="true" />
      <div
        ref={scrollRef}
        className={styles.col}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        style={{ paddingTop: PAD, paddingBottom: PAD }}
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={`drum-item-${selectedIndex}`}
      >
        {items.map((item, i) => (
          <div
            key={item + i}
            id={i === selectedIndex ? `drum-item-${selectedIndex}` : undefined}
            className={styles.item}
            data-selected={i === selectedIndex ? 'true' : 'false'}
            role="option"
            aria-selected={i === selectedIndex}
            onClick={() => {
              scrollTo(i);
              onChange(i);
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface DrumPickerColumn {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  ariaLabel?: string;
}

export interface DrumPickerProps {
  columns: DrumPickerColumn[];
  ariaLabel?: string;
}

export function DrumPicker({ columns, ariaLabel }: DrumPickerProps) {
  return (
    <div className={styles.picker} aria-label={ariaLabel}>
      {columns.map((col, i) => (
        <DrumColumn
          key={i}
          items={col.items}
          selectedIndex={col.selectedIndex}
          onChange={col.onChange}
          ariaLabel={col.ariaLabel}
        />
      ))}
    </div>
  );
}

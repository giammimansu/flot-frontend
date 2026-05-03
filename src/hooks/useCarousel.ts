import { useState, useEffect, useRef } from 'react';

export function useCarousel(length: number, intervalMs = 3500) {
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') {
        setCurrent((prev) => (prev + 1) % length);
      }
    };
    timer.current = setInterval(tick, intervalMs);
    return () => {
      if (timer.current !== null) clearInterval(timer.current);
    };
  }, [length, intervalMs]);

  return current;
}

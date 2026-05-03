/* ============================================================
   FLOT — useCountdown Hook
   Reusable countdown timer that ticks every second.
   ============================================================ */

import { useEffect, useState, useCallback } from 'react';

interface UseCountdownOptions {
  /** Total seconds to count down from */
  totalSeconds: number;
  /** Called when countdown reaches zero */
  onComplete?: () => void;
  /** Start ticking immediately (default: true) */
  autoStart?: boolean;
}

interface UseCountdownReturn {
  /** Current remaining seconds */
  seconds: number;
  /** Formatted mm:ss string */
  display: string;
  /** Whether countdown has completed */
  isComplete: boolean;
  /** Reset back to initial value */
  reset: () => void;
}

export function useCountdown({
  totalSeconds,
  onComplete,
  autoStart = true,
}: UseCountdownOptions): UseCountdownReturn {
  const [seconds, setSeconds] = useState(totalSeconds);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds, running]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      onComplete?.();
    }
  }, [seconds, running, onComplete]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const reset = useCallback(() => {
    setSeconds(totalSeconds);
    setRunning(true);
  }, [totalSeconds]);

  return {
    seconds,
    display: `${mm}:${ss}`,
    isComplete: seconds === 0,
    reset,
  };
}

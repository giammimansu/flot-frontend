import { useState, useEffect, useRef } from 'react';
import { getAirlineFromPrefix, type AirlineInfo } from '../lib/airlinePrefix';
import { api } from '../services/api';

export type FlightLookupStatus =
  | 'idle'
  | 'prefix_found'
  | 'loading'
  | 'found'
  | 'not_found'
  | 'error';

export interface FlightInfo {
  airline: AirlineInfo;
  flightNumber: string;
  arrivalTimeLocal: string;
  arrivalTimeUtc: string;
  status: string;
  delayMinutes?: number;
  origin?: string;
  destination?: string;
}

interface UseFlightLookupReturn {
  status: FlightLookupStatus;
  airline: AirlineInfo | null;
  flightInfo: FlightInfo | null;
  errorMessage: string | null;
}

const FLIGHT_RE = /^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/;

export function useFlightLookup(
  flightNumber: string,
  flightDate: string,
): UseFlightLookupReturn {
  const [status, setStatus] = useState<FlightLookupStatus>('idle');
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clean = flightNumber.replace(/\s/g, '').toUpperCase();
  const airline = getAirlineFromPrefix(clean);
  const isComplete = FLIGHT_RE.test(clean) && clean.length >= 4;
  const hasDate = !!flightDate;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setFlightInfo(null);
    setErrorMessage(null);

    if (!clean || clean.length < 2) {
      setStatus('idle');
      return;
    }

    if (airline && !isComplete) {
      setStatus('prefix_found');
      return;
    }

    if (isComplete && !hasDate) {
      setStatus('prefix_found');
      return;
    }

    if (!isComplete) {
      setStatus('idle');
      return;
    }

    setStatus('loading');

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await api
          .get(`flights/lookup`, {
            searchParams: { number: clean, date: flightDate },
            signal: controller.signal,
          })
          .json<FlightInfo>();

        if (controller.signal.aborted) return;
        setFlightInfo(data);
        setStatus('found');
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        // ky throws HTTPError for non-2xx
        const httpError = err as { response?: Response };
        if (httpError.response?.status === 404) {
          setStatus('not_found');
          setErrorMessage('Flight not found for this date. Check the number and date.');
        } else {
          setStatus('error');
          setErrorMessage('Could not verify flight. You can still proceed.');
        }
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [clean, flightDate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, airline, flightInfo, errorMessage };
}

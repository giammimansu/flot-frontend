/* ============================================================
   FLOT — useWebSocket Hook
   Manages WebSocket lifecycle and event subscriptions.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { flotWs, type ConnectionStatus } from '../services/websocket';
import type { WsClientMessage, WsServerEvent } from '../types/ws';

type EventName = WsServerEvent['event'];
type EventData<E extends EventName> = Extract<WsServerEvent, { event: E }>['data'];

interface UseWebSocketOptions {
  /** Open connection on mount (default: true) */
  autoConnect?: boolean;
  /** Close connection on unmount (default: false — kept open across screens) */
  closeOnUnmount?: boolean;
}

interface UseWebSocketApi {
  status: ConnectionStatus;
  send: (msg: WsClientMessage) => boolean;
  on: <E extends EventName>(event: E, fn: (data: EventData<E>) => void) => void;
}

/**
 * Hook to interact with the FLOT WebSocket.
 * Subscriptions registered via `on()` are auto-cleaned on unmount.
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketApi {
  const { autoConnect = true, closeOnUnmount = false } = options;
  const [status, setStatus] = useState<ConnectionStatus>(flotWs.getStatus());
  const unsubsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (autoConnect) {
      flotWs.connect().catch(() => { /* swallowed */ });
    }

    // Track status via wildcard polling on any event + interval
    const interval = window.setInterval(() => {
      setStatus(flotWs.getStatus());
    }, 500);

    return () => {
      window.clearInterval(interval);
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [];
      if (closeOnUnmount) flotWs.disconnect();
    };
  }, [autoConnect, closeOnUnmount]);

  const on = <E extends EventName>(
    event: E,
    fn: (data: EventData<E>) => void,
  ): void => {
    const unsub = flotWs.on(event, fn as (data: never) => void);
    unsubsRef.current.push(unsub);
  };

  return {
    status,
    send: (msg) => flotWs.send(msg),
    on,
  };
}

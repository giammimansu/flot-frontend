/* ============================================================
   FLOT — WebSocket Service
   Connect, auto-reconnect with backoff, heartbeat, typed dispatch.
   ============================================================ */

import { getAccessToken } from './auth';
import type { WsClientMessage, WsServerEvent } from '../types/ws';

type EventName = WsServerEvent['event'];
type EventPayload<E extends EventName> = Extract<WsServerEvent, { event: E }>['data'];
type Listener<E extends EventName> = (data: EventPayload<E>) => void;
type AnyListener = (ev: WsServerEvent) => void;
type GenericListener = (data: unknown) => void;

type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed';

const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

class FlotWebSocket {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'idle';
  private listeners = new Map<EventName, Set<GenericListener>>();
  private anyListeners = new Set<AnyListener>();
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private manualClose = false;

  async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'open') return;
    this.manualClose = false;
    this.status = 'connecting';

    const token = await getAccessToken();
    const base = import.meta.env.VITE_WS_URL;
    const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.status = 'open';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    });

    ws.addEventListener('message', (e) => {
      this.handleMessage(e.data);
    });

    ws.addEventListener('close', () => {
      this.status = 'closed';
      this.stopHeartbeat();
      if (!this.manualClose) this.scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      try { ws.close(); } catch { /* noop */ }
    });
  }

  disconnect(): void {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch { /* noop */ }
      this.ws = null;
    }
    this.status = 'idle';
  }

  send(msg: WsClientMessage): boolean {
    if (this.ws && this.status === 'open') {
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  on<E extends EventName>(event: E, fn: Listener<E>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const wrapped = fn as GenericListener;
    set.add(wrapped);
    return () => set!.delete(wrapped);
  }

  onAny(fn: AnyListener): () => void {
    this.anyListeners.add(fn);
    return () => this.anyListeners.delete(fn);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!parsed || typeof parsed !== 'object' || !('event' in parsed)) return;
    const ev = parsed as WsServerEvent;
    this.anyListeners.forEach((fn) => fn(ev));
    const set = this.listeners.get(ev.event);
    if (set) {
      set.forEach((fn) => fn(ev.data));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.status === 'open') {
        try {
          this.ws.send(JSON.stringify({ action: 'ping' }));
        } catch { /* noop */ }
      }
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      BASE_BACKOFF_MS * 2 ** this.reconnectAttempts,
      MAX_BACKOFF_MS,
    );
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => { /* swallowed */ });
    }, delay);
  }
}

export const flotWs = new FlotWebSocket();
export type { ConnectionStatus };

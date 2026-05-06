import { getToken, onMessage, messaging } from '../lib/firebase';
import { api } from './api';

/* ─── SW Registration ────────────────────────────────────────── */

let swRegistration: ServiceWorkerRegistration | null = null;

async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  if (swRegistration) return swRegistration;

  // Inject Firebase config as query params — SW cannot read Vite env vars
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  });

  try {
    // Use a dedicated scope so this SW doesn't evict the Workbox precache SW at '/'
    swRegistration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params.toString()}`,
      { scope: '/firebase-cloud-messaging-push-scope' }
    );
    return swRegistration;
  } catch (err) {
    console.warn('[push] SW registration failed:', err);
    return null;
  }
}

/* ─── Permission + Token ─────────────────────────────────────── */

/**
 * Request push permission and register FCM token.
 * Must be called AFTER explicit user action (button tap).
 * Returns the FCM token or null if denied/unsupported.
 */
export async function requestPushPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('[push] Firebase messaging not initialized');
    return null;
  }

  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const reg = await getSwRegistration();
  if (!reg) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
      serviceWorkerRegistration: reg,
    });

    if (!token) return null;

    await api.put('users/me/push-token', {
      json: { token, platform: 'fcm' },
    });

    return token;
  } catch (err) {
    console.warn('[push] getToken failed:', err);
    return null;
  }
}

/* ─── Foreground Notifications ───────────────────────────────── */

type ForegroundHandler = (payload: {
  title: string;
  body: string;
  matchId?: string;
  tripId?: string;
}) => void;

/**
 * Listen for FCM messages while app is in foreground.
 * Call once at app boot (after auth).
 */
export function setupForegroundNotifications(handler: ForegroundHandler): () => void {
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'FLOT';
    const body = payload.notification?.body ?? '';
    const data = payload.data ?? {};

    handler({
      title,
      body,
      matchId: data['matchId'],
      tripId: data['tripId'],
    });
  });

  return unsubscribe;
}

/* ─── Permission State ───────────────────────────────────────── */

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPushPermissionState(): PushPermissionState {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function isPushSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

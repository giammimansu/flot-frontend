import { useEffect, useState } from 'react';
import { messaging, getToken } from '../lib/firebase';
import { registerPushToken } from '../services/users';
import { getSwRegistration } from '../services/pushNotifications';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  // Check initial permission and auto-register if already granted
  useEffect(() => {
    if (!('Notification' in window)) return;
    const current = Notification.permission;
    setPermission(current);
    if (current === 'granted' && messaging) {
      getSwRegistration()
        .then((reg) => {
          return getToken(messaging, {
            vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
            ...(reg ? { serviceWorkerRegistration: reg } : {}),
          });
        })
        .then((token) => {
          if (token) return registerPushToken(token, 'fcm');
        })
        .catch(() => {});
    }
  }, []);

  // Request permission and register token
  const requestPermission = async () => {
    if (!('Notification' in window)) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted' && messaging) {
        const reg = await getSwRegistration();
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
          ...(reg ? { serviceWorkerRegistration: reg } : {}),
        });
        if (token) {
          await registerPushToken(token, 'fcm');
        }
        return true;
      }
    } catch {
      // silent
    }
    return false;
  };

  // Foreground message listener lives in App.tsx <ForegroundNotifications>
  // (mounted once). Registering it here too caused duplicate toasts when
  // the hook was mounted in multiple components (Profile + PushPrompt).

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window && messaging !== null,
  };
}

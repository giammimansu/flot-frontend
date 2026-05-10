import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messaging, getToken, onMessage } from '../lib/firebase';
import { registerPushToken } from '../services/users';
import { useNotificationStore } from '../stores/notificationStore';
import { getSwRegistration } from '../services/pushNotifications';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  const showToast = useNotificationStore((s) => s.showToast);
  const navigate = useNavigate();

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

  // Setup foreground message listener
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'FLOT';
      const body = payload.notification?.body || '';

      showToast({
        title,
        body,
        onClick: () => {
          if (payload.data?.action === 'open_match' && payload.data?.matchId) {
            navigate(`/match/${payload.data.matchId}`);
          }
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [showToast, navigate]);

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window && messaging !== null,
  };
}

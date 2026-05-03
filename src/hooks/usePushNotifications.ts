import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messaging, getToken, onMessage } from '../lib/firebase';
import { registerPushToken } from '../services/users';
import { useNotificationStore } from '../stores/notificationStore';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  const showToast = useNotificationStore((s) => s.showToast);
  const navigate = useNavigate();

  // Check initial permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission and register token
  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted' && messaging) {
        // We use the VAPID key from env for web push
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
        });
        
        if (token) {
          await registerPushToken(token, 'fcm');
        }
        return true;
      }
    } catch (err) {
      console.warn('Push permission error:', err);
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

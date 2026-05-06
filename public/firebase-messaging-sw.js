importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// Config injected at registration time via query string params.
// See src/services/pushNotifications.ts → navigator.serviceWorker.register(url + '?...')
function getConfig() {
  const params = new URLSearchParams(self.location.search);
  return {
    apiKey: params.get('apiKey'),
    projectId: params.get('projectId'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
  };
}

try {
  const config = getConfig();
  if (!config.apiKey) throw new Error('Missing Firebase config in SW query params');

  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'FLOT';
    const body = payload.notification?.body ?? 'You have a new update.';

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data ?? {},
      actions: [{ action: 'open', title: 'View' }],
      tag: payload.data?.matchId ?? 'flot-notification',
      renotify: true,
    });
  });
} catch (e) {
  console.warn('[firebase-messaging-sw] init error:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data ?? {};
  let path = '/#/my-trips';

  if (data.matchId) {
    path = `/#/match/${data.matchId}`;
  } else if (data.tripId) {
    path = `/#/trip/${data.tripId}`;
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if open
        for (const client of windowClients) {
          if ('focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', path });
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) return clients.openWindow(path);
      })
  );
});

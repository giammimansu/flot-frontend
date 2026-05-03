importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// We use hardcoded dummy config here for MVP, or we can use a URL parameter if needed.
// For now, this is enough to let Firebase initialize without throwing immediately.
const firebaseConfig = {
  apiKey: "xxxxxxxxxxxxxxxx",
  projectId: "flot-app",
  messagingSenderId: "xxxxxxxxxxxx",
  appId: "x:xxxxxxxxxxxx:web:xxxxxxxxxxxxxx"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'FLOT';
    const body = payload.notification?.body || 'You have a new message.';
    
    self.registration.showNotification(title, {
      body: body,
      icon: '/logo-glyph.svg',
      badge: '/logo-glyph.svg',
      data: payload.data,
      actions: [{ action: 'open', title: 'View match' }],
    });
  });
} catch (e) {
  console.warn('Firebase SW Init Error:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const matchId = event.notification.data?.matchId;
  if (matchId) {
    event.waitUntil(clients.openWindow(`/match/${matchId}`));
  } else {
    event.waitUntil(clients.openWindow('/my-trips'));
  }
});

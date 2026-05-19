// Retro Garage — Push Notification Service Worker
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'Retro Garage', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title ?? '¡Nuevo Pedido!', {
      body: data.body ?? '',
      icon: '/assets/icon-192.png',
      badge: '/assets/favicon-64.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      tag: data.orderId ?? 'order-' + Date.now(),
      renotify: true,
      data: { url: data.url ?? '/kitchen' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/kitchen';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find(c => new URL(c.url).pathname.startsWith(target));
      return open ? open.focus() : clients.openWindow(target);
    })
  );
});

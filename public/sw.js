// Service worker for web push notifications.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const url = new URL(data.url || '/', self.location.origin);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Like Slack, stay quiet when that conversation is already open and focused.
      // A push must always show a notification, so show a silent one and close it right away.
      const isViewing = windows.some((client) => client.focused && new URL(client.url).pathname === url.pathname);

      await self.registration.showNotification(data.title || 'New message', {
        body: data.body || '',
        icon: data.icon || '/apple-icon.png',
        badge: '/apple-icon.png',
        tag: data.tag,
        renotify: !!data.tag && !isViewing,
        silent: isViewing,
        data: { url: url.href },
      });

      if (isViewing) {
        const notifications = await self.registration.getNotifications({ tag: data.tag });
        notifications.forEach((notification) => notification.close());
      }
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const client = windows.find((client) => new URL(client.url).origin === self.location.origin);

      if (client) {
        await client.focus();
        return client.navigate(url);
      }

      return self.clients.openWindow(url);
    })(),
  );
});

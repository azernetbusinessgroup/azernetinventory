const CACHE_NAME = 'azernet-inventory-v2.0.0';
const STATIC_CACHE = 'azernet-static-v2.0.0';
const DYNAMIC_CACHE = 'azernet-dynamic-v2.0.0';

// Files to cache immediately
const STATIC_FILES = [
  './',
  './index.html',
  './inventory.html',
  './auth.css',
  './auth.js',
  './inventory.css',
  './inventory.js',
  './pwa.js',
  './manifest.json',
  './assets/logo.png',
  './assets/favicon.ico',
  './assets/profile.png',
  './assets/settings.png',
  './assets/edit.png',
  './assets/back.png',
  './assets/close.png',
  './assets/filter.png',
  './assets/next.png',
  './assets/previous.png',
  './assets/on_off.png',
  './assets/placeholder.png',
  './assets/profile_icon.png',
  './assets/CBE.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('Error caching static files:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    // HTML files - cache first, then network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    // CSS and JS files - cache first, then network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname.includes('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico')) {
    // Images and assets - cache first, then network
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.pathname.includes('/api/') || url.pathname.endsWith('.json')) {
    // API calls and data - network first, then cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    // Default - network first, then cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    throw error;
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network first strategy failed:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients that sync is complete
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Background sync completed'
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Azernet Inventory',
      icon: './assets/logo.png',
      badge: './assets/logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View',
          icon: './assets/logo.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: './assets/logo.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Azernet Inventory', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./inventory.html')
    );
  }
});

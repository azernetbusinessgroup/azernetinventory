const CACHE_NAME = 'azernet-inventory-v1.0.0';
const STATIC_CACHE = 'azernet-static-v1.0.0';
const DYNAMIC_CACHE = 'azernet-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/inventory.html',
  '/styles.css',
  '/inventory.css',
  '/script.js',
  '/inventory.js',
  '/assets/logo.png',
  '/assets/favicon.ico',
  '/assets/profile.png',
  '/assets/settings.png',
  '/assets/edit.png',
  '/assets/back.png',
  '/assets/close.png',
  '/assets/filter.png',
  '/assets/next.png',
  '/assets/previous.png',
  '/assets/on_off.png',
  '/assets/placeholder.png',
  '/assets/profile_icon.png',
  '/assets/CBE.png'
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

// Cache First Strategy
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
    return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
  }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
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
    // Handle any pending offline actions
    console.log('Performing background sync...');
    // You can implement specific sync logic here
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
      icon: '/assets/logo.png',
      badge: '/assets/logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View',
          icon: '/assets/logo.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/assets/close.png'
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
      clients.openWindow('/inventory.html')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

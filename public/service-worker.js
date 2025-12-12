// Creative Curriculum Designer - Service Worker
// Offline-first PWA with smart caching

const CACHE_NAME = 'ccd-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Critical assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/cd-logo.svg',
  '/favicon.ico'
];

// Routes that should work offline (use cached data)
const OFFLINE_ROUTES = [
  '/activity-library',
  '/lesson-builder',
  '/lesson-library',
  '/unit-viewer'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching critical assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      console.log('[Service Worker] Installed successfully');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated successfully');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Netlify functions - let them handle directly
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return;
  }

  // Skip hard refresh requests (bypass cache) - let browser handle them directly
  // Hard refresh sends cache: 'reload' or cache: 'no-store', or specific headers
  if (
    request.cache === 'reload' || 
    request.cache === 'no-store' ||
    request.headers.get('cache-control') === 'no-cache' ||
    request.headers.get('pragma') === 'no-cache'
  ) {
    return; // Don't intercept, let browser handle directly
  }
  
  // Skip ALL navigation requests on HTTPS to prevent SSL protocol errors
  // This is the safest approach - let browser handle all navigation
  if (request.mode === 'navigate') {
    return; // Don't intercept navigation requests - prevents SSL errors
  }

  // Skip Supabase API calls (always try network)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => {
        // If offline, return a JSON error
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'No internet connection' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Skip other external APIs
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle navigation requests (pages) - but only if safe
  if (request.mode === 'navigate') {
    // For HTTPS navigation, be more conservative to avoid SSL errors
    if (url.protocol === 'https:') {
      // Only cache if we have a successful response and it's not an error
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Only cache successful responses (200-299)
            if (response.status >= 200 && response.status < 300) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            // If network fails, try cache
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fall back to offline page
              return caches.match(OFFLINE_URL);
            });
          })
      );
    } else {
      // For HTTP, use the original logic
      event.respondWith(
        fetch(request)
          .then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
          .catch(() => {
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match(OFFLINE_URL);
            });
          })
      );
    }
    return;
  }

  // Handle static assets (JS, CSS, images, fonts)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      // Cache-first strategy for static assets
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If offline, try cache
        return caches.match(request);
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // This would sync any offline changes back to Supabase
  // when connection is restored
  console.log('[Service Worker] Syncing offline data...');
  // Implementation depends on your data model
}

console.log('[Service Worker] Script loaded');


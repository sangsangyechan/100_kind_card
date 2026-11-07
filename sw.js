const VERSION = 'positive-cards-100-upload-v2';
const CORE = ['./','./index.html','./style.css','./app.js','./cards.json','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', event => {event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate', event => {event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('positive-cards-') && k !== VERSION).map(k => caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if(event.request.destination === 'image') {
    event.respondWith(caches.open(VERSION).then(async cache => {const hit = await cache.match(event.request);if(hit) return hit;const response = await fetch(event.request);if(response.ok) {await cache.put(event.request,response.clone());const keys=await cache.keys();const images=keys.filter(k => /\/images\//.test(k.url));if(images.length>30) await cache.delete(images[0]);}return response;}));
  } else event.respondWith(fetch(event.request).then(response => {if(response.ok){const copy=response.clone();event.waitUntil(caches.open(VERSION).then(cache => cache.put(event.request,copy)));}return response;}).catch(() => caches.match(event.request).then(hit => hit || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});

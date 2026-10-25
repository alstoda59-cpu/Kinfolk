// Recovery131: versioned offline shell; never cache authenticated API responses.
const CACHE='kinfolk-shell-recovery131';
const OFFLINE='/offline.html';
const SHELL=[OFFLINE,'/manifest.webmanifest','/kinfolk-icon.svg','/favicon.ico','/kinfolk-icon-192.png','/kinfolk-icon-512.png','/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('kinfolk-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>await caches.match(OFFLINE)||new Response('Kinfolk is offline',{status:503,headers:{'Content-Type':'text/plain'}})));
 }
 // All authenticated requests and dynamic content stay network-only.
});

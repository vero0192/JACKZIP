const BASE=new URL("./",self.registration.scope).pathname;
const PREFIX=`jackzip:${BASE}:`;
const CACHE=PREFIX+"5.1.0-8c23859da380";
const SHELL=[
  "./","./index.html","./jackzip.css","./app.js","./parser.js","./census.js","./location.js","./commands.js","./export.js","./motion.js",
  "./request.js","./release.css","./geo-map.js","./manifest.webmanifest","./BUILD_INFO.json","./icon-192.png","./icon-512.png","./apple-touch-icon.png",
  "./assets/brand/jz-star.svg","./assets/brand/jz-star-vip.svg","./assets/brand/jz-star-mono.svg","./assets/brand/jackzip-wordmark.svg","./assets/brand/jz-grid.svg","./assets/brand/design-tokens.json",
  "./assets/jax/jax-current.png","./assets/jax/jax-master.svg","./assets/jax/jax-avatar.svg",
  "./assets/fonts/space-grotesk-latin-400-normal.woff2","./assets/fonts/space-grotesk-latin-600-normal.woff2","./assets/fonts/space-grotesk-latin-700-normal.woff2","./assets/fonts/ibm-plex-mono-latin-400-normal.woff2","./assets/fonts/ibm-plex-mono-latin-600-normal.woff2"
];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
async function cleanupCaches(){
  for(const key of await caches.keys()){
    if(key===CACHE)continue;
    if(key.startsWith(PREFIX)){await caches.delete(key);continue}
    // Migrate legacy caches only when all their requests belong to this app's scope.
    if(key.startsWith("jackzip-")){
      const requests=await (await caches.open(key)).keys();
      if(requests.length&&requests.every(r=>{const u=new URL(r.url);return u.origin===self.location.origin&&u.pathname.startsWith(BASE)}))await caches.delete(key);
    }
  }
}
self.addEventListener("activate",event=>{event.waitUntil(cleanupCaches().then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==="navigate"){
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match("./index.html"))||fetch(event.request)));
    return;
  }
  const shellUrls=new Set(SHELL.map(path=>new URL(path,self.registration.scope).href));
  if(!shellUrls.has(url.href))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request);if(cached)return cached;
    const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
  }));
});

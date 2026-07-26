// Service worker mínimo: solo habilita la instalación como PWA y acelera la
// carga de assets estáticos (JS/CSS/fuentes/íconos con hash inmutable).
//
// A propósito NO cachea páginas HTML ni respuestas de Server Actions: este es
// un CRM con datos por sesión/negocio, así que cachear esas respuestas podría
// mostrar datos viejos o, peor, de otro usuario en un dispositivo compartido.

const CACHE = "gf-static-v1";
const STATIC_PATTERNS = [/\/_next\/static\//, /\/icons\//, /\.(?:png|jpg|jpeg|svg|webp|woff2?)$/];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic = STATIC_PATTERNS.some((re) => re.test(url.pathname));
  if (!isStatic) return; // todo lo demás: siempre a la red, sin cachear

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});

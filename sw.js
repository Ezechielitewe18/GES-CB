/* GES-CB · Service worker — rend l'app disponible hors-ligne.
   Incrementez VERSION ci-dessous apres chaque modification des fichiers. */
const VERSION = "ges-cb-v7";

const FICHIERS = [
  "index.html",
  "accueil.html",
  "moniteurs.html",
  "aides.html",
  "gestion.html",
  "enfants.html",
  "enregistrer-enfants.html",
  "visiteurs.html",
  "statistiques.html",
  "sauvegarde.html",
  "guide.html",
  "css/fonts.css",
  "css/style.css",
  "css/components.css",
  "css/responsive.css",
  "css/print.css",
  "css/guide.css",
  "js/db.js",
  "js/auth.js",
  "js/icons.js",
  "js/ui.js",
  "js/charts.js",
  "js/guide.js",
  "js/moniteurs.js",
  "js/gestion.js",
  "js/enfants.js",
  "js/enregistrer-enfants.js",
  "js/visiteurs.js",
  "js/statistiques.js",
  "js/sauvegarde.js",
  "js/sqlite_export.js",
  "js/sqlite_import.js",
  "favicon.svg",
  "manifest.webmanifest",
  "apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return cache.addAll(FICHIERS.map(function (f) {
        return new Request(f, { cache: "reload" });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (cles) {
      return Promise.all(cles
        .filter(function (c) { return c !== VERSION; })
        .map(function (c) { return caches.delete(c); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Stratégie : réseau d'abord (toujours à jour quand en ligne),
   cache en secours quand hors-ligne. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request).then(function (reponse) {
      if (reponse.ok && e.request.url.indexOf(self.location.origin) === 0) {
        const copie = reponse.clone();
        caches.open(VERSION).then(function (cache) {
          cache.put(e.request, copie);
        });
      }
      return reponse;
    }).catch(function () {
      return caches.match(e.request).then(function (trouve) {
        if (trouve) return trouve;
        if (e.request.mode === "navigate") {
          return caches.match("index.html");
        }
        return new Response("", { status: 503, statusText: "Hors-ligne" });
      });
    })
  );
});

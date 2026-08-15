/* =====================================================
   GES-CB — Icônes SVG sur mesure
   Tracés enrichis, dégradé or disponible via ICONES.OR().
   Usage : ICONES("home", 24)          → trait currentColor
           ICONES.OR("home", 24)       → trait en dégradé or
   ===================================================== */

const ICONES = (function () {
  const chemins = {
    /* Navigation */
    home: '<path d="M9 2.8V5.4"/><path d="M3 11.5 12 4l9 7.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-6h4v6"/>',
    users: '<path d="M15.5 10.5a3 3 0 1 0-2.9-4"/><path d="M21 19v-1a4 4 0 0 0-4-4"/><circle cx="8" cy="8" r="4"/><path d="M3 19v-1a5 5 0 0 1 5-5h2"/>',
    helpers: '<circle cx="8" cy="7" r="3.5"/><path d="M2.5 19v-1a5.5 5.5 0 0 1 5.5-5.5h0A5.5 5.5 0 0 1 13.5 18v1"/><path d="M17.5 3.5l.7 1.5 1.6.2-1.2 1 .3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1 1.6-.2z"/>',
    child: '<circle cx="12" cy="5" r="3"/><path d="M9.5 8.5 12 10l2.5-1.5"/><path d="M12 10v4.5"/><path d="M9 20.5l1.5-4.5h3L15 20.5"/><path d="M18.5 5l.6 1.3 1.4.2-1 .9.3 1.4-1.3-.8-1.3.8.3-1.4-1-.9 1.4-.2z"/>',
    door: '<path d="M9 21V3l8 2v16"/><path d="M17 21H7"/><circle cx="12" cy="12" r="0.9"/>',
    chart: '<path d="M3 3v17a1 1 0 0 0 1 1h17"/><path d="M7.5 15.5v-5"/><path d="M12.5 15.5V7"/><path d="M17.5 15.5V10"/><path d="M17.5 3.5l3 3-3 3"/><path d="M14 6.5h6.5"/>',

    /* Actions */
    sortie: '<path d="M13.5 7.5 17 11l-3.5 3.5"/><path d="M4 11h13"/><path d="M17 3v16"/>',
    retour: '<path d="M10.5 7.5 7 11l3.5 3.5"/><path d="M20 11H7"/><path d="M7 3v16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    book: '<path d="M2 3.5h6.5A3.5 3.5 0 0 1 12 7v13.5A2.5 2.5 0 0 0 9.5 18H2z"/><path d="M22 3.5h-6.5A3.5 3.5 0 0 0 12 7v13.5A2.5 2.5 0 0 1 14.5 18H22z"/>',
    alert: '<path d="M12 3.5 2.5 19.5a1 1 0 0 0 .9 1.5h17.2a1 1 0 0 0 .9-1.5z"/><path d="M12 10v4.5"/><path d="M12 17.8h.01"/>',
    download: '<path d="M12 3.5V14"/><path d="m7 10 5 5 5-5"/><path d="M4.5 20h15"/>',
    upload: '<path d="M12 20.5V10"/><path d="m7 14 5-5 5 5"/><path d="M4.5 4h15"/>',
    jouer: '<path d="M6 4l14 8-14 8z"/>',
    pause: '<path d="M7 4h4v16H7z"/><path d="M13 4h4v16h-4z"/>',
    usersPlus: '<circle cx="8" cy="9" r="4"/><path d="M2.5 20v-1a5.5 5.5 0 0 1 5.5-5.5h0A5.5 5.5 0 0 1 13.5 19v1"/><path d="M19 7v7"/><path d="M15.5 10.5h7"/>',
    trash: '<path d="M3.5 6h17"/><path d="M8.5 6V4h7v2"/><path d="M18.5 6l-1 14.5a1 1 0 0 1-1 .9H7.5a1 1 0 0 1-1-.9L5.5 6"/><path d="M10 10.5v6"/><path d="M14 10.5v6"/>',
  };

  const GRADIENT = {
    id: "ig-gold",
    defs:
      '<linearGradient id="ig-gold" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#F3DE8B"/>' +
      '<stop offset="55%" stop-color="#D4AF37"/>' +
      '<stop offset="100%" stop-color="#B8962E"/>' +
      "</linearGradient>",
  };

  function svg(nom, taille, stroke) {
    taille = taille || 20;
    const d = chemins[nom];
    if (!d) return "";
    return (
      '<svg class="icone" width="' + taille + '" height="' + taille +
      '" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + d + "</svg>"
    );
  }

  /* Icône au trait uni, coloré via `currentColor` */
  function normale(nom, taille) {
    return svg(nom, taille, "currentColor");
  }

  /* Icône au trait en dégradé or (définition partagée par toutes les icônes) */
  function or(nom, taille) {
    taille = taille || 20;
    const d = chemins[nom];
    if (!d) return "";
    return (
      '<svg class="icone" width="' + taille + '" height="' + taille +
      '" viewBox="0 0 24 24" fill="none" stroke="url(#' + GRADIENT.id + ')" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true"><defs>' + GRADIENT.defs + "</defs>" + d + "</svg>"
    );
  }

  normale.OR = or;
  return normale;
})();

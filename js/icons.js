/* =====================================================
   GES-CB — Icônes SVG sur mesure
   Stroke uniforme, coloré via `currentColor`.
   Usage : ICONE("home") ou ICONE("home", 24)
   ===================================================== */

const ICONES = (function () {
  const chemins = {
    /* Navigation */
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M10 21v-6h4v6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    helpers: '<path d="M17 8a4 4 0 1 0-2-3.46"/><path d="M20 21v-1a3 3 0 0 0-3-3h-3"/><circle cx="7" cy="12" r="3"/><path d="M4 21v-1a3 3 0 0 1 3-3h0"/>',
    child: '<circle cx="12" cy="6" r="3"/><path d="M9 9.5 12 11l3-1.5"/><path d="M12 11v5"/><path d="M9 21l1.5-5h3L15 21"/>',
    door: '<path d="M9 21V3l8 2v16"/><path d="M17 21H7"/><path d="M12 12h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 16v-5"/><path d="M13 16V8"/><path d="M18 16v-3"/>',

    /* Actions */
    sortie: '<path d="M14 8l4 4-4 4"/><path d="M4 12h14"/><path d="M18 4v16"/>',
    retour: '<path d="M10 8l-4 4 4 4"/><path d="M20 12H6"/><path d="M6 4v16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    print: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    alert: '<path d="M12 3 1.5 21h21z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
  };

  function svg(nom, taille) {
    taille = taille || 20;
    const d = chemins[nom];
    if (!d) return "";
    return (
      '<svg class="icone" width="' + taille + '" height="' + taille +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + d + "</svg>"
    );
  }

  return svg;
})();

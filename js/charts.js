/* =====================================================
   GES-CB - Graphiques SVG en pur JavaScript (hors-ligne)
   Barres verticales, barres horizontales, anneau.
   Aucune bibliothèque externe.
   ===================================================== */

const GES_CHARTS = (function () {
  const PALETTE = [
    "#E9D078", "#2ECC71", "#E74C3C", "#5B8DEF",
    "#C792EA", "#E67E22", "#1ABC9C", "#F1C40F",
  ];

  function echapper(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function vide(message) {
    return '<p style="color:#888; font-size:14px; padding:18px 0;">' +
      (message || "Aucune donnée.") + "</p>";
  }

  function couleur(i) {
    return PALETTE[i % PALETTE.length];
  }

  function maxValeur(items) {
    return Math.max.apply(
      Math,
      items.map(function (i) { return i.valeur; }).concat([1])
    );
  }

  /* ----- Barres verticales (évolution par jour) ----- */
  function barres(items, opts) {
    opts = opts || {};
    if (!items || items.length === 0) return vide();
    const W = 640, H = 250, padG = 36, padB = 34, padH = 16;
    const max = maxValeur(items);
    const innerW = W - padG - 10;
    const innerH = H - padB - padH;
    const n = items.length;
    const slot = innerW / n;
    const bw = Math.min(slot * 0.6, 48);
    const coul = opts.couleur || "#E9D078";

    let s =
      '<svg viewBox="0 0 ' + W + " " + H +
      '" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">';

    for (let g = 0; g <= 4; g++) {
      const y = padH + innerH - (innerH * g) / 4;
      const val = Math.round((max * g) / 4);
      s += '<line x1="' + padG + '" y1="' + y + '" x2="' + (W - 10) +
        '" y2="' + y + '" stroke="#223652" stroke-width="1"/>';
      s += '<text x="' + (padG - 8) + '" y="' + (y + 4) +
        '" text-anchor="end" font-size="11" fill="#A6B4CE">' + val + "</text>";
    }

    items.forEach(function (it, i) {
      const x = padG + slot * i + (slot - bw) / 2;
      const h = Math.max(2, (innerH * it.valeur) / max);
      const y = padH + innerH - h;
      s += '<rect x="' + x + '" y="' + y + '" width="' + bw +
        '" height="' + h + '" rx="5" fill="' + coul + '"/>';
      s += '<text x="' + (x + bw / 2) + '" y="' + (y - 7) +
        '" text-anchor="middle" font-size="12" font-weight="700" fill="#E9D078">' +
        it.valeur + "</text>";
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - 10) +
        '" text-anchor="middle" font-size="11" fill="#A6B4CE">' +
        echapper(it.label) + "</text>";
    });

    s += "</svg>";
    return s;
  }

  /* ----- Barres horizontales (répartition par commission) ----- */
  function barresH(items, opts) {
    opts = opts || {};
    if (!items || items.length === 0) return vide();
    const rowH = 26, W = 640;
    const H = 44 + items.length * rowH;
    const max = maxValeur(items);
    const longLabel = items.reduce(function (mx, it) {
      return Math.max(mx, String(it.label || "").length);
    }, 0);
    const padL = Math.min(280, Math.max(150, longLabel * 7 + 18));
    const padR = 46, padT = 20;
    const barW = W - padL - padR;

    let s =
      '<svg viewBox="0 0 ' + W + " " + H +
      '" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">';
    s += '<line x1="' + padL + '" y1="0" x2="' + padL + '" y2="' + H +
      '" stroke="#223652" stroke-width="1"/>';

    items.forEach(function (it, i) {
      const y = padT + i * rowH;
      const w = Math.max(2, (barW * it.valeur) / max);
      s += '<text x="' + (padL - 10) + '" y="' + (y + 14) +
        '" text-anchor="end" font-size="12" fill="#D6DFF0">' +
        echapper(it.label) + "</text>";
      s += '<rect x="' + padL + '" y="' + (y + 2) + '" width="' + w +
        '" height="16" rx="4" fill="' + (opts.couleur || couleur(i)) + '"/>';
      s += '<text x="' + (padL + w + 7) + '" y="' + (y + 14) +
        '" font-size="12" font-weight="700" fill="#E9D078">' +
        it.valeur + "</text>";
    });

    s += "</svg>";
    return s;
  }

  /* ----- Anneau (répartition par catégorie) ----- */
  function anneau(items, opts) {
    opts = opts || {};
    if (!items || items.length === 0) return vide();
    const total = items.reduce(function (som, i) {
      return som + (i.valeur || 0);
    }, 0);
    if (!total) return vide();

    const centre = 110, r = 70, ep = 34;
    const C = 2 * Math.PI * r;

    let s =
      '<svg viewBox="0 0 220 220" style="width:190px;height:190px;flex:0 0 190px"' +
      ' xmlns="http://www.w3.org/2000/svg">';
    s += '<circle cx="' + centre + '" cy="' + centre + '" r="' + r +
      '" fill="none" stroke="#223652" stroke-width="' + ep + '"/>';

    let off = 0;
    items.forEach(function (it, i) {
      const frac = it.valeur / total;
      const dash = Math.max(1, C * frac - 2);
      const col = opts.couleurs && opts.couleurs[i] ? opts.couleurs[i] : couleur(i);
      s += '<circle cx="' + centre + '" cy="' + centre + '" r="' + r +
        '" fill="none" stroke="' + col + '" stroke-width="' + ep +
        '" stroke-dasharray="' + dash + " " + (C - dash) +
        '" stroke-dashoffset="' + -off +
        '" transform="rotate(-90 ' + centre + " " + centre + ')"/>';
      off += C * frac;
    });

    s += '<text x="' + centre + '" y="' + (centre + 5) +
      '" text-anchor="middle" font-size="26" font-weight="800" fill="#FFFFFF">' +
      total + "</text>";
    s += '<text x="' + centre + '" y="' + (centre + 25) +
      '" text-anchor="middle" font-size="11" fill="#A6B4CE">sorties</text>';
    s += "</svg>";

    let leg = '<div class="legende">';
    items.forEach(function (it, i) {
      const col = opts.couleurs && opts.couleurs[i] ? opts.couleurs[i] : couleur(i);
      leg += '<div class="legende-item">' +
        '<span class="pastille" style="background:' + col + '"></span>' +
        "<span>" + echapper(it.label) + "</span>" +
        "<strong>" + it.valeur + "</strong></div>";
    });
    leg += "</div>";

    return '<div class="anneau-flex">' + s + leg + "</div>";
  }

  return {
    barres,
    barresH,
    anneau,
    vide,
    PALETTE,
  };
})();

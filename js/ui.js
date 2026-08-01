/* =====================================================
   GES-CB - Utilitaires d'interface (navbar, horloge,
   toast, bip sonore, flash ecran, modale historique)
   ===================================================== */

const UI = (function () {
  const PAGES = [
    { href: "accueil.html", label: "Accueil", role: "TOUS" },
    { href: "moniteurs.html", label: "Moniteurs", role: "ADMIN" },
    { href: "enfants.html", label: "Enfants", role: "ADMIN" },
    { href: "visiteurs.html", label: "Visiteurs", role: "ADMIN" },
    { href: "statistiques.html", label: "Statistiques", role: "SUPER_ADMIN" },
  ];

  /* ----- Barre superieure + navigation ----- */
  function installerNavbar(actif) {
    const role = DB.roleActuel();
    const topbar = document.createElement("header");
    topbar.className = "topbar";

    const titre = document.createElement("div");
    titre.className = "titre";
    titre.innerHTML = "GES<span>-CB</span> · Camp Biblique";
    topbar.appendChild(titre);

    const horloge = document.createElement("div");
    horloge.className = "horloge";
    horloge.id = "horloge";
    topbar.appendChild(horloge);

    const user = document.createElement("div");
    user.className = "utilisateur";
    const roleLabel = AUTH.ROLES[role] ? AUTH.ROLES[role].label : "";
    user.innerHTML =
      "<strong>" + DB.nomActuel() + "</strong> · " + roleLabel +
      ' <button class="btn-deconnexion" onclick="AUTH.seDeconnecter()">Déconnexion</button>';
    topbar.appendChild(user);

    document.body.insertBefore(topbar, document.body.firstChild);

    // Navigation selon le role
    const nav = document.createElement("nav");
    nav.className = "menu";
    PAGES.forEach(function (p) {
      if (p.role !== "TOUS" && p.role !== role) return;
      const a = document.createElement("a");
      a.href = p.href;
      a.textContent = p.label;
      if (p.href === actif) a.className = "active";
      nav.appendChild(a);
    });
    document.body.insertBefore(nav, document.body.firstChild);

    // Horloge en direct
    if (horloge) {
      function majHorloge() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        horloge.textContent =
          pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
      }
      majHorloge();
      setInterval(majHorloge, 1000);
    }
  }

  /* ----- Toast ----- */
  function toast(message, type) {
    let zone = document.getElementById("zone-toast");
    if (!zone) {
      zone = document.createElement("div");
      zone.id = "zone-toast";
      document.body.appendChild(zone);
    }
    const t = document.createElement("div");
    t.className = "toast" + (type ? " " + type : "");
    t.textContent = message;
    zone.appendChild(t);
    setTimeout(function () {
      t.style.opacity = "0";
      t.style.transition = "opacity 0.4s";
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 400);
    }, 3500);
  }

  /* ----- Bip sonore (idee 4) ----- */
  function bip(ok) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const t = ctx.currentTime;
      osc.frequency.value = ok ? 880 : 440;
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {
      /* navigateur sans AudioContext : silencieux */
    }
  }

  function bipDouble(ok) {
    bip(ok);
    setTimeout(function () {
      bip(ok);
    }, 250);
  }

  /* ----- Flash ecran vert/rouge (idee 4) ----- */
  function flash(type) {
    document.body.classList.remove("flash-sortie", "flash-retour");
    void document.body.offsetWidth; // relance l'animation
    document.body.classList.add(type === "SORTIE" ? "flash-sortie" : "flash-retour");
    setTimeout(function () {
      document.body.classList.remove("flash-sortie", "flash-retour");
    }, 650);
  }

  /* ----- Confirmation d'action (valide a la porte) ----- */
  function confirmerAction() {
    const val = document.createElement("input");
    val.type = "checkbox";
    val.id = "confirm-porte";
    return true;
  }

  /* ----- Modale historique d'une personne (idee 3) ----- */
  function ouvrirHistorique(typeProfil, personneId, nomPersonne) {
    const mouvements = DB.mouvementsPersonne(typeProfil, personneId);
    const fond = document.createElement("div");
    fond.className = "modale-fond visible";

    let lignes = "";
    if (mouvements.length === 0) {
      lignes = '<p style="color:#888">Aucun mouvement enregistré pour aujourd\'hui.</p>';
    } else {
      lignes =
        '<table class="tableau"><thead><tr>' +
        "<th>Heure</th><th>Action</th><th>Motif</th><th>Agent</th>" +
        "</tr></thead><tbody>";
      mouvements.slice().reverse().forEach(function (m) {
        const badge =
          m.type_action === "SORTIE"
            ? '<span class="badge badge-rouge">SORTIE</span>'
            : '<span class="badge badge-vert">RETOUR</span>';
        lignes +=
          "<tr><td>" + m.heure_mouvement + "</td><td>" + badge + "</td><td>" +
          (m.motif || "-") + "</td><td>" + (m.agent_accueil || "-") + "</td></tr>";
      });
      lignes += "</tbody></table>";
    }

    fond.innerHTML =
      '<div class="modale">' +
      '<button class="fermer" onclick="this.closest(\'.modale-fond\').remove()">✕</button>' +
      "<h3>Historique · " + nomPersonne + "</h3>" +
      lignes +
      "</div>";

    document.body.appendChild(fond);
    fond.addEventListener("click", function (e) {
      if (e.target === fond) fond.remove();
    });
  }

  return {
    installerNavbar,
    toast,
    bip,
    bipDouble,
    flash,
    ouvrirHistorique,
  };
})();

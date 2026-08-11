/* =====================================================
   GES-CB - Utilitaires d'interface (navbar, horloge,
   toast, bip sonore, flash ecran, modale historique)
   ===================================================== */

const UI = (function () {
  const PAGES = [
    { href: "accueil.html", label: "Accueil", icone: "home", role: "TOUS" },
    { href: "moniteurs.html", label: "Moniteurs", icone: "users", role: "ADMIN" },
    { href: "aides.html", label: "Aides", icone: "helpers", role: "ADMIN" },
    { href: "enfants.html", label: "Enfants", icone: "child", role: "ADMIN" },
    { href: "visiteurs.html", label: "Visiteurs", icone: "door", role: "ADMIN" },
    { href: "statistiques.html", label: "Statistiques", icone: "chart", role: "ADMIN" },
    { href: "sauvegarde.html", label: "Sauvegarde", icone: "download", role: "ADMIN" },
    { href: "guide.html", label: "Guide", icone: "book", role: "TOUS" },
  ];

  /* ----- Menu lateral (sidebar) + navigation ----- */
  function installerNavbar(actif) {
    const role = DB.roleActuel();
    const roleLabel = AUTH.ROLES[role] ? AUTH.ROLES[role].label : "";

    // Bouton burger (visible sur mobile)
    const burger = document.createElement("button");
    burger.className = "burger";
    burger.setAttribute("aria-label", "Ouvrir le menu");
    burger.innerHTML =
      '<svg class="icone" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>';
    burger.addEventListener("click", function () {
      document.body.classList.toggle("menu-ouvert");
    });
    document.body.appendChild(burger);

    // Sidebar
    const side = document.createElement("aside");
    side.className = "sidebar";

    const logo = document.createElement("div");
    logo.className = "sidebar-logo";
    logo.innerHTML = "GES<span>-CB</span><small>Camp Biblique</small>";
    side.appendChild(logo);

    // Navigation selon le role
    const nav = document.createElement("nav");
    nav.className = "menu";
    PAGES.forEach(function (p, i) {
      if (p.role !== "TOUS" && p.role !== role) return;
      const a = document.createElement("a");
      a.href = p.href;
      a.innerHTML = ICONES(p.icone, 18) + ' <span class="menu-label">' + p.label + "</span>";
      if (p.href === actif) a.className = "active";
      a.style.animationDelay = (0.5 + i * 0.08) + "s";
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-ouvert");
      });
      nav.appendChild(a);
    });
    side.appendChild(nav);

    // Pied de sidebar : horloge + utilisateur
    const pied = document.createElement("div");
    pied.className = "sidebar-pied";

    const horloge = document.createElement("div");
    horloge.className = "horloge";
    horloge.id = "horloge";
    pied.appendChild(horloge);

    const user = document.createElement("div");
    user.className = "utilisateur";
    user.innerHTML =
      "<strong>" + DB.nomActuel() + "</strong><span>" + roleLabel +
      '</span><button class="btn-deconnexion" onclick="AUTH.seDeconnecter()">Déconnexion</button>';
    pied.appendChild(user);

    side.appendChild(pied);
    document.body.insertBefore(side, document.body.firstChild);

    // Fermer la sidebar en cliquant sur le fond (mobile)
    const fond = document.createElement("div");
    fond.className = "sidebar-fond";
    fond.addEventListener("click", function () {
      document.body.classList.remove("menu-ouvert");
    });
    document.body.appendChild(fond);

    // Horloge en direct
    function majHorloge() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      horloge.textContent =
        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }
    majHorloge();
    setInterval(majHorloge, 1000);
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

  /* ----- Flash ecran vert/rouge (idee 4) ----- */
  function flash(type) {
    document.body.classList.remove("flash-sortie", "flash-retour");
    void document.body.offsetWidth; // relance l'animation
    document.body.classList.add(type === "SORTIE" ? "flash-sortie" : "flash-retour");
    setTimeout(function () {
      document.body.classList.remove("flash-sortie", "flash-retour");
    }, 650);
  }

  /* ----- Modale historique d'une personne (idee 3) ----- */
  function ouvrirHistorique(typeProfil, personneId, nomPersonne, details) {
    const fond = document.createElement("div");
    fond.className = "modale-fond visible";

    let enAttente = null;

    function rendu() {
      const mouvements = DB.mouvementsPersonne(typeProfil, personneId);

      let entete = "";
      if (details && details.length) {
        entete = '<p class="details-personne">';
        details.forEach(function (d) {
          entete +=
            '<span><strong>' + d.label + " :</strong> " + d.value + "</span> ";
        });
        entete += "</p>";
      }

      let lignes = "";
      if (mouvements.length === 0) {
        lignes = '<p style="color:#888">Aucun mouvement enregistré.</p>';
      } else {
        lignes =
          '<table class="tableau"><thead><tr>' +
          "<th>Heure</th><th>Action</th><th>Motif</th><th>Agent</th><th></th>" +
          "</tr></thead><tbody>";
        mouvements.slice().reverse().forEach(function (m) {
          const badge =
            m.type_action === "SORTIE"
              ? '<span class="badge badge-rouge">SORTIE</span>'
              : '<span class="badge badge-vert">RETOUR</span>';
          const actif = enAttente === m.id;
          lignes +=
            "<tr><td>" + m.heure_mouvement + "</td><td>" + badge + "</td><td>" +
            (m.motif || "-") + "</td><td>" + (m.agent_accueil || "-") + "</td>" +
            '<td><button class="btn btn-danger btn-petit" data-annuler="' +
            m.id + '">' + (actif ? "Confirmer ?" : "Annuler") + "</button></td></tr>";
        });
        lignes += "</tbody></table>";
      }

      fond.innerHTML =
        '<div class="modale">' +
        '<button class="fermer" onclick="this.closest(\'.modale-fond\').remove()">✕</button>' +
        "<h3>Historique · " + nomPersonne + "</h3>" +
        entete +
        lignes +
        "</div>";

      fond.querySelectorAll("[data-annuler]").forEach(function (b) {
        b.addEventListener("click", function () {
          const id = Number(b.getAttribute("data-annuler"));
          if (enAttente !== id) {
            enAttente = id;
            rendu();
            return;
          }
          enAttente = null;
          const m = DB.annulerMouvement(id);
          if (m) {
            toast(
              "Saisie annulée · " + (m.nom_personne || "") + " (" +
              (m.type_action === "SORTIE" ? "sortie" : "retour") + ")",
              "ok"
            );
          }
          rendu();
        });
      });
    }

    document.body.appendChild(fond);
    rendu();

    fond.addEventListener("click", function (e) {
      if (e.target === fond) fond.remove();
    });
  }

  return {
    installerNavbar,
    toast,
    bip,
    flash,
    ouvrirHistorique,
  };
})();

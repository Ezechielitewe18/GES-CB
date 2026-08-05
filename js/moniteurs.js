/* =====================================================
   GES-CB - Page Moniteurs & Aides-Moniteurs
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();

  const PAGE = window.PAGE_MONITEURS || { actif: "moniteurs.html", filtreRole: null, titre: "Moniteurs" };
  UI.installerNavbar(PAGE.actif);

  const grilleSortie = document.getElementById("grille-sortie");
  const grilleRetour = document.getElementById("grille-retour");
  const motifSortie = document.getElementById("motif-sortie");
  const btnSortie = document.getElementById("btn-sortie");
  const btnRetour = document.getElementById("btn-retour");
  const recapSortie = document.getElementById("recap-sortie");
  const recapRetour = document.getElementById("recap-retour");
  const zoneAlertes = document.getElementById("zone-alertes");

  let selectionSortie = null;
  let selectionRetour = null;

  function cartePersonne(m, pourSortie) {
    const div = document.createElement("div");
    div.className = "carte-personne" + (m.statut === "DEHORS" ? " dehors" : "");
    div.innerHTML =
      '<span class="initiale">' + m.initials + "</span>" +
      '<span class="nom">' + m.nom_prenom + "</span>" +
      '<span class="role">' + (m.commission || m.role) + "</span>";

    div.addEventListener("click", function () {
      if (pourSortie) {
        selectionSortie = m;
        grilleSortie.querySelectorAll(".carte-personne").forEach(function (c) {
          c.classList.remove("selectionnee");
        });
        div.classList.add("selectionnee");
        majBoutonSortie();
      } else {
        selectionRetour = m;
        grilleRetour.querySelectorAll(".carte-personne").forEach(function (c) {
          c.classList.remove("selectionnee");
        });
        div.classList.add("selectionnee");
        majBoutonRetour();
      }
    });

    // Bouton historique + coordonnées (idee 3) sur double-clic sur le nom
    const nomEl = div.querySelector(".nom");
    nomEl.title = "Double-cliquer pour voir les coordonnées et l'historique";
    nomEl.addEventListener("dblclick", function () {
      UI.ouvrirHistorique("MONITEUR", m.id, m.nom_prenom + " (" + m.initials + ")", [
        { label: "Sexe", value: m.sexe === "M" ? "Masculin" : "Féminin" },
        { label: "Téléphone", value: m.telephone || "—" },
        { label: "Commission", value: m.commission || "—" },
      ]);
    });

    return div;
  }

  function majBoutonSortie() {
    btnSortie.disabled = !(selectionSortie && motifSortie.value);
    if (selectionSortie) {
      recapSortie.classList.add("visible");
      recapSortie.innerHTML =
        '<div class="ligne"><span class="label">Moniteur</span><span>' +
        selectionSortie.nom_prenom + " (" + selectionSortie.initials + ")</span></div>" +
        '<div class="ligne"><span class="label">Motif</span><span>' +
        (motifSortie.value || "—") + "</span></div>" +
        '<div class="ligne"><span class="label">Heure</span><span>' +
        new Date().toLocaleTimeString("fr-FR") + "</span></div>";
    }
  }

  function majBoutonRetour() {
    btnRetour.disabled = !selectionRetour;
    if (selectionRetour) {
      recapRetour.classList.add("visible");
      recapRetour.innerHTML =
        '<div class="ligne"><span class="label">Moniteur</span><span>' +
        selectionRetour.nom_prenom + " (" + selectionRetour.initials + ")</span></div>" +
        '<div class="ligne"><span class="label">Heure retour</span><span>' +
        new Date().toLocaleTimeString("fr-FR") + "</span></div>";
    }
  }

  btnSortie.addEventListener("click", function () {
    if (!selectionSortie || !motifSortie.value) return;
    const m = selectionSortie;
    DB.mettreAJourMoniteur(m.id, { statut: "DEHORS" });
    DB.ajouterMouvement({
      type_profil: "MONITEUR",
      personne_id: m.id,
      nom_personne: m.nom_prenom,
      type_action: "SORTIE",
      motif: motifSortie.value,
    });
    UI.bip(true);
    UI.flash("SORTIE");
    UI.toast("SORTIE enregistrée · " + m.initials + " · " + motifSortie.value, "ok");
    motifSortie.value = "";
    selectionSortie = null;
    rafraichir();
  });

  btnRetour.addEventListener("click", function () {
    if (!selectionRetour) return;
    const m = selectionRetour;
    DB.mettreAJourMoniteur(m.id, { statut: "PRESENT" });
    DB.ajouterMouvement({
      type_profil: "MONITEUR",
      personne_id: m.id,
      nom_personne: m.nom_prenom,
      type_action: "ENTREE",
      motif: "Retour au camp",
    });
    UI.bip(false);
    UI.flash("RETOUR");
    UI.toast("RETOUR validé · " + m.initials + " est de retour au camp.");
    selectionRetour = null;
    rafraichir();
  });

  motifSortie.addEventListener("input", majBoutonSortie);

  /* Liste filtrée selon la page (Moniteurs ou Aides-Moniteurs) */
  function listeDuProfil() {
    return DB.moniteurs().filter(function (m) {
      return PAGE.filtreRole ? m.role === PAGE.filtreRole : true;
    });
  }

  function rafraichirAlertes() {
    const listes = listeDuProfil();
    const ids = listes.map(function (m) { return m.id; });
    const dehors = DB.personnesDehors().filter(function (d) {
      return d.type_profil === "MONITEUR" && ids.indexOf(d.personne.id) !== -1;
    });
    const longs = dehors.filter(function (d) {
      return (
        d.sortie &&
        DB.dureeSortie(d.sortie.heure_mouvement) >= DB.SEUIL_ALERTE_SEC
      );
    });

    zoneAlertes.innerHTML = "";
    longs.forEach(function (d) {
      const dur = DB.formaterDuree(DB.dureeSortie(d.sortie.heure_mouvement));
      const div = document.createElement("div");
      div.className = "alerte-longue";
      div.innerHTML =
        "⏰ <span>" + d.personne.nom_prenom + " (" + d.personne.initials +
        ") est dehors depuis <strong>" + dur +
        "</strong> — " + (d.sortie.motif || "") + "</span>";
      zoneAlertes.appendChild(div);
    });
  }

  function rafraichir() {
    const moniteurs = listeDuProfil();

    grilleSortie.innerHTML = "";
    moniteurs
      .filter(function (m) { return m.statut === "PRESENT"; })
      .forEach(function (m) {
        grilleSortie.appendChild(cartePersonne(m, true));
      });

    grilleRetour.innerHTML = "";
    const dehors = moniteurs.filter(function (m) { return m.statut === "DEHORS"; });
    if (dehors.length === 0) {
      grilleRetour.innerHTML =
        '<p style="color:#888; text-align:center; grid-column:1/-1; padding:16px;">' +
        "Aucun membre dehors pour le moment ✅</p>";
    }
    dehors.forEach(function (m) {
      grilleRetour.appendChild(cartePersonne(m, false));
    });

    majBoutonSortie();
    majBoutonRetour();
    rafraichirAlertes();
  }

  // Actualisation auto toutes les 15 secondes
  setInterval(rafraichir, 15000);
  rafraichir();
})();

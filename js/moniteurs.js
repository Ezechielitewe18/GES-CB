/* =====================================================
   GES-CB - Page Moniteurs & Aides-Moniteurs
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();

  const PAGE = window.PAGE_MONITEURS || { actif: "moniteurs.html", filtreRole: null, titre: "Moniteurs" };
  UI.installerNavbar(PAGE.actif);

  const LABEL_PERSONNE =
    PAGE.filtreRole === "Aide-Moniteur" ? "Aide-Moniteur" : "Moniteur";

  const tableSortie = document.getElementById("table-sortie");
  const tableRetour = document.getElementById("table-retour");
  const rechercheMoniteur = document.getElementById("recherche-moniteur");
  const motifSortie = document.getElementById("motif-sortie");
  const btnSortie = document.getElementById("btn-sortie");
  const btnRetour = document.getElementById("btn-retour");
  const recapSortie = document.getElementById("recap-sortie");
  const recapRetour = document.getElementById("recap-retour");
  const zoneAlertes = document.getElementById("zone-alertes");

  let selectionSortie = null;
  let selectionRetour = null;

  function ligneTableau(m, pourSortie, dejaSelectionne, info) {
    const tr = document.createElement("tr");
    if (m.statut === "DEHORS") tr.className = "ligne-dehors";
    if (dejaSelectionne) tr.classList.add("selectionnee");
    const parts = DB.decomposerNom(m.nom_prenom);
    const initials =
      m.initials ||
      (
        (parts.prenom.charAt(0) || "") +
        (parts.nom.charAt(0) || parts.postnom.charAt(0) || "")
      ).toUpperCase();
    const classeAvatar = "avatar avatar-" + (m.sexe === "M" ? "m" : "f");
    const dehors = m.statut === "DEHORS";
    const etat = dehors ? "DEHORS" : "PRÉSENT";
    const classeEtat = dehors ? "rouge" : "vert";
    let alarme = "";
    if (dehors && info && info.enAlerte) {
      tr.classList.add("ligne-alerte");
      alarme = '<span class="alarme-badge">⏰ Dehors depuis ' + info.duree + "</span>";
    }
    tr.innerHTML =
      "<td>" +
        '<span class="' + classeAvatar + '">' + initials + "</span>" +
        '<span class="cell-nom">' +
          "<strong>" + (parts.prenom || "—") + "</strong>" +
          '<span class="pill-statut pill-' + classeEtat + '"><span class="point"></span>' + etat + "</span>" +
          alarme +
        "</span>" +
      "</td>" +
      "<td>" + (parts.nom || "—") + "</td>" +
      "<td>" + (parts.postnom || "—") + "</td>" +
      '<td><span class="sexe-badge sexe-' + (m.sexe === "M" ? "m" : "f") + '">' + (m.sexe === "M" ? "M" : "F") + "</span></td>" +
      "<td>" + (m.telephone || "—") + "</td>" +
      '<td><span class="commission-badge">' + (m.commission || "—") + "</span></td>";

    tr.addEventListener("click", function () {
      if (pourSortie) {
        selectionSortie = m;
        tableSortie.querySelectorAll("tbody tr").forEach(function (r) {
          r.classList.remove("selectionnee");
        });
        tr.classList.add("selectionnee");
        majBoutonSortie();
      } else {
        selectionRetour = m;
        tableRetour.querySelectorAll("tbody tr").forEach(function (r) {
          r.classList.remove("selectionnee");
        });
        tr.classList.add("selectionnee");
        majBoutonRetour();
      }
    });

    // Historique + coordonnées (idee 3) sur double-clic sur le nom
    const nomEl = tr.querySelector("td strong");
    nomEl.title = "Double-cliquer pour voir les coordonnées et l'historique";
    nomEl.addEventListener("dblclick", function () {
      UI.ouvrirHistorique("MONITEUR", m.id, m.nom_prenom, [
        { label: "Sexe", value: m.sexe === "M" ? "Masculin" : "Féminin" },
        { label: "Téléphone", value: m.telephone || "—" },
        { label: "Commission", value: m.commission || "—" },
      ]);
    });

    return tr;
  }

  function majBoutonSortie() {
    btnSortie.disabled = !(selectionSortie && motifSortie.value);
    if (selectionSortie) {
      recapSortie.classList.add("visible");
      recapSortie.innerHTML =
        '<div class="ligne"><span class="label">' + LABEL_PERSONNE + "</span><span>" +
        selectionSortie.nom_prenom + "</span></div>" +
        '<div class="ligne"><span class="label">Commission</span><span>' +
        (selectionSortie.commission || "—") + "</span></div>" +
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
        '<div class="ligne"><span class="label">' + LABEL_PERSONNE + "</span><span>" +
        selectionRetour.nom_prenom + "</span></div>" +
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
    UI.toast("SORTIE enregistrée · " + m.nom_prenom + " · " + motifSortie.value, "ok");
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
    UI.toast("RETOUR validé · " + m.nom_prenom + " est de retour au camp.");
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

  /* Filtre de recherche */
  function correspond(m) {
    const q = rechercheMoniteur.value.trim().toLowerCase();
    if (!q) return true;
    const texte = (
      m.nom_prenom + " " +
      (m.telephone || "") + " " +
      (m.commission || "") + " " +
      m.sexe
    ).toLowerCase();
    return texte.indexOf(q) !== -1;
  }

  function rafraichirAlertes() {
    const listes = listeDuProfil();
    const ids = listes.map(function (m) { return m.id; });
    const dehors = DB.personnesDehors().filter(function (d) {
      return d.type_profil === "MONITEUR" && ids.indexOf(d.personne.id) !== -1;
    });
    const longs = dehors.filter(DB.enAlerte);

    zoneAlertes.innerHTML = "";
    longs.forEach(function (d) {
      const dur = DB.formaterDuree(DB.dureeSortie(d.sortie));
      const seuil = DB.formaterDuree(DB.seuilAlertePour(d.type_profil, d.personne));
      const div = document.createElement("div");
      div.className = "alerte-longue";
      div.innerHTML =
        "⏰ <span>" + d.personne.nom_prenom +
        " est dehors depuis <strong>" + dur +
        "</strong> (alerte après " + seuil +
        ") — " + (d.sortie.motif || "") + "</span>";
      zoneAlertes.appendChild(div);
    });
  }

  function rafraichir() {
    const moniteurs = listeDuProfil().filter(correspond);

    const tbodySortie = tableSortie.querySelector("tbody");
    tbodySortie.innerHTML = "";
    moniteurs
      .filter(function (m) { return m.statut === "PRESENT"; })
      .forEach(function (m) {
        tbodySortie.appendChild(ligneTableau(m, true, selectionSortie && selectionSortie.id === m.id));
      });
    if (!moniteurs.some(function (m) { return m.statut === "PRESENT"; })) {
      tbodySortie.innerHTML =
        '<tr class="ligne-vide"><td colspan="6">' +
        "Aucun moniteur présent" + (rechercheMoniteur.value ? " pour cette recherche" : "") + ".</td></tr>";
    }

    const tbodyRetour = tableRetour.querySelector("tbody");
    tbodyRetour.innerHTML = "";
    const dehors = moniteurs.filter(function (m) { return m.statut === "DEHORS"; });
    if (dehors.length === 0) {
      tbodyRetour.innerHTML =
        '<tr class="ligne-vide"><td colspan="6">' +
        "Aucun moniteur dehors pour le moment ✅</td></tr>";
    }
    const infosDehors = DB.personnesDehors()
      .filter(function (d) { return d.type_profil === "MONITEUR"; })
      .reduce(function (acc, d) {
        acc[d.personne.id] = {
          duree: DB.formaterDuree(DB.dureeSortie(d.sortie)),
          enAlerte: DB.enAlerte(d),
        };
        return acc;
      }, {});
    dehors.forEach(function (m) {
      tbodyRetour.appendChild(ligneTableau(m, false, selectionRetour && selectionRetour.id === m.id, infosDehors[m.id]));
    });

    majBoutonSortie();
    majBoutonRetour();
    rafraichirAlertes();
  }

  rechercheMoniteur.addEventListener("input", rafraichir);

  // Actualisation auto toutes les 15 secondes
  setInterval(rafraichir, 15000);
  rafraichir();
})();

/* =====================================================
   GES-CB - Page Enfants (création + sortie, retours)
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("enfants.html");

  const nomEnfant = document.getElementById("nom-enfant");
  const motifEnfant = document.getElementById("motif-enfant");
  const blocAutreEnfant = document.getElementById("bloc-autre-enfant");
  const motifAutreEnfant = document.getElementById("motif-autre-enfant");
  const accompagnantEnfant = document.getElementById("accompagnant-enfant");
  const btnNouvelEnfant = document.getElementById("btn-nouvel-enfant");

  const recherche = document.getElementById("recherche-enfant");
  const suggestions = document.getElementById("suggestions");
  const ficheEnfant = document.getElementById("fiche-enfant");
  const statutEnfant = document.getElementById("statut-enfant");
  const formNouvelleSortie = document.getElementById("form-nouvelle-sortie");
  const motifExistant = document.getElementById("motif-existant");
  const blocAutreExistant = document.getElementById("bloc-autre-existant");
  const motifAutreExistant = document.getElementById("motif-autre-existant");
  const btnNouvelleSortie = document.getElementById("btn-nouvelle-sortie");
  const zoneRetour = document.getElementById("zone-retour");
  const btnRetourEnfant = document.getElementById("btn-retour-enfant");
  const listeEnfants = document.getElementById("liste-enfants");
  const zoneAlertes = document.getElementById("zone-alertes");

  let enfantSelectionne = null;

  /* Motif : "Autre..." ouvre une case de texte libre ; sinon vide autorisé */
  function gererChampAutre(select, autre, bloc) {
    select.addEventListener("change", function () {
      const estAutre = select.value === "Autre";
      bloc.style.display = estAutre ? "block" : "none";
      if (!estAutre) autre.value = "";
    });
  }

  function valeurMotif(select, autre) {
    if (select.value === "Autre") return autre.value.trim();
    return select.value;
  }

  function reinitialiserMotif(select, autre, bloc) {
    select.value = "";
    autre.value = "";
    bloc.style.display = "none";
  }

  gererChampAutre(motifEnfant, motifAutreEnfant, blocAutreEnfant);
  gererChampAutre(motifExistant, motifAutreExistant, blocAutreExistant);

  /* ----- Nouvel enfant ----- */
  btnNouvelEnfant.addEventListener("click", function () {
    const nom = nomEnfant.value.trim();
    const motif = valeurMotif(motifEnfant, motifAutreEnfant);
    const accompagnant = accompagnantEnfant.value.trim();

    if (!nom) {
      UI.toast("Le nom de l'enfant est obligatoire.", "erreur");
      return;
    }

    const e = DB.ajouterEnfant({ nom_prenom: nom, statut: "DEHORS" });
    DB.ajouterMouvement({
      type_profil: "ENFANT",
      personne_id: e.id,
      nom_personne: nom,
      type_action: "SORTIE",
      motif: motif + (accompagnant ? " · Accompagné par : " + accompagnant : ""),
    });

    UI.bip(true);
    UI.flash("SORTIE");
    UI.toast("Enfant créé et sorti · " + nom, "ok");

    nomEnfant.value = "";
    accompagnantEnfant.value = "";
    reinitialiserMotif(motifEnfant, motifAutreEnfant, blocAutreEnfant);
    rafraichirListe();
  });

  /* ----- Recherche d'enfant existant ----- */
  recherche.addEventListener("input", function () {
    const q = recherche.value.trim().toLowerCase();
    suggestions.innerHTML = "";

    if (!q) {
      ficheEnfant.style.display = "none";
      return;
    }

    const trouves = DB.enfants().filter(function (e) {
      return e.nom_prenom.toLowerCase().indexOf(q) !== -1;
    });

    trouves.slice(0, 6).forEach(function (e) {
      const s = document.createElement("span");
      s.className = "sug";
      s.textContent = e.nom_prenom;
      s.addEventListener("click", function () {
        recherche.value = e.nom_prenom;
        suggestions.innerHTML = "";
        afficherFiche(e);
      });
      suggestions.appendChild(s);
    });
  });

  function afficherFiche(e) {
    enfantSelectionne = e;
    ficheEnfant.style.display = "block";

    if (e.statut === "DEHORS") {
      statutEnfant.innerHTML =
        '<span class="badge badge-rouge">DEHORS</span>' +
        " <span style='font-size:14px;'>L'enfant est actuellement <strong>en dehors du camp</strong>.</span>";
      formNouvelleSortie.style.display = "none";
      zoneRetour.style.display = "block";
    } else {
      statutEnfant.innerHTML =
        '<span class="badge badge-vert">PRÉSENT</span>' +
        " <span style='font-size:14px;'>L'enfant est <strong>présent au camp</strong>.</span>";
      zoneRetour.style.display = "none";
      formNouvelleSortie.style.display = "block";
    }
  }

  btnRetourEnfant.addEventListener("click", function () {
    if (!enfantSelectionne) return;
    const e = enfantSelectionne;
    DB.mettreAJourEnfant(e.id, { statut: "PRESENT" });
    DB.ajouterMouvement({
      type_profil: "ENFANT",
      personne_id: e.id,
      nom_personne: e.nom_prenom,
      type_action: "ENTREE",
      motif: "Retour au camp",
    });
    UI.bip(false);
    UI.flash("RETOUR");
    UI.toast("RETOUR validé · " + e.nom_prenom + " est de retour au camp.");
    enfantSelectionne = null;
    ficheEnfant.style.display = "none";
    rafraichirListe();
  });

  btnNouvelleSortie.addEventListener("click", function () {
    if (!enfantSelectionne) return;
    const motif = valeurMotif(motifExistant, motifAutreExistant);
    const e = enfantSelectionne;
    DB.mettreAJourEnfant(e.id, { statut: "DEHORS" });
    DB.ajouterMouvement({
      type_profil: "ENFANT",
      personne_id: e.id,
      nom_personne: e.nom_prenom,
      type_action: "SORTIE",
      motif: motif,
    });
    UI.bip(true);
    UI.flash("SORTIE");
    UI.toast("SORTIE enregistrée · " + e.nom_prenom, "ok");
    reinitialiserMotif(motifExistant, motifAutreExistant, blocAutreExistant);
    enfantSelectionne = null;
    ficheEnfant.style.display = "none";
    rafraichirListe();
  });

  /* ----- Liste tous les enfants (avec historique) ----- */
  function rafraichirListe() {
    const enfants = DB.enfants();
    if (enfants.length === 0) {
      listeEnfants.innerHTML = '<p style="color:#888;">Aucun enfant enregistré.</p>';
      return;
    }

    let html =
      '<h3 style="margin-bottom:8px;">Tous les enfants</h3>' +
      '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
      "<th>Enfant</th><th>Statut</th><th>Actions</th></tr></thead><tbody>";

    enfants.slice().reverse().forEach(function (e) {
      const badge =
        e.statut === "DEHORS"
          ? '<span class="badge badge-rouge">DEHORS</span>'
          : '<span class="badge badge-vert">PRÉSENT</span>';
      html +=
        "<tr><td><strong>" + e.nom_prenom + "</strong></td>" +
        "<td>" + badge + "</td>" +
        '<td><button class="btn btn-gris btn-petit" data-hist="' + e.id + '">Historique</button></td></tr>';
    });

    html += "</tbody></table></div>";
    listeEnfants.innerHTML = html;

    listeEnfants.querySelectorAll("[data-hist]").forEach(function (b) {
      b.addEventListener("click", function () {
        const e = DB.enfantParId(Number(b.getAttribute("data-hist")));
        if (e) UI.ouvrirHistorique("ENFANT", e.id, e.nom_prenom);
      });
    });
  }

  /* ----- Alertes sortie longue (idee 2) ----- */
  function rafraichirAlertes() {
    const dehors = DB.personnesDehors();
    const longs = dehors.filter(function (d) {
      return (
        d.sortie &&
        d.type_profil === "ENFANT" &&
        DB.dureeSortie(d.sortie.heure_mouvement) >= DB.SEUIL_ALERTE_SEC
      );
    });

    zoneAlertes.innerHTML = "";
    longs.forEach(function (d) {
      const dur = DB.formaterDuree(DB.dureeSortie(d.sortie.heure_mouvement));
      const div = document.createElement("div");
      div.className = "alerte-longue";
      div.innerHTML =
        "⏰ <span>" + d.personne.nom_prenom + " est dehors depuis <strong>" + dur +
        "</strong> — " + (d.sortie.motif || "") + "</span>";
      zoneAlertes.appendChild(div);
    });
  }

  setInterval(function () {
    rafraichirListe();
    rafraichirAlertes();
  }, 15000);

  rafraichirListe();
  rafraichirAlertes();
})();

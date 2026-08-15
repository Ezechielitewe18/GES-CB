/* =====================================================
   GES-CB - Page Enfants
   - Internes : créés au camp, sorties ponctuelles (cours,
     RDV...) puis retour.
   - Externes : viennent le matin (arrivée) et rentrent
     chez eux le soir (départ). Ils ne dorment pas au camp.
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("enfants.html");

  const nomEnfant = document.getElementById("nom-enfant");
  const typeEnfant = document.getElementById("type-enfant");
  const blocMotifCreation = document.getElementById("bloc-motif-creation");
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
  const zoneArriveeExterne = document.getElementById("zone-arrivee-externe");
  const btnArriveeExterne = document.getElementById("btn-arrivee-externe");
  const zoneDepartExterne = document.getElementById("zone-depart-externe");
  const btnDepartExterne = document.getElementById("btn-depart-externe");
  const listeEnfants = document.getElementById("liste-enfants");
  const zoneAlertes = document.getElementById("zone-alertes");

  let enfantSelectionne = null;
  let doublonConfirme = false;

  function estExterne(e) {
    return e && e.type_enfant === "EXTERNE";
  }

  function typeBadge(e) {
    return estExterne(e)
      ? '<span class="badge badge-orange">Externe</span>'
      : '<span class="badge badge-or">Interne</span>';
  }

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

  /* Le type choisi adapte le formulaire de création */
  typeEnfant.addEventListener("change", function () {
    const externe = typeEnfant.value === "EXTERNE";
    blocMotifCreation.style.display = externe ? "none" : "block";
    btnNouvelEnfant.textContent = externe
      ? "Enregistrer l'arrivée du matin"
      : "Valider et sortir l'enfant";
    if (externe) reinitialiserMotif(motifEnfant, motifAutreEnfant, blocAutreEnfant);
  });

  nomEnfant.addEventListener("input", function () {
    doublonConfirme = false;
  });

  /* ----- Nouvel enfant ----- */
  btnNouvelEnfant.addEventListener("click", function () {
    const nom = nomEnfant.value.trim();
    const externe = typeEnfant.value === "EXTERNE";
    const motif = valeurMotif(motifEnfant, motifAutreEnfant);
    const accompagnant = accompagnantEnfant.value.trim();

    if (!nom) {
      UI.toast("Le nom de l'enfant est obligatoire.", "erreur");
      return;
    }

    /* Garde anti-doublon : demande une confirmation si le nom existe déjà */
    const doublon = DB.enfants().find(function (e) {
      return e.nom_prenom.toLowerCase() === nom.toLowerCase();
    });
    if (doublon && !doublonConfirme) {
      doublonConfirme = true;
      UI.toast(
        "Un enfant « " + doublon.nom_prenom + " » existe déjà — cliquez à nouveau pour confirmer.",
        "erreur"
      );
      return;
    }
    doublonConfirme = false;

    if (externe) {
      /* EXTERNE : il arrive le matin (présent au camp) */
      const e = DB.ajouterEnfant({ nom_prenom: nom, type_enfant: "EXTERNE", statut: "PRESENT" });
      DB.ajouterMouvement({
        type_profil: "ENFANT",
        personne_id: e.id,
        nom_personne: nom,
        type_action: "ENTREE",
        motif: "Arrivée du matin" + (accompagnant ? " · Accompagné par : " + accompagnant : ""),
      });
      UI.bip(true);
      UI.flash("SORTIE");
      UI.toast("Arrivée du matin enregistrée · " + nom, "ok");
    } else {
      /* INTERNE : il est créé et sorti du camp */
      const e = DB.ajouterEnfant({ nom_prenom: nom, type_enfant: "INTERNE", statut: "DEHORS" });
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
    }

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

    zoneRetour.style.display = "none";
    formNouvelleSortie.style.display = "none";
    zoneArriveeExterne.style.display = "none";
    zoneDepartExterne.style.display = "none";

    if (estExterne(e)) {
      if (e.statut === "DEHORS") {
        statutEnfant.innerHTML =
          '<span class="badge badge-orange">CHEZ LUI</span>' +
          " <span style='font-size:14px;'>L'enfant est rentré à la maison hier soir. Il revient demain matin.</span>";
        zoneArriveeExterne.style.display = "block";
      } else {
        statutEnfant.innerHTML =
          '<span class="badge badge-vert">PRÉSENT</span>' +
          " <span style='font-size:14px;'>L'enfant est <strong>au camp</strong>. Il rentre chez lui ce soir.</span>";
        zoneDepartExterne.style.display = "block";
      }
      return;
    }

    /* Interne */
    if (e.statut === "DEHORS") {
      statutEnfant.innerHTML =
        '<span class="badge badge-rouge">DEHORS</span>' +
        " <span style='font-size:14px;'>L'enfant est actuellement <strong>en dehors du camp</strong>.</span>";
      zoneRetour.style.display = "block";
    } else {
      statutEnfant.innerHTML =
        '<span class="badge badge-vert">PRÉSENT</span>' +
        " <span style='font-size:14px;'>L'enfant est <strong>présent au camp</strong>.</span>";
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

  /* ----- Enfant EXTERNE : départ du soir (rentre chez lui) ----- */
  btnDepartExterne.addEventListener("click", function () {
    if (!enfantSelectionne) return;
    const e = enfantSelectionne;
    DB.mettreAJourEnfant(e.id, { statut: "DEHORS" });
    DB.ajouterMouvement({
      type_profil: "ENFANT",
      personne_id: e.id,
      nom_personne: e.nom_prenom,
      type_action: "SORTIE",
      motif: "Départ du soir — rentre chez lui",
    });
    UI.bip(true);
    UI.flash("SORTIE");
    UI.toast("Départ du soir validé · " + e.nom_prenom + " est rentré chez lui.");
    enfantSelectionne = null;
    ficheEnfant.style.display = "none";
    rafraichirListe();
  });

  /* ----- Enfant EXTERNE : arrivée du matin ----- */
  btnArriveeExterne.addEventListener("click", function () {
    if (!enfantSelectionne) return;
    const e = enfantSelectionne;
    DB.mettreAJourEnfant(e.id, { statut: "PRESENT" });
    DB.ajouterMouvement({
      type_profil: "ENFANT",
      personne_id: e.id,
      nom_personne: e.nom_prenom,
      type_action: "ENTREE",
      motif: "Arrivée du matin",
    });
    UI.bip(true);
    UI.flash("SORTIE");
    UI.toast("Arrivée enregistrée · " + e.nom_prenom + " est au camp.");
    enfantSelectionne = null;
    ficheEnfant.style.display = "none";
    rafraichirListe();
  });

  /* ----- Liste tous les enfants (avec historique + type) ----- */
  function rafraichirListe() {
    const enfants = DB.enfants();
    if (enfants.length === 0) {
      listeEnfants.innerHTML = '<p style="color:#888;">Aucun enfant enregistré.</p>';
      return;
    }

    const infosDehors = DB.personnesDehors()
      .filter(function (d) { return d.type_profil === "ENFANT"; })
      .reduce(function (acc, d) {
        acc[d.personne.id] = {
          duree: DB.formaterDuree(DB.dureeSortie(d.sortie)),
          enAlerte: DB.enAlerte(d),
        };
        return acc;
      }, {});

    let html =
      '<h3 style="margin-bottom:8px;">Tous les enfants</h3>' +
      '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
      "<th>Enfant</th><th>Type</th><th>Statut</th><th>Actions</th></tr></thead><tbody>";

    enfants.slice().reverse().forEach(function (e) {
      const info = infosDehors[e.id];
      const badge =
        e.statut === "DEHORS"
          ? '<span class="badge badge-rouge">DEHORS</span>'
          : '<span class="badge badge-vert">PRÉSENT</span>';
      let alarme = "";
      let enAlerte = false;

      if (estExterne(e)) {
        /* Externe encore sur le site trop longtemps (alerte après 18 h) */
        const duree = DB.dureeDepuisArrivee("ENFANT", e.id);
        if (e.statut === "PRESENT" && duree >= DB.seuilAlertePour("ENFANT")) {
          enAlerte = true;
          alarme = '<span class="alarme-badge">⏰ Encore au camp depuis ' +
            DB.formaterDuree(duree) + "</span>";
        }
      } else if (info && info.enAlerte) {
        /* Interne dehors trop longtemps */
        enAlerte = true;
        alarme = '<span class="alarme-badge">⏰ Dehors depuis ' + info.duree + "</span>";
      }

      html +=
        "<tr" + (enAlerte ? ' class="ligne-alerte"' : "") +
        "><td><strong>" + e.nom_prenom + "</strong></td>" +
        "<td>" + typeBadge(e) + "</td>" +
        "<td>" + badge + "<br>" + alarme + "</td>" +
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

  /* ----- Alertes : interne dehors > 18 h, externe encore sur site > 18 h ----- */
  function rafraichirAlertes() {
    const dehors = DB.personnesDehors();
    const longs = dehors.filter(function (d) {
      return d.type_profil === "ENFANT" &&
        !estExterne(d.personne) &&
        DB.enAlerte(d);
    });

    const longsPresence = DB.enfants().filter(function (e) {
      return estExterne(e) &&
        e.statut === "PRESENT" &&
        DB.dureeDepuisArrivee("ENFANT", e.id) >= DB.seuilAlertePour("ENFANT");
    });

    zoneAlertes.innerHTML = "";
    longs.forEach(function (d) {
      const dur = DB.formaterDuree(DB.dureeSortie(d.sortie));
      const seuil = DB.formaterDuree(DB.seuilAlertePour(d.type_profil, d.personne));
      const div = document.createElement("div");
      div.className = "alerte-longue";
      div.innerHTML =
        "⏰ <span>" + d.personne.nom_prenom + " est dehors depuis <strong>" + dur +
        "</strong> (alerte après " + seuil +
        ") — " + (d.sortie.motif || "") + "</span>";
      zoneAlertes.appendChild(div);
    });
    longsPresence.forEach(function (e) {
      const dur = DB.formaterDuree(DB.dureeDepuisArrivee("ENFANT", e.id));
      const div = document.createElement("div");
      div.className = "alerte-longue";
      div.innerHTML =
        "⏰ <span>" + e.nom_prenom + " (externe) est encore sur le site depuis <strong>" +
        dur + "</strong> — il devrait être rentré chez lui.</span>";
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

/* =====================================================
   GES-CB - Page Statistiques (temps réel, Super Admin)
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("statistiques.html");

  const statMoniteurs = document.getElementById("stat-moniteurs");
  const statEnfants = document.getElementById("stat-enfants");
  const statVisiteurs = document.getElementById("stat-visiteurs");
  const statDehors = document.getElementById("stat-dehors");
  const listeDehors = document.getElementById("liste-dehors");
  const listeJournal = document.getElementById("liste-journal");
  const zoneAlertes = document.getElementById("zone-alertes");

  const LIBELLE_PROFIL = {
    MONITEUR: "Moniteur",
    ENFANT: "Enfant",
    VISITEUR: "Visiteur",
  };

  function badgeProfil(t) {
    if (t === "MONITEUR") return '<span class="badge badge-orange">Moniteur</span>';
    if (t === "ENFANT") return '<span class="badge badge-vert">Enfant</span>';
    return '<span class="badge badge-gris">Visiteur</span>';
  }

  function rafraichir() {
    const moniteurs = DB.moniteurs();
    const enfants = DB.enfants();
    const visiteurs = DB.visiteurs();
    const dehors = DB.personnesDehors();

    // Compteurs
    statMoniteurs.textContent = moniteurs.filter(function (m) { return m.statut === "PRESENT"; }).length;
    statEnfants.textContent = enfants.filter(function (e) { return e.statut === "PRESENT"; }).length;
    statVisiteurs.textContent = visiteurs.filter(function (v) { return v.statut === "SUR_SITE"; }).length;
    statDehors.textContent = dehors.length;

    // Alertes sortie longue (idee 2)
    const longs = dehors.filter(function (d) {
      return d.sortie && DB.dureeSortie(d.sortie.heure_mouvement) >= DB.SEUIL_ALERTE_SEC;
    });
    zoneAlertes.innerHTML = "";
    longs.forEach(function (d) {
      const dur = DB.formaterDuree(DB.dureeSortie(d.sortie.heure_mouvement));
      const div = document.createElement("div");
      div.className = "alerte-longue";
      div.innerHTML =
        "⏰ <span>" + d.personne.nom_prenom +
        " (" + LIBELLE_PROFIL[d.type_profil] + ") dehors depuis <strong>" + dur +
        "</strong> — " + (d.sortie.motif || "") + "</span>";
      zoneAlertes.appendChild(div);
    });

    // Liste des personnes dehors
    if (dehors.length === 0) {
      listeDehors.innerHTML = '<p style="color:#888;">Tout le monde est présent au camp ✅</p>';
    } else {
      let html =
        '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
        "<th>Profil</th><th>Nom</th><th>Motif</th><th>Heure sortie</th><th>Durée</th>" +
        "</tr></thead><tbody>";

      dehors.forEach(function (d) {
        const dur = d.sortie
          ? DB.formaterDuree(DB.dureeSortie(d.sortie.heure_mouvement))
          : "—";
        html +=
          "<tr>" +
          "<td>" + badgeProfil(d.type_profil) + "</td>" +
          "<td><strong>" + d.personne.nom_prenom + "</strong></td>" +
          "<td>" + (d.sortie ? d.sortie.motif : "—") + "</td>" +
          "<td>" + (d.sortie ? d.sortie.heure_mouvement : "—") + "</td>" +
          "<td>" + dur + "</td>" +
          "</tr>";
      });

      html += "</tbody></table></div>";
      listeDehors.innerHTML = html;
    }

    // Journal du jour
    const journal = DB.derniersMouvementsDuJour();
    if (journal.length === 0) {
      listeJournal.innerHTML = '<p style="color:#888;">Aucun mouvement aujourd\'hui.</p>';
    } else {
      let html =
        '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
        "<th>Heure</th><th>Profil</th><th>Nom</th><th>Action</th><th>Motif</th><th>Agent</th>" +
        "</tr></thead><tbody>";

      journal.slice().reverse().slice(0, 50).forEach(function (m) {
        const badge =
          m.type_action === "SORTIE"
            ? '<span class="badge badge-rouge">SORTIE</span>'
            : '<span class="badge badge-vert">ENTRÉE</span>';
        html +=
          "<tr>" +
          "<td>" + m.heure_mouvement + "</td>" +
          "<td>" + badgeProfil(m.type_profil) + "</td>" +
          "<td><strong>" + m.nom_personne + "</strong></td>" +
          "<td>" + badge + "</td>" +
          "<td>" + (m.motif || "—") + "</td>" +
          "<td>" + (m.agent_accueil || "—") + "</td>" +
          "</tr>";
      });

      html += "</tbody></table></div>";
      listeJournal.innerHTML = html;
    }
  }

  /* ----- Export liste des présents (impression) ----- */
  document.getElementById("btn-imprimer").addEventListener("click", function () {
    const moniteurs = DB.moniteurs().filter(function (m) { return m.statut === "PRESENT"; });
    const enfants = DB.enfants().filter(function (e) { return e.statut === "PRESENT"; });
    const visiteurs = DB.visiteurs().filter(function (v) { return v.statut === "SUR_SITE"; });

    const maintenant = new Date().toLocaleString("fr-FR");
    const total =
      moniteurs.length + enfants.length + visiteurs.length;

    const contenu = [
      "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'/>" +
        "<title>Liste des présents · GES-CB</title>" +
        "<style>" +
        "body{font-family:Arial,sans-serif;padding:24px;color:#111;}" +
        "h1{text-align:center;border-bottom:3px double #D4AF37;padding-bottom:8px;}" +
        ".sous{text-align:center;color:#555;margin-bottom:24px;}" +
        "h2{color:#8a6d1a;margin-top:18px;}" +
        "table{width:100%;border-collapse:collapse;margin-top:6px;}" +
        "th,td{border:1px solid #999;padding:6px 10px;text-align:left;font-size:13px;}" +
        "th{background:#eee;}" +
        ".total{margin-top:22px;font-weight:bold;font-size:15px;}" +
        "</style></head><body>" +
        "<h1>Camp Biblique · Liste des PRÉSENTS</h1>" +
        '<div class="sous">Générée le ' + maintenant + "</div>" +
        "<h2>Moniteurs &amp; Aides (" + moniteurs.length + ")</h2>" +
        (moniteurs.length ? tableHtml(moniteurs.map(function (m) {
          return [m.nom_prenom + " (" + m.initials + ")", m.role];
        }), ["Nom", "Rôle"]) : "<p>Aucun.</p>") +
        "<h2>Enfants (" + enfants.length + ")</h2>" +
        (enfants.length ? tableHtml(enfants.map(function (e) {
          return [e.nom_prenom];
        }), ["Nom"]) : "<p>Aucun.</p>") +
        "<h2>Visiteurs sur site (" + visiteurs.length + ")</h2>" +
        (visiteurs.length ? tableHtml(visiteurs.map(function (v) {
          return [v.nom_prenom, v.telephone || "—"];
        }), ["Nom", "Téléphone"]) : "<p>Aucun.</p>") +
        '<p class="total">TOTAL PRÉSENTS AU CAMP : ' + total + "</p>" +
        "</body></html>",
    ].join("");

    const fenetre = window.open("", "_blank");
    fenetre.document.write(contenu);
    fenetre.document.close();
    fenetre.focus();
    setTimeout(function () {
      fenetre.print();
    }, 300);
  });

  function tableHtml(lignes, entetes) {
    let h = "<table><thead><tr>";
    entetes.forEach(function (t) { h += "<th>" + t + "</th>"; });
    h += "</tr></thead><tbody>";
    lignes.forEach(function (l) {
      h += "<tr>";
      l.forEach(function (c) { h += "<td>" + c + "</td>"; });
      h += "</tr>";
    });
    h += "</tbody></table>";
    return h;
  }

  setInterval(rafraichir, 5000);
  rafraichir();
})();

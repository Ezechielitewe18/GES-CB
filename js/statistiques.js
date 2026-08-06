/* =====================================================
   GES-CB - Page Statistiques (rapport du jour + présences)
   Moniteurs et Aides-Moniteurs TOUJOURS séparés
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("statistiques.html");

  const ROLE_MONITEUR = "Moniteur";
  const ROLE_AIDE = "Aide-Moniteur";

  const rptMoniteurs = document.getElementById("rpt-moniteurs");
  const rptAides = document.getElementById("rpt-aides");
  const rptEnfants = document.getElementById("rpt-enfants");
  const rptVisiteurs = document.getElementById("rpt-visiteurs");
  const rptTotal = document.getElementById("rpt-total");

  const listeMoniteursDehors = document.getElementById("liste-moniteurs-dehors");
  const listeAidesDehors = document.getElementById("liste-aides-dehors");
  const listeEnfantsDehors = document.getElementById("liste-enfants-dehors");
  const listeVisiteurs = document.getElementById("liste-visiteurs");
  const journalMoniteurs = document.getElementById("journal-moniteurs");
  const journalAides = document.getElementById("journal-aides");
  const journalEnfants = document.getElementById("journal-enfants");
  const journalVisiteurs = document.getElementById("journal-visiteurs");
  const zoneAlertes = document.getElementById("zone-alertes");

  const dateJournee = document.getElementById("date-journal");
  const btnAujourdhui = document.getElementById("btn-aujourdhui");
  const titreRapport = document.getElementById("titre-rapport");
  const titreJournal = document.getElementById("titre-journal");

  function aujourdhuiISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function formaterDateFr(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  let dateSelectionnee = aujourdhuiISO();
  dateJournee.value = dateSelectionnee;

  function mettreAJourTitres() {
    const fr = formaterDateFr(dateSelectionnee);
    titreRapport.textContent = fr;
    titreJournal.textContent = "du " + fr;
  }

  dateJournee.addEventListener("change", function () {
    if (dateJournee.value) {
      dateSelectionnee = dateJournee.value;
      mettreAJourTitres();
      rafraichir();
    }
  });

  btnAujourdhui.addEventListener("click", function () {
    dateSelectionnee = aujourdhuiISO();
    dateJournee.value = dateSelectionnee;
    mettreAJourTitres();
    rafraichir();
  });

  function roleMouvement(m) {
    if (m.type_profil !== "MONITEUR") return null;
    const mono = DB.moniteurParId(m.personne_id);
    return mono ? mono.role : null;
  }

  function rafraichir() {
    const journal = DB.mouvementsParDate(dateSelectionnee);
    const sorties = journal.filter(function (m) { return m.type_action === "SORTIE"; });
    const arriveesVisiteurs = journal.filter(function (m) {
      return m.type_profil === "VISITEUR" && m.type_action === "ENTREE";
    });

    /* ----- Rapport du jour : chiffres séparés ----- */
    rptMoniteurs.textContent = sorties.filter(function (m) {
      return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_MONITEUR;
    }).length;
    rptAides.textContent = sorties.filter(function (m) {
      return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_AIDE;
    }).length;
    rptEnfants.textContent = sorties.filter(function (m) {
      return m.type_profil === "ENFANT";
    }).length;
    rptVisiteurs.textContent = arriveesVisiteurs.length;
    rptTotal.textContent = sorties.length;

    /* ----- Alertes sortie longue ----- */
    const dehors = DB.personnesDehors();
    const longs = dehors.filter(function (d) {
      return d.sortie && DB.dureeSortie(d.sortie.heure_mouvement) >= DB.SEUIL_ALERTE_SEC;
    });
    zoneAlertes.innerHTML = "";
    longs.forEach(function (d) {
      const dur = DB.formaterDuree(DB.dureeSortie(d.sortie.heure_mouvement));
      const label = d.type_profil === "MONITEUR"
        ? d.personne.role + " (" + d.personne.initials + ")"
        : d.personne.nom_prenom;
      const div = document.createElement("div");
      div.className = "alerte-longue";
      div.innerHTML =
        "⏰ <span>" + label + " dehors depuis <strong>" + dur +
        "</strong> — " + (d.sortie.motif || "") + "</span>";
      zoneAlertes.appendChild(div);
    });

    /* ----- Moniteurs / Aides / Enfants dehors (séparés) ----- */
    renderDehors(listeMoniteursDehors, dehors.filter(function (d) {
      return d.type_profil === "MONITEUR" && d.personne.role === ROLE_MONITEUR;
    }));
    renderDehors(listeAidesDehors, dehors.filter(function (d) {
      return d.type_profil === "MONITEUR" && d.personne.role === ROLE_AIDE;
    }));
    renderDehors(listeEnfantsDehors, dehors.filter(function (d) {
      return d.type_profil === "ENFANT";
    }));

    /* ----- Visiteurs sur site ----- */
    const surSite = DB.visiteurs().filter(function (v) { return v.statut === "SUR_SITE"; });
    if (surSite.length === 0) {
      listeVisiteurs.innerHTML = '<p style="color:#888;">Aucun visiteur sur le site.</p>';
    } else {
      let html =
        '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
        "<th>Visiteur</th><th>Téléphone</th><th>Pour qui</th></tr></thead><tbody>";
      surSite.forEach(function (v) {
        html +=
          "<tr><td><strong>" + v.nom_prenom + "</strong></td>" +
          "<td>" + (v.telephone || "—") + "</td>" +
          "<td>" + (v.pour_qui || "—") + "</td></tr>";
      });
      html += "</tbody></table></div>";
      listeVisiteurs.innerHTML = html;
    }

    /* ----- Journal du jour : séparé par catégorie ----- */
    renderJournal(journalMoniteurs, journal.filter(function (m) {
      return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_MONITEUR;
    }));
    renderJournal(journalAides, journal.filter(function (m) {
      return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_AIDE;
    }));
    renderJournal(journalEnfants, journal.filter(function (m) {
      return m.type_profil === "ENFANT";
    }));
    renderJournal(journalVisiteurs, journal.filter(function (m) {
      return m.type_profil === "VISITEUR";
    }));
  }

  function profilLabel(m) {
    if (m.type_profil === "MONITEUR") {
      return roleMouvement(m) === ROLE_AIDE
        ? '<span class="badge">Aide-Moniteur</span>'
        : '<span class="badge badge-orange">Moniteur</span>';
    }
    if (m.type_profil === "ENFANT") return '<span class="badge badge-vert">Enfant</span>';
    return '<span class="badge">Visiteur</span>';
  }

  function renderJournal(zone, journal) {
    if (journal.length === 0) {
      zone.innerHTML = '<p style="color:#888;">Aucun mouvement.</p>';
      return;
    }
    let html =
      '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
      "<th>Heure</th><th>Nom</th><th>Action</th><th>Motif</th><th>Agent</th>" +
      "</tr></thead><tbody>";

    journal.slice().reverse().slice(0, 50).forEach(function (m) {
      const badge =
        m.type_action === "SORTIE"
          ? '<span class="badge badge-rouge">SORTIE</span>'
          : '<span class="badge badge-vert">ENTRÉE</span>';
      html +=
        "<tr>" +
        "<td>" + m.heure_mouvement + "</td>" +
        "<td><strong>" + m.nom_personne + "</strong></td>" +
        "<td>" + badge + "</td>" +
        "<td>" + (m.motif || "—") + "</td>" +
        "<td>" + (m.agent_accueil || "—") + "</td>" +
        "</tr>";
    });

    html += "</tbody></table></div>";
    zone.innerHTML = html;
  }

  function renderDehors(zone, liste) {
    if (liste.length === 0) {
      zone.innerHTML = '<p style="color:#888;">Tout le monde est présent ✅</p>';
      return;
    }
    let html =
      '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
      "<th>Nom</th><th>Motif</th><th>Heure</th><th>Durée</th></tr></thead><tbody>";
    liste.forEach(function (d) {
      const dur = d.sortie
        ? DB.formaterDuree(DB.dureeSortie(d.sortie.heure_mouvement))
        : "—";
      html +=
        "<tr>" +
        "<td><strong>" + d.personne.nom_prenom + "</strong></td>" +
        "<td>" + (d.sortie ? d.sortie.motif : "—") + "</td>" +
        "<td>" + (d.sortie ? d.sortie.heure_mouvement : "—") + "</td>" +
        "<td>" + dur + "</td>" +
        "</tr>";
    });
    html += "</tbody></table></div>";
    zone.innerHTML = html;
  }

  /* ----- Impression du RAPPORT (statistiques + journal) ----- */
  document.getElementById("btn-imprimer").addEventListener("click", function () {
    const journal = DB.mouvementsParDate(dateSelectionnee);
    const sorties = journal.filter(function (m) { return m.type_action === "SORTIE"; });
    const arriveesVisiteurs = journal.filter(function (m) {
      return m.type_profil === "VISITEUR" && m.type_action === "ENTREE";
    });

    const nbMoniteurs = sorties.filter(function (m) {
      return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_MONITEUR;
    }).length;
    const nbAides = sorties.filter(function (m) {
      return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_AIDE;
    }).length;
    const nbEnfants = sorties.filter(function (m) { return m.type_profil === "ENFANT"; }).length;
    const nbVisiteurs = arriveesVisiteurs.length;

    const maintenant = new Date().toLocaleString("fr-FR");
    const dateJour = formaterDateFr(dateSelectionnee);
    const feuillePrint = new URL("css/print.css", window.location.href).href;

    const contenu = [
      "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'/>" +
        "<title>Rapport du jour · GES-CB</title>" +
        '<link rel="stylesheet" href="' + feuillePrint + '"/>' +
        "</head><body>" +
        '<div class="en-tete">' +
        "<h1>Camp Biblique</h1>" +
        '<div class="camp">Rapport du Jour</div>' +
        '<div class="sous">Gestion des Entrées &amp; Sorties · ' + dateJour + "</div>" +
        '<div class="sous">Imprimé le ' + maintenant + "</div>" +
        "</div>" +
        "<h2>Statistiques du jour</h2>" +
        '<div class="stats-box"><table>' +
        "<tr><th>Moniteurs sortis</th><td>" + nbMoniteurs + "</td></tr>" +
        "<tr><th>Aides-Moniteurs sortis</th><td>" + nbAides + "</td></tr>" +
        "<tr><th>Enfants sortis</th><td>" + nbEnfants + "</td></tr>" +
        "<tr><th>Visiteurs reçus</th><td>" + nbVisiteurs + "</td></tr>" +
        "<tr><th>Total des sorties</th><td>" + sorties.length + "</td></tr>" +
        "</table></div>" +
        "<h2>Journal — Moniteurs</h2>" +
        journalHtml(journal.filter(function (m) {
          return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_MONITEUR;
        })) +
        "<h2>Journal — Aides-Moniteurs</h2>" +
        journalHtml(journal.filter(function (m) {
          return m.type_profil === "MONITEUR" && roleMouvement(m) === ROLE_AIDE;
        })) +
        "<h2>Journal — Enfants</h2>" +
        journalHtml(journal.filter(function (m) { return m.type_profil === "ENFANT"; })) +
        "<h2>Journal — Visiteurs</h2>" +
        journalHtml(journal.filter(function (m) { return m.type_profil === "VISITEUR"; })) +
        '<div class="pied"><span>GES-CB · Camp Biblique</span>' +
        '<span>Document officiel de la réunion d\'évaluation</span></div>' +
        "</body></html>",
    ].join("");

    function journalHtml(j) {
      if (j.length === 0) return "<p>Aucun mouvement.</p>";
      let h =
        "<table><thead><tr>" +
        "<th>Heure</th><th>Nom</th><th>Action</th><th>Motif</th><th>Agent</th>" +
        "</tr></thead><tbody>";
      j.slice().reverse().forEach(function (m) {
        h +=
          "<tr><td>" + m.heure_mouvement + "</td>" +
          "<td>" + m.nom_personne + "</td>" +
          "<td>" + m.type_action + "</td>" +
          "<td>" + (m.motif || "—") + "</td>" +
          "<td>" + (m.agent_accueil || "—") + "</td></tr>";
      });
      h += "</tbody></table>";
      return h;
    }

    const fenetre = window.open("", "_blank");
    fenetre.document.write(contenu);
    fenetre.document.close();
    fenetre.focus();
    setTimeout(function () {
      fenetre.print();
    }, 300);
  });

  /* ----- Export SQLite ----- */
  document.getElementById("btn-export-sqlite").addEventListener("click", function () {
    const btn = document.getElementById("btn-export-sqlite");
    const statut = document.getElementById("statut-export");
    btn.disabled = true;
    statut.textContent = "Génération du fichier…";
    try {
      const nom = SQLITE_EXPORT.telecharger();
      statut.textContent = "Fichier téléchargé : " + nom;
    } catch (e) {
      statut.style.color = "var(--rouge)";
      statut.textContent = "Échec de l'export : " + e.message;
    }
    btn.disabled = false;
  });

  setInterval(rafraichir, 5000);
  mettreAJourTitres();
  rafraichir();
})();

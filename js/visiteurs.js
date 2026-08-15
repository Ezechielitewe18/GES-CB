/* =====================================================
   GES-CB - Page Visiteurs (arrivées / départs / historique)
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("visiteurs.html");

  const nomVisiteur = document.getElementById("nom-visiteur");
  const telVisiteur = document.getElementById("tel-visiteur");
  const motifVisiteur = document.getElementById("motif-visiteur");
  const pourQuiVisiteur = document.getElementById("pourqui-visiteur");
  const btnArrivee = document.getElementById("btn-arrivee");
  const listeDepart = document.getElementById("liste-depart");
  const recherche = document.getElementById("recherche-visiteur");
  const historique = document.getElementById("historique-visites");
  const zoneAlertes = document.getElementById("zone-alertes");
  const statSurSite = document.getElementById("stat-sur-site");
  const statArrivees = document.getElementById("stat-arrivees");
  const statDeparts = document.getElementById("stat-departs");

  function esc(texte) {
    return String(texte || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Heure d'arrivée d'un visiteur (dernier mouvement ENTREE) */
  function heureEntree(id) {
    const entrees = DB.mouvementsPersonne("VISITEUR", id).filter(function (m) {
      return m.type_action === "ENTREE";
    });
    const derniere = entrees[entrees.length - 1];
    return derniere ? derniere.heure_mouvement : "—";
  }

  btnArrivee.addEventListener("click", function () {
    const nom = nomVisiteur.value.trim();
    if (!nom) {
      UI.toast("Le nom du visiteur est obligatoire.", "erreur");
      return;
    }

    const objet = motifVisiteur.value.trim();
    const pourQui = pourQuiVisiteur.value.trim();

    const v = DB.ajouterVisiteur({
      nom_prenom: nom,
      telephone: telVisiteur.value.trim(),
      pour_qui: pourQui,
    });
    DB.ajouterMouvement({
      type_profil: "VISITEUR",
      personne_id: v.id,
      nom_personne: nom,
      type_action: "ENTREE",
      motif:
        (objet || "Visite") +
        (pourQui ? " · Pour qui : " + pourQui : ""),
    });

    UI.bip(true);
    UI.flash("SORTIE");
    UI.toast("Arrivée enregistrée · " + nom, "ok");

    nomVisiteur.value = "";
    telVisiteur.value = "";
    motifVisiteur.value = "";
    pourQuiVisiteur.value = "";
    rafraichir();
  });

  recherche.addEventListener("input", rafraichir);

  function rafraichir() {
    const tous = DB.visiteurs();
    const surSite = tous.filter(function (v) {
      return v.statut === "SUR_SITE";
    });

    /* ---- Compteurs du haut ---- */
    const mvJour = DB.derniersMouvementsDuJour().filter(function (m) {
      return m.type_profil === "VISITEUR";
    });
    statSurSite.textContent = surSite.length;
    statArrivees.textContent = mvJour.filter(function (m) {
      return m.type_action === "ENTREE";
    }).length;
    statDeparts.textContent = mvJour.filter(function (m) {
      return m.type_action === "SORTIE";
    }).length;

    /* Durée de présence + état d'alerte de chaque visiteur sur site */
    const infos = {};
    surSite.forEach(function (v) {
      const duree = DB.dureeDepuisArrivee("VISITEUR", v.id);
      infos[v.id] = {
        duree: DB.formaterDuree(duree),
        enAlerte: duree >= DB.seuilAlertePour("VISITEUR"),
      };
    });

    /* ---- Bandeaux d'alerte (présence > 20 h) ---- */
    zoneAlertes.innerHTML = "";
    surSite.forEach(function (v) {
      if (infos[v.id].enAlerte) {
        const div = document.createElement("div");
        div.className = "alerte-longue";
        div.innerHTML =
          "⏰ <span>" + esc(v.nom_prenom) +
          " est sur le site depuis <strong>" + infos[v.id].duree +
          "</strong> (alerte après 20 h) — " +
          (v.pour_qui ? "visite de " + esc(v.pour_qui) : "visite") + "</span>";
        zoneAlertes.appendChild(div);
      }
    });

    /* ---- Liste des visiteurs sur le site ---- */
    const q = recherche.value.trim().toLowerCase();
    const affiches = q
      ? surSite.filter(function (v) {
          const texte =
            (v.nom_prenom || "") + " " +
            (v.pour_qui || "") + " " +
            (v.telephone || "");
          return texte.toLowerCase().indexOf(q) !== -1;
        })
      : surSite;

    if (affiches.length === 0) {
      listeDepart.innerHTML =
        '<p style="color:#888; text-align:center; padding:16px;">' +
        (surSite.length === 0
          ? "Aucun visiteur sur le site."
          : "Aucun résultat pour « " + esc(recherche.value) + " ».") +
        "</p>";
    } else {
      listeDepart.innerHTML =
        '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
        "<th>Visiteur</th><th>Arrivée</th><th>Téléphone</th><th>Action</th></tr></thead><tbody>";

      affiches.forEach(function (v) {
        const info = infos[v.id];
        const alarme =
          info && info.enAlerte
            ? '<span class="alarme-badge">⏰ Présent depuis ' + info.duree + "</span>"
            : "";
        listeDepart.innerHTML +=
          "<tr" + (info && info.enAlerte ? ' class="ligne-alerte"' : "") +
          "><td><strong>" + esc(v.nom_prenom) + "</strong>" +
          (v.pour_qui ? "<br><small style='color:#A6B4CE;'>pour : " + esc(v.pour_qui) + "</small>" : "") +
          alarme +
          "</td>" +
          "<td>" + heureEntree(v.id) + "</td>" +
          "<td>" + (esc(v.telephone) || "—") + "</td>" +
          '<td><button class="btn btn-danger btn-petit" data-depart="' + v.id + '">Départ</button></td></tr>';
      });

      listeDepart.innerHTML += "</tbody></table></div>";

      listeDepart.querySelectorAll("[data-depart]").forEach(function (b) {
        b.addEventListener("click", function () {
          const id = Number(b.getAttribute("data-depart"));
          const v = DB.visiteurParId(id);
          if (!v) return;
          DB.mettreAJourVisiteur(id, { statut: "PARTI" });
          DB.ajouterMouvement({
            type_profil: "VISITEUR",
            personne_id: id,
            nom_personne: v.nom_prenom,
            type_action: "SORTIE",
            motif: "Départ du site",
          });
          UI.bip(false);
          UI.flash("RETOUR");
          UI.toast("Départ validé · " + v.nom_prenom);
          rafraichir();
        });
      });
    }

    /* ---- Historique des visites d'aujourd'hui ---- */
    if (mvJour.length === 0) {
      historique.innerHTML =
        '<p style="color:#888; text-align:center; padding:16px;">' +
        "Aucune visite enregistrée aujourd'hui.</p>";
      return;
    }

    mvJour.sort(function (a, b) {
      return b.heure_mouvement.localeCompare(a.heure_mouvement);
    });

    historique.innerHTML =
      '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
      "<th>Heure</th><th>Visiteur</th><th>Type</th><th>Motif</th><th>Agent</th></tr></thead><tbody>";

    mvJour.forEach(function (m) {
      const entree = m.type_action === "ENTREE";
      historique.innerHTML +=
        "<tr><td><strong>" + esc(m.heure_mouvement) + "</strong></td>" +
        "<td>" + esc(m.nom_personne) + "</td>" +
        '<td><span class="badge ' + (entree ? "badge-vert" : "badge-orange") + '">' +
        (entree ? "Arrivée" : "Départ") + "</span></td>" +
        "<td>" + esc(m.motif) + "</td>" +
        "<td>" + esc(m.agent_accueil) + "</td></tr>";
    });

    historique.innerHTML += "</tbody></table></div>";
  }

  setInterval(rafraichir, 15000);
  rafraichir();
})();

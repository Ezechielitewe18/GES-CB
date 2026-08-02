/* =====================================================
   GES-CB - Page Visiteurs (arrivées / départs)
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

  function rafraichir() {
    const surSite = DB.visiteurs().filter(function (v) {
      return v.statut === "SUR_SITE";
    });

    if (surSite.length === 0) {
      listeDepart.innerHTML =
        '<p style="color:#888; text-align:center; padding:16px;">Aucun visiteur sur le site.</p>';
      return;
    }

    listeDepart.innerHTML =
      '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
      "<th>Visiteur</th><th>Téléphone</th><th>Pour qui</th><th>Action</th></tr></thead><tbody>";

    surSite.forEach(function (v) {
      listeDepart.innerHTML +=
        "<tr><td><strong>" + v.nom_prenom + "</strong></td>" +
        "<td>" + (v.telephone || "—") + "</td>" +
        "<td>" + (v.pour_qui || "—") + "</td>" +
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

  setInterval(rafraichir, 15000);
  rafraichir();
})();

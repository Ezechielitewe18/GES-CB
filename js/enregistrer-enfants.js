/* =====================================================
   GES-CB - Page Enregistrer les enfants
   Inscription à l'avance (sans enregistrer de sortie).
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("enregistrer-enfants.html");

  const typeEnfant = document.getElementById("type-enfant");
  const sexeEnfant = document.getElementById("sexe-enfant");
  const nomEnfant = document.getElementById("nom-enfant");
  const ageEnfant = document.getElementById("age-enfant");
  const btnEnregistrer = document.getElementById("btn-enregistrer");
  const statutEnregistrement = document.getElementById("statut-enregistrement");
  const recherche = document.getElementById("recherche");
  const listeEnfants = document.getElementById("liste-enfants");

  let supprEnAttente = null;

  /* ----- Enregistrer un enfant (sans sortie) ----- */
  btnEnregistrer.addEventListener("click", function () {
    const nom = nomEnfant.value.trim();
    const sexe = sexeEnfant.value;
    const type = typeEnfant.value;
    const age = ageEnfant.value.trim();

    if (!nom) {
      UI.toast("Le nom de l'enfant est obligatoire.", "erreur");
      return;
    }

    /* Anti-doublon */
    const doublon = DB.enfants().find(function (e) {
      return e.nom_prenom.toLowerCase() === nom.toLowerCase();
    });
    if (doublon) {
      UI.toast("Un enfant « " + doublon.nom_prenom + " » existe déjà.", "erreur");
      return;
    }

    /* Interne → PRESENT (au camp), Externe → DEHORS (pas encore arrivé) */
    DB.ajouterEnfant({
      nom_prenom: nom,
      sexe: sexe,
      age: age ? Number(age) : null,
      type_enfant: type,
      statut: type === "EXTERNE" ? "DEHORS" : "PRESENT",
    });

    UI.toast("Enfant enregistré · " + nom, "ok");
    nomEnfant.value = "";
    ageEnfant.value = "";
    rafraichirListe();
  });

  /* ----- Liste ----- */
  function rafraichirListe() {
    const q = recherche.value.trim().toLowerCase();
    let enfants = DB.enfants();

    if (q) {
      enfants = enfants.filter(function (e) {
        return e.nom_prenom.toLowerCase().indexOf(q) !== -1;
      });
    }

    if (enfants.length === 0) {
      listeEnfants.innerHTML = q
        ? '<p style="color:#888;">Aucun enfant correspondant.</p>'
        : '<p style="color:#888;">Aucun enfant inscrit. Utilisez le formulaire pour en ajouter.</p>';
      return;
    }

    let html =
      '<div class="tableau-enveloppe"><table class="tableau"><thead><tr>' +
      "<th>Enfant</th><th>Âge</th><th>Type</th><th>Sexe</th><th></th></tr></thead><tbody>";

    enfants.slice().reverse().forEach(function (e) {
      const typeLabel = e.type_enfant === "EXTERNE" ? "Externe" : "Interne";
      const typeClass = e.type_enfant === "EXTERNE" ? "badge-orange" : "badge-or";
      const sexeLabel = e.sexe === "M" ? "M" : e.sexe === "F" ? "F" : "—";
      const ageLabel = e.age ? e.age + " ans" : "—";
      html +=
        "<tr><td><strong>" + e.nom_prenom + "</strong></td>" +
        "<td>" + ageLabel + "</td>" +
        '<td><span class="badge ' + typeClass + '">' + typeLabel + "</span></td>" +
        "<td>" + sexeLabel + "</td>" +
        '<td><button class="btn btn-danger btn-petit" data-suppr="' + e.id + '">' +
        (supprEnAttente === e.id ? "Confirmer ?" : "Supprimer") + "</button></td></tr>";
    });

    html += "</tbody></table></div>";
    listeEnfants.innerHTML = html;

    listeEnfants.querySelectorAll("[data-suppr]").forEach(function (b) {
      b.addEventListener("click", function () {
        const id = Number(b.getAttribute("data-suppr"));
        if (supprEnAttente !== id) {
          supprEnAttente = id;
          rafraichirListe();
          UI.toast("Cliquez à nouveau pour confirmer la suppression.", "erreur");
          return;
        }
        supprEnAttente = null;
        const e = DB.enfantParId(id);
        if (e && DB.supprimerEnfant(id)) {
          UI.toast("Enfant supprimé · " + e.nom_prenom, "ok");
        }
        rafraichirListe();
      });
    });
  }

  recherche.addEventListener("input", rafraichirListe);
  rafraichirListe();
})();

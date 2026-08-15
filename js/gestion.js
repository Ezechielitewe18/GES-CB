/* =====================================================
   GES-CB - Page Gestion du personnel
   (ajout de moniteurs / aides-moniteurs, commissions)
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("gestion.html");

  const COMMISSIONS = [
    "Communication",
    "Coordination",
    "Cuisine",
    "Discipline",
    "Enseignement",
    "Finance",
    "Logistique",
    "Loisirs",
    "Médicale",
    "Protocole",
    "Spirituel",
    "Sport",
  ];

  const selRole = document.getElementById("ajout-role");
  const selNom = document.getElementById("ajout-nom");
  const selSexe = document.getElementById("ajout-sexe");
  const selTel = document.getElementById("ajout-tel");
  const selCommission = document.getElementById("ajout-commission");
  const btnAjouter = document.getElementById("btn-ajouter");
  const recapAjout = document.getElementById("recap-ajout");
  const tbody = document.querySelector("#table-personnel tbody");
  const compteur = document.getElementById("compteur-personnel");

  /* Remplir la liste des commissions */
  COMMISSIONS.forEach(function (c) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selCommission.appendChild(opt);
  });

  function validerFormulaire() {
    const nom = selNom.value.trim();
    const role = selRole.value;
    const dejaPresent = DB.moniteurs().some(function (m) {
      return m.role === role && m.nom_prenom.toUpperCase() === nom.toUpperCase();
    });
    if (!nom) {
      UI.toast("Indiquez le nom complet de la personne.", "erreur");
      return null;
    }
    if (dejaPresent) {
      UI.toast("Cette personne (" + role + ") est déjà dans la liste.", "erreur");
      return null;
    }
    return {
      role: role,
      nom_prenom: nom,
      sexe: selSexe.value || "",
      telephone: selTel.value.trim(),
      commission: selCommission.value || "",
    };
  }

  btnAjouter.addEventListener("click", function () {
    const donnees = validerFormulaire();
    if (!donnees) return;
    const m = DB.ajouterPersonnel(donnees);
    recapAjout.classList.add("visible");
    recapAjout.innerHTML =
      '<div class="ligne"><span class="label">Rôle</span><span>' + m.role + "</span></div>" +
      '<div class="ligne"><span class="label">Nom</span><span>' + m.nom_prenom + "</span></div>" +
      '<div class="ligne"><span class="label">Commission</span><span>' + (m.commission || "—") + "</span></div>";
    UI.toast("Ajouté · " + m.role + " · " + m.nom_prenom, "ok");
    selNom.value = "";
    selTel.value = "";
    selSexe.value = "";
    selCommission.value = "";
    rafraichir();
  });

  /* Options de commission pour les menus déroulants du tableau */
  function optionsCommission(actuel) {
    const ops = ['<option value="">—</option>'];
    COMMISSIONS.forEach(function (c) {
      ops.push(
        '<option value="' + c + '"' + (actuel === c ? " selected" : "") + ">" + c + "</option>"
      );
    });
    return ops.join("");
  }

  function lignePersonne(m) {
    const tr = document.createElement("tr");
    const parts = DB.decomposerNom(m.nom_prenom);
    const initials =
      m.initials ||
      (
        (parts.prenom.charAt(0) || "") +
        (parts.nom.charAt(0) || parts.postnom.charAt(0) || "")
      ).toUpperCase();
    const genre = m.sexe === "M" ? "m" : m.sexe === "F" ? "f" : "n";
    const classeAvatar = "avatar avatar-" + genre;
    const roleBadge =
      m.role === "Aide-Moniteur"
        ? '<span class="badge badge-or">Aide</span>'
        : '<span class="badge badge-or">Moniteur</span>';
    tr.innerHTML =
      "<td><span class=\"" + classeAvatar + "\">" + initials + "</span></td>" +
      "<td><strong>" + (m.nom_prenom || "—") + "</strong></td>" +
      "<td>" + roleBadge + "</td>" +
      '<td><span class="sexe-badge sexe-' + genre + '">' + (m.sexe || "—") + "</span></td>" +
      "<td>" + (m.telephone || "—") + "</td>" +
      '<td><select class="select-compact" data-commission="' + m.id + '">' + optionsCommission(m.commission || "") + "</select></td>" +
      '<td><button class="btn-icon" data-supprimer="' + m.id + '" title="Supprimer">' +
      ICONES("trash", 16) + "</button></td>";

    const sel = tr.querySelector("[data-commission]");
    sel.addEventListener("change", function () {
      DB.mettreAJourMoniteur(m.id, { commission: sel.value || "" });
      UI.toast("Commission modifiée · " + m.nom_prenom + " → " + (sel.value || "—"), "ok");
    });

    const btn = tr.querySelector("[data-supprimer]");
    let enAttente = false;
    function etatBouton() {
      btn.innerHTML = enAttente ? "Confirmer ?" : ICONES("trash", 16);
      btn.classList.toggle("confirmer", enAttente);
      btn.title = enAttente
        ? "Cliquer à nouveau pour confirmer la suppression"
        : "Supprimer";
    }
    etatBouton();
    btn.addEventListener("click", function () {
      if (!enAttente) {
        enAttente = true;
        etatBouton();
        setTimeout(function () {
          enAttente = false;
          etatBouton();
        }, 3000);
        return;
      }
      if (DB.supprimerMoniteur(m.id)) {
        UI.toast("Supprimé · " + m.nom_prenom, "ok");
        rafraichir();
      }
    });

    return tr;
  }

  function rafraichir() {
    const liste = DB.moniteurs().slice().sort(function (a, b) {
      if (a.role !== b.role) return a.role === "Moniteur" ? -1 : 1;
      return a.nom_prenom.localeCompare(b.nom_prenom, "fr");
    });
    compteur.textContent = liste.length;

    tbody.innerHTML = "";
    liste.forEach(function (m) {
      tbody.appendChild(lignePersonne(m));
    });
    if (liste.length === 0) {
      tbody.innerHTML =
        '<tr class="ligne-vide"><td colspan="7">Aucun personnel enregistré.</td></tr>';
    }
  }

  rafraichir();
})();

/* =====================================================
   GES-CB - Page Sauvegarde & Restauration
   Sauvegarde : export SQLite (.db) vers téléchargement
   Restauration : re-import d'un fichier .db
   ===================================================== */

(function () {
  if (!AUTH.exigerSession()) return;
  AUTH.verifierAccesPage();
  UI.installerNavbar("sauvegarde.html");

  const CLE_DERNIERE_SAUVEGARDE = "ges_cb_derniere_sauvegarde";

  const btnSauvegarder = document.getElementById("btn-sauvegarder");
  const statutSauvegarde = document.getElementById("statut-sauvegarde");

  const btnChoisir = document.getElementById("btn-choisir-fichier");
  const fichierInput = document.getElementById("fichier-restauration");
  const zoneConfirmation = document.getElementById("zone-confirmation");
  const nomFichierChoisi = document.getElementById("nom-fichier-choisi");
  const btnConfirmer = document.getElementById("btn-confirmer-restauration");
  const btnAnnuler = document.getElementById("btn-annuler-restauration");
  const statutRestauration = document.getElementById("statut-restauration");

  let fichierChoisi = null;

  function rafraichirEtat() {
    document.getElementById("nb-moniteurs").textContent = DB.moniteurs().length;
    document.getElementById("nb-enfants").textContent = DB.enfants().length;
    document.getElementById("nb-visiteurs").textContent = DB.visiteurs().length;
    document.getElementById("nb-mouvements").textContent = DB.mouvements().length;

    const der = localStorage.getItem(CLE_DERNIERE_SAUVEGARDE);
    const info = document.getElementById("info-derniere-sauvegarde");
    if (der) {
      const d = new Date(Number(der));
      info.textContent =
        "Dernière sauvegarde : " + d.toLocaleString("fr-FR");
    } else {
      info.textContent =
        "Aucune sauvegarde effectuée pour l'instant — pensez à sauvegarder chaque soir.";
    }
  }

  /* ----- Sauvegarder ----- */
  btnSauvegarder.addEventListener("click", function () {
    const btn = btnSauvegarder;
    btn.disabled = true;
    statutSauvegarde.textContent = "Génération du fichier…";
    try {
      const nom = SQLITE_EXPORT.telecharger();
      localStorage.setItem(CLE_DERNIERE_SAUVEGARDE, String(Date.now()));
      statutSauvegarde.textContent = "Fichier téléchargé : " + nom;
      UI.toast("Sauvegarde téléchargée", "ok");
      rafraichirEtat();
    } catch (e) {
      statutSauvegarde.style.color = "var(--rouge)";
      statutSauvegarde.textContent = "Échec de la sauvegarde : " + e.message;
    }
    btn.disabled = false;
  });

  /* ----- Restaurer ----- */
  btnChoisir.addEventListener("click", function () {
    fichierInput.click();
  });

  fichierInput.addEventListener("change", function () {
    const f = fichierInput.files && fichierInput.files[0];
    if (!f) return;
    fichierChoisi = f;
    nomFichierChoisi.textContent = f.name + " (" + (f.size / 1024).toFixed(1) + " Ko)";
    statutRestauration.textContent = "";
    statutRestauration.style.color = "var(--rouge)";
    zoneConfirmation.style.display = "block";
  });

  btnAnnuler.addEventListener("click", function () {
    fichierChoisi = null;
    fichierInput.value = "";
    zoneConfirmation.style.display = "none";
  });

  btnConfirmer.addEventListener("click", function () {
    if (!fichierChoisi) return;
    const btn = btnConfirmer;
    btn.disabled = true;
    statutRestauration.textContent = "Restauration en cours…";
    statutRestauration.style.color = "var(--or-clair)";

    SQLITE_IMPORT.restaurerDepuisFichier(fichierChoisi)
      .then(function (resume) {
        statutRestauration.style.color = "var(--vert)";
        statutRestauration.textContent =
          "Restauration réussie : " + resume.moniteurs + " moniteurs, " +
          resume.enfants + " enfants, " + resume.visiteurs + " visiteurs, " +
          resume.mouvements + " mouvements.";
        UI.toast("Données restaurées", "ok");
        zoneConfirmation.style.display = "none";
        fichierChoisi = null;
        fichierInput.value = "";
        rafraichirEtat();
      })
      .catch(function (e) {
        statutRestauration.style.color = "var(--rouge)";
        statutRestauration.textContent = "Échec de la restauration : " + e.message;
        UI.toast("Fichier invalide", "erreur");
      })
      .then(function () {
        btn.disabled = false;
      });
  });

  rafraichirEtat();
})();

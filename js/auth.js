/* =====================================================
   GES-CB - Authentification (compte unique : Tantine Nadicha)
   ===================================================== */

const AUTH = (function () {
  const ROLES = {
    ADMIN: {
      label: "Administrateur",
      pages: [
        "accueil.html",
        "moniteurs.html",
        "aides.html",
        "gestion.html",
        "enfants.html",
        "visiteurs.html",
        "statistiques.html",
        "sauvegarde.html",
      ],
    },
  };

  function essayerConnexion(nom, mdp) {
    const compte = DB.verifierConnexion(nom, mdp);
    if (compte) {
      DB.connecter(compte);
      return compte;
    }
    return null;
  }

  function pageCourante() {
    const nom = window.location.pathname.split("/").pop() || "index.html";
    return nom;
  }

  /* Redirige vers index.html si personne n'est connecte */
  function exigerSession() {
    if (!DB.estConnecte()) {
      window.location.replace("index.html");
      return false;
    }
    return true;
  }

  /* Verifie que la page est accessible (toutes le sont pour le compte unique) */
  function verifierAccesPage() {
    if (!DB.estConnecte()) {
      window.location.replace("index.html");
      return false;
    }
    return true;
  }

  function seDeconnecter() {
    DB.deconnecter();
    window.location.replace("index.html");
  }

  return {
    ROLES,
    essayerConnexion,
    exigerSession,
    verifierAccesPage,
    seDeconnecter,
  };
})();

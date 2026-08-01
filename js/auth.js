/* =====================================================
   GES-CB - Authentification et contrôle des rôles
   ===================================================== */

const AUTH = (function () {
  const ROLES = {
    ADMIN: {
      label: "Administrateur",
      pages: ["accueil.html", "moniteurs.html", "enfants.html", "visiteurs.html"],
    },
    SUPER_ADMIN: {
      label: "Super Administrateur",
      pages: ["accueil.html", "statistiques.html"],
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

  /* Verifie que le role connecte peut acceder a la page courante */
  function verifierAccesPage() {
    const role = DB.roleActuel();
    const page = pageCourante();
    if (!role) {
      window.location.replace("index.html");
      return false;
    }
    const pagesAutorisees = ROLES[role].pages;
    if (!pagesAutorisees.includes(page)) {
      window.location.replace("accueil.html");
      return false;
    }
    return true;
  }

  function estSuperAdmin() {
    return DB.roleActuel() === "SUPER_ADMIN";
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
    estSuperAdmin,
    seDeconnecter,
  };
})();

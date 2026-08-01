/* =====================================================
   GES-CB - Couche de données partagée (localStorage)
   ===================================================== */

const DB = (function () {
  const VERSION = 4;
  const CLE_VERSION = "ges_cb_version";

  const CLES = {
    moniteurs: "ges_cb_moniteurs",
    enfants: "ges_cb_enfants",
    visiteurs: "ges_cb_visiteurs",
    mouvements: "ges_cb_mouvements",
    session: "ges_cb_session",
  };

  /* ----- Utilitaires ----- */
  function lire(cle, defaut) {
    try {
      const brut = localStorage.getItem(cle);
      return brut ? JSON.parse(brut) : defaut;
    } catch (e) {
      return defaut;
    }
  }

  function ecrire(cle, valeur) {
    localStorage.setItem(cle, JSON.stringify(valeur));
  }

  function maintenant() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      heure: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    };
  }

  function prochainId(items) {
    return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
  }

  /* ----- Comptes de connexion ----- */
  const COMPTES = {
    admin: {
      nom: "Tantine Nadicha Minga",
      motDePasse: "Camp26",
      role: "ADMIN",
    },
    superAdmin: {
      nom: "Tonton Israel Salumu",
      motDePasse: "Camp123",
      role: "SUPER_ADMIN",
    },
  };

  function verifierConnexion(nom, mdp) {
    const c = Object.values(COMPTES).find(
      (compte) =>
        compte.nom.toUpperCase() === nom.toUpperCase() &&
        compte.motDePasse === mdp
    );
    return c
      ? { nom: c.nom, role: c.role, dateConnexion: new Date().toISOString() }
      : null;
  }

  /* ----- Session ----- */
  function session() {
    return lire(CLES.session, null);
  }

  function connecter(sessionData) {
    ecrire(CLES.session, sessionData);
  }

  function deconnecter() {
    localStorage.removeItem(CLES.session);
  }

  function estConnecte() {
    return !!session();
  }

  function roleActuel() {
    const s = session();
    return s ? s.role : null;
  }

  function nomActuel() {
    const s = session();
    return s ? s.nom : "";
  }

  /* ----- Moniteurs ----- */
  function moniteurs() {
    return lire(CLES.moniteurs, []);
  }

  function sauverMoniteurs(liste) {
    ecrire(CLES.moniteurs, liste);
  }

  function moniteurParId(id) {
    return moniteurs().find((m) => m.id === id);
  }

  function mettreAJourMoniteur(id, patch) {
    const liste = moniteurs();
    const i = liste.findIndex((m) => m.id === id);
    if (i >= 0) {
      liste[i] = Object.assign({}, liste[i], patch);
      sauverMoniteurs(liste);
    }
  }

  function ajouterMoniteur(donnees) {
    const liste = moniteurs();
    const m = Object.assign(
      { id: prochainId(liste), statut: "PRESENT" },
      donnees
    );
    liste.push(m);
    sauverMoniteurs(liste);
    return m;
  }

  /* ----- Enfants ----- */
  function enfants() {
    return lire(CLES.enfants, []);
  }

  function sauverEnfants(liste) {
    ecrire(CLES.enfants, liste);
  }

  function enfantParId(id) {
    return enfants().find((e) => e.id === id);
  }

  function mettreAJourEnfant(id, patch) {
    const liste = enfants();
    const i = liste.findIndex((e) => e.id === id);
    if (i >= 0) {
      liste[i] = Object.assign({}, liste[i], patch);
      sauverEnfants(liste);
    }
  }

  function ajouterEnfant(donnees) {
    const liste = enfants();
    const main = maintenant();
    const e = Object.assign(
      {
        id: prochainId(liste),
        statut: "PRESENT",
        date_creation: main.date,
      },
      donnees
    );
    liste.push(e);
    sauverEnfants(liste);
    return e;
  }

  /* ----- Visiteurs ----- */
  function visiteurs() {
    return lire(CLES.visiteurs, []);
  }

  function sauverVisiteurs(liste) {
    ecrire(CLES.visiteurs, liste);
  }

  function visiteurParId(id) {
    return visiteurs().find((v) => v.id === id);
  }

  function mettreAJourVisiteur(id, patch) {
    const liste = visiteurs();
    const i = liste.findIndex((v) => v.id === id);
    if (i >= 0) {
      liste[i] = Object.assign({}, liste[i], patch);
      sauverVisiteurs(liste);
    }
  }

  function ajouterVisiteur(donnees) {
    const liste = visiteurs();
    const v = Object.assign(
      { id: prochainId(liste), statut: "SUR_SITE" },
      donnees
    );
    liste.push(v);
    sauverVisiteurs(liste);
    return v;
  }

  /* ----- Historique des mouvements ----- */
  function mouvements() {
    return lire(CLES.mouvements, []);
  }

  function sauverMouvements(liste) {
    ecrire(CLES.mouvements, liste);
  }

  function ajouterMouvement(donnees) {
    const liste = mouvements();
    const main = maintenant();
    const mv = Object.assign(
      {
        id: prochainId(liste),
        date_mouvement: main.date,
        heure_mouvement: main.heure,
        agent_accueil: nomActuel(),
      },
      donnees
    );
    liste.push(mv);
    sauverMouvements(liste);
    return mv;
  }

  function mouvementsPersonne(typeProfil, personneId) {
    return mouvements().filter(
      (m) => m.type_profil === typeProfil && m.personne_id === personneId
    );
  }

  function derniersMouvementsDuJour() {
    const auj = maintenant().date;
    return mouvements().filter((m) => m.date_mouvement === auj);
  }

  /* ----- Liste des personnes actuellement DEHORS ----- */
  function personnesDehors() {
    const liste = [];
    moniteurs()
      .filter((m) => m.statut === "DEHORS")
      .forEach((m) => liste.push({ type_profil: "MONITEUR", personne: m }));

    enfants()
      .filter((e) => e.statut === "DEHORS")
      .forEach((e) => liste.push({ type_profil: "ENFANT", personne: e }));

    visiteurs()
      .filter((v) => v.statut === "PARTI")
      .forEach((v) => liste.push({ type_profil: "VISITEUR", personne: v }));

    // Associer le dernier mouvement SORTIE pour motif + heure de sortie
    return liste.map((item) => {
      const hist = mouvements()
        .filter(
          (m) =>
            m.type_profil === item.type_profil &&
            m.personne_id === item.personne.id &&
            m.type_action === "SORTIE"
        )
        .pop();
      return {
        type_profil: item.type_profil,
        personne: item.personne,
        sortie: hist || null,
      };
    });
  }

  function dureeSortie(debutHeure) {
    const [h, m, s] = debutHeure.split(":").map(Number);
    const debut = h * 3600 + m * 60 + s;
    const main = maintenant().heure.split(":").map(Number);
    const fin = main[0] * 3600 + main[1] * 60 + main[2];
    const ecart = fin - debut;
    return ecart < 0 ? 0 : ecart;
  }

  function formaterDuree(secondes) {
    const h = Math.floor(secondes / 3600);
    const m = Math.floor((secondes % 3600) / 60);
    if (h <= 0) return `${m} min`;
    return `${h}h${String(m).padStart(2, "0")}`;
  }

  /* ----- Seuil alerte sortie longue (idee 2) ----- */
  const SEUIL_ALERTE_SEC = 3 * 3600; // 3 heures

  /* ----- Psaumes du jour (courage pour l'agent de porte) ----- */
  const PSAUMES = [
    { reference: "Psaume 23:1", texte: "L'Éternel est mon berger : je ne manquerai de rien." },
    { reference: "Psaume 46:2", texte: "Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse." },
    { reference: "Psaume 121:1-2", texte: "Je lève mes yeux vers les montagnes... D'où me viendra le secours ? Le secours me vient de l'Éternel, qui a fait les cieux et la terre." },
    { reference: "Psaume 28:7", texte: "L'Éternel est ma force et mon bouclier ; en lui mon cœur se confie, et je suis secouru." },
    { reference: "Psaume 55:23", texte: "Décharge ton fardeau sur l'Éternel, et il te soutiendra." },
    { reference: "Psaume 91:1", texte: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant." },
    { reference: "Psaume 34:19", texte: "L'Éternel est près de ceux qui ont le cœur brisé, et il sauve ceux qui ont l'esprit dans l'abattement." },
    { reference: "Psaume 121:8", texte: "L'Éternel garde ton départ et ton arrivée, dès maintenant et à jamais." },
    { reference: "Psaume 62:6", texte: "Oui, c'est en Dieu que mon âme se confie ; de lui vient mon espérance." },
    { reference: "Psaume 27:1", texte: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?" },
    { reference: "Psaume 46:11", texte: "Arrêtez, et sachez que je suis Dieu." },
    { reference: "Psaume 145:18", texte: "L'Éternel est près de tous ceux qui l'invoquent, de tous ceux qui l'invoquent avec sincérité." },
  ];

  /* Psaume du jour : change chaque jour, stable dans la journee */
  function psaumeDuJour() {
    const auj = maintenant().date;
    const cle = "ges_cb_psaume";
    try {
      const stocke = JSON.parse(localStorage.getItem(cle));
      if (stocke && stocke.date === auj) return stocke;
    } catch (e) {
      /* ignore */
    }
    const p = PSAUMES[Math.floor(Math.random() * PSAUMES.length)];
    const val = { date: auj, texte: p.texte, reference: p.reference };
    localStorage.setItem(cle, JSON.stringify(val));
    return val;
  }

  /* ----- Initialisation : liste des moniteurs et enfants VIDE -----
     (les noms seront fournis par la direction) */
  function initialiser() {
    if (localStorage.getItem(CLE_VERSION) !== String(VERSION)) {
      Object.values(CLES).forEach(function (c) {
        localStorage.removeItem(c);
      });
      localStorage.setItem(CLE_VERSION, String(VERSION));
    }

    if (!localStorage.getItem(CLES.moniteurs)) {
      sauverMoniteurs([
        { id: 1, nom_prenom: "Tegra Beloko", initials: "TB", role: "Moniteur", statut: "PRESENT" },
        { id: 2, nom_prenom: "Plamedie Beloko", initials: "PB", role: "Moniteur", statut: "PRESENT" },
        { id: 3, nom_prenom: "Divine Bangweno", initials: "DB", role: "Aide-Moniteur", statut: "PRESENT" },
        { id: 4, nom_prenom: "Alistair Minga", initials: "AM", role: "Moniteur", statut: "PRESENT" },
        { id: 5, nom_prenom: "Celina Amboko", initials: "CA", role: "Moniteur", statut: "PRESENT" },
        { id: 6, nom_prenom: "Richesse Maniala", initials: "RM", role: "Aide-Moniteur", statut: "PRESENT" },
        { id: 7, nom_prenom: "Mirac Tambwe", initials: "MT", role: "Aide-Moniteur", statut: "PRESENT" },
        { id: 8, nom_prenom: "Emmanuel Wandja", initials: "EW", role: "Aide-Moniteur", statut: "PRESENT" },
        { id: 9, nom_prenom: "Voldis Loyko", initials: "VL", role: "Moniteur", statut: "PRESENT" },
        { id: 10, nom_prenom: "Exauce Bolingo", initials: "EB", role: "Moniteur", statut: "PRESENT" },
      ]);
    }
    if (!localStorage.getItem(CLES.enfants)) sauverEnfants([]);
    if (!localStorage.getItem(CLES.visiteurs)) sauverVisiteurs([]);
    if (!localStorage.getItem(CLES.mouvements)) sauverMouvements([]);
  }

  function reinitialiserTout() {
    Object.values(CLES).forEach((c) => localStorage.removeItem(c));
    initialiser();
  }

  return {
    CLES,
    COMPTES,
    verifierConnexion,
    session,
    connecter,
    deconnecter,
    estConnecte,
    roleActuel,
    nomActuel,
    moniteurs,
    moniteurParId,
    mettreAJourMoniteur,
    ajouterMoniteur,
    enfants,
    enfantParId,
    mettreAJourEnfant,
    ajouterEnfant,
    visiteurs,
    visiteurParId,
    mettreAJourVisiteur,
    ajouterVisiteur,
    mouvements,
    ajouterMouvement,
    mouvementsPersonne,
    derniersMouvementsDuJour,
    personnesDehors,
    dureeSortie,
    formaterDuree,
    SEUIL_ALERTE_SEC,
    PSAUMES,
    psaumeDuJour,
    initialiser,
    reinitialiserTout,
  };
})();

DB.initialiser();

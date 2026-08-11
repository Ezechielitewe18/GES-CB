/* =====================================================
   GES-CB - Couche de données partagée (localStorage)
   ===================================================== */

const DB = (function () {
  const VERSION = 6;
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

  function mouvementsParDate(date) {
    return mouvements().filter((m) => m.date_mouvement === date);
  }

  function datesMouvements() {
    const uniques = {};
    mouvements().forEach(function (m) {
      uniques[m.date_mouvement] = true;
    });
    return Object.keys(uniques).sort().reverse();
  }

  /* ----- Annulation / correction d'une saisie ----- */
  function supprimerMouvement(id) {
    const liste = mouvements();
    const garde = liste.filter((m) => m.id !== id);
    sauverMouvements(garde);
  }

  /* Rejoue les mouvements (par date, heure, id) pour recalculer le statut */
  function rejouerStatut(typeProfil, personneId) {
    const hist = mouvements()
      .filter((m) => m.type_profil === typeProfil && m.personne_id === personneId)
      .sort(function (a, b) {
        const da = a.date_mouvement + " " + a.heure_mouvement;
        const db = b.date_mouvement + " " + b.heure_mouvement;
        if (da === db) return (a.id || 0) - (b.id || 0);
        return da < db ? -1 : 1;
      });
    const dernier = hist[hist.length - 1];
    const estSortie = dernier && dernier.type_action === "SORTIE";

    if (typeProfil === "MONITEUR") {
      mettreAJourMoniteur(personneId, { statut: estSortie ? "DEHORS" : "PRESENT" });
    } else if (typeProfil === "ENFANT") {
      mettreAJourEnfant(personneId, { statut: estSortie ? "DEHORS" : "PRESENT" });
    } else if (typeProfil === "VISITEUR") {
      mettreAJourVisiteur(personneId, { statut: estSortie ? "PARTI" : "SUR_SITE" });
    }
  }

  /* Annule un mouvement : le supprime puis recale le statut de la personne.
     Renvoie le mouvement annulé (ou null). */
  function annulerMouvement(id) {
    const liste = mouvements();
    const m = liste.find((x) => x.id === id);
    if (!m) return null;
    supprimerMouvement(id);
    rejouerStatut(m.type_profil, m.personne_id);
    return m;
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

  /* ----- Liste définitive des MONITEURS (fournie par la direction) ----- */
  const MONITEURS_BASE = [
    { nom_prenom: "Alistair MINGA SHANGA", sexe: "M", telephone: "0817892936", commission: "Communication" },
    { nom_prenom: "Anael BUANDA SUKADI", sexe: "F", telephone: "0906354770", commission: "Protocole" },
    { nom_prenom: "Angélique NTUMBA KABITAMBISHI", sexe: "F", telephone: "0840387988", commission: "Enseignement" },
    { nom_prenom: "Anne SHIMBA NGOY", sexe: "F", telephone: "", commission: "Enseignement" },
    { nom_prenom: "Arnold MUTOMBO KADIMA", sexe: "M", telephone: "0819360012", commission: "Sport" },
    { nom_prenom: "Benedicte BOLINGO BOFEKO", sexe: "F", telephone: "0826404493", commission: "Cuisine" },
    { nom_prenom: "Benel KASONGA MASENGU", sexe: "F", telephone: "0828383336", commission: "Sport" },
    { nom_prenom: "Bénie KATULANSONI MAYA", sexe: "F", telephone: "0815406115", commission: "Loisirs" },
    { nom_prenom: "Bérénice KABULO MUKANDA", sexe: "F", telephone: "0812963415", commission: "Enseignement" },
    { nom_prenom: "Bodmie MPANYA KAZADI", sexe: "F", telephone: "0812849538", commission: "Spirituel" },
    { nom_prenom: "Cécile KINGUNA MUKETER", sexe: "F", telephone: "0813793284", commission: "" },
    { nom_prenom: "Christelle MAKWABALA", sexe: "F", telephone: "0998656577", commission: "Coordination" },
    { nom_prenom: "Christian KILULA KONDO", sexe: "M", telephone: "0841537757", commission: "Discipline" },
    { nom_prenom: "Christian NGOYI", sexe: "M", telephone: "", commission: "Protocole" },
    { nom_prenom: "Claudette PELENGE MINGA", sexe: "F", telephone: "0815157256", commission: "Médicale" },
    { nom_prenom: "Claudine DIASONAMA", sexe: "F", telephone: "0816516312", commission: "" },
    { nom_prenom: "Consel SUAMUNU BASADILA", sexe: "F", telephone: "0856236132", commission: "Cuisine" },
    { nom_prenom: "Deborah MBUAYA ILUNGA", sexe: "F", telephone: "0812948180", commission: "" },
    { nom_prenom: "Defi MUSHENI MANZIMI", sexe: "F", telephone: "0998608776", commission: "Protocole" },
    { nom_prenom: "Diamante BUBIONGO NSUKU", sexe: "F", telephone: "0843475646", commission: "Protocole" },
    { nom_prenom: "Difi SAIDI", sexe: "F", telephone: "0894253885", commission: "Cuisine" },
    { nom_prenom: "Divin BASILWANGO", sexe: "M", telephone: "", commission: "Logistique" },
    { nom_prenom: "Divine BANGWENO MUMIE", sexe: "F", telephone: "0990851607", commission: "" },
    { nom_prenom: "Divine NKOMBO BEYANA", sexe: "F", telephone: "0814451070", commission: "" },
    { nom_prenom: "Eliezer MUTSHI MANDE", sexe: "M", telephone: "0818571738", commission: "Spirituel" },
    { nom_prenom: "Elise MANGENZI TELA", sexe: "F", telephone: "", commission: "Cuisine" },
    { nom_prenom: "Emmanuel WANJA WAMPE", sexe: "M", telephone: "0839333714", commission: "Logistique" },
    { nom_prenom: "Esperance", sexe: "F", telephone: "0853719093", commission: "" },
    { nom_prenom: "Esperance NKULU MALOBA", sexe: "F", telephone: "0814734608", commission: "" },
    { nom_prenom: "Esther KALUBI KADIMA", sexe: "F", telephone: "0828757540", commission: "Protocole" },
    { nom_prenom: "Esther SHIMBA MWEMA", sexe: "F", telephone: "0998101623", commission: "Enseignement" },
    { nom_prenom: "Eunice KAYOWA MANDA", sexe: "F", telephone: "0832711390", commission: "Protocole" },
    { nom_prenom: "Exauce BOLINGO MPUTU", sexe: "M", telephone: "0823939556", commission: "Logistique" },
    { nom_prenom: "Exauce BULENGHA LUKASU", sexe: "M", telephone: "0820988740", commission: "Protocole" },
    { nom_prenom: "Fanny MUTEMBA IRUNG", sexe: "F", telephone: "0810827401", commission: "" },
    { nom_prenom: "Florence MAMPENDO NGOMBOLO", sexe: "F", telephone: "0810851960", commission: "" },
    { nom_prenom: "François MUKANDILA BEYA", sexe: "M", telephone: "0899574304", commission: "Communication" },
    { nom_prenom: "Gabriella", sexe: "F", telephone: "0895923903", commission: "" },
    { nom_prenom: "Gauthier MPIANA MINGA", sexe: "M", telephone: "0820078266", commission: "Enseignement" },
    { nom_prenom: "Gisele", sexe: "F", telephone: "", commission: "" },
    { nom_prenom: "Ida LOKONI NYANZANGO", sexe: "F", telephone: "0999987740", commission: "Enseignement" },
    { nom_prenom: "Irene KASENGELA KAZADI", sexe: "F", telephone: "0999335053", commission: "Discipline" },
    { nom_prenom: "Israël KONDO NKUNKU", sexe: "M", telephone: "0822422990", commission: "Loisirs" },
    { nom_prenom: "Israël SALUMU BIRINGANINE", sexe: "M", telephone: "0826259538", commission: "Coordination" },
    { nom_prenom: "Jack NKONKWE MBAYO", sexe: "M", telephone: "0978119169", commission: "Protocole" },
    { nom_prenom: "Jedidja KAMWANYA MASEVO", sexe: "F", telephone: "0982751545", commission: "Protocole" },
    { nom_prenom: "Jemima MPAMBU MBUZI", sexe: "F", telephone: "0848687079", commission: "" },
    { nom_prenom: "Jessyca BUSHA ANTUIL", sexe: "F", telephone: "0814584762", commission: "Communication" },
    { nom_prenom: "Jocelyne KAKUDJI KISULA", sexe: "F", telephone: "0822854669", commission: "Loisirs" },
    { nom_prenom: "Joella MUANDA MATONDO", sexe: "F", telephone: "0817466117", commission: "Protocole" },
    { nom_prenom: "Joseph LUBOYA LUNGONZO", sexe: "M", telephone: "0822805616", commission: "Cuisine" },
    { nom_prenom: "Josué TSHULA OKOMA", sexe: "M", telephone: "0854342690", commission: "Logistique" },
    { nom_prenom: "Joy TSHITOKO N'ZITA", sexe: "M", telephone: "0830438374", commission: "Logistique" },
    { nom_prenom: "Lorsel MOTEADE MONINGA", sexe: "F", telephone: "0974208637", commission: "Loisirs" },
    { nom_prenom: "Mamie IKIESE SAKABENI", sexe: "F", telephone: "0814676604", commission: "" },
    { nom_prenom: "Manassé TSHITOKO MINGA", sexe: "M", telephone: "0825483876", commission: "" },
    { nom_prenom: "Marie Céline AMBOKO VIVUYA", sexe: "F", telephone: "0893690151", commission: "Loisirs" },
    { nom_prenom: "Marie-Claver KUNUMANA PWA", sexe: "F", telephone: "0818364469", commission: "Cuisine" },
    { nom_prenom: "Marthe", sexe: "F", telephone: "0982646225", commission: "" },
    { nom_prenom: "Matthieu LUAPANYA MULUNGU", sexe: "M", telephone: "0821357747", commission: "" },
    { nom_prenom: "Merveille BOMOLO BONTSUTSU", sexe: "M", telephone: "0833097960", commission: "Cuisine" },
    { nom_prenom: "Mirvi BUDIONGO NSILULU", sexe: "M", telephone: "0994207248", commission: "Communication" },
    { nom_prenom: "Modestie TEDIKA NSIMBA", sexe: "M", telephone: "0819792870", commission: "" },
    { nom_prenom: "Moise KANDOLO", sexe: "M", telephone: "0816915114", commission: "" },
    { nom_prenom: "Nadicha MUSUAMBA MINGA", sexe: "F", telephone: "0820142656", commission: "Protocole" },
    { nom_prenom: "Nancy MUJIKE", sexe: "F", telephone: "0811827556", commission: "Cuisine" },
    { nom_prenom: "Nella KIFULUKA TOSHA Léa", sexe: "F", telephone: "0812195812", commission: "Médicale" },
    { nom_prenom: "Noémie NDALAMBA", sexe: "F", telephone: "", commission: "" },
    { nom_prenom: "Patrick KAMBAMBA", sexe: "M", telephone: "", commission: "" },
    { nom_prenom: "Pierre UTSHUDI NKOY", sexe: "M", telephone: "0999987740", commission: "" },
    { nom_prenom: "Plamedi BELOKO LESENGE", sexe: "F", telephone: "0976741536", commission: "Loisirs" },
    { nom_prenom: "Prisca KALULA", sexe: "F", telephone: "0811263235", commission: "" },
    { nom_prenom: "Rami TAMBWE", sexe: "F", telephone: "0819983240", commission: "Cuisine" },
    { nom_prenom: "Richesse MANIALA MUKANDILA", sexe: "M", telephone: "0812570212", commission: "Logistique" },
    { nom_prenom: "Rose MUZALIWA N'ANCHA", sexe: "F", telephone: "0828706024", commission: "Finance" },
    { nom_prenom: "Shaloom MALALA", sexe: "M", telephone: "0829999262", commission: "Coordination" },
    { nom_prenom: "Tegra BELOKO N'KIRAWE", sexe: "M", telephone: "0990657869", commission: "Spirituel" },
    { nom_prenom: "Thomas BANDUKA PANZU", sexe: "M", telephone: "0826305861", commission: "Cuisine" },
    { nom_prenom: "Voldis LOYKO WA LOYKO", sexe: "M", telephone: "0814981388", commission: "Communication" },
  ];

  /* ----- Liste définitive des AIDES-MONITEURS (fournie par la direction) -----
     Seuls les noms ont été fournis : téléphone et commission restent vides. */
  const AIDES_BASE = [
    { nom_prenom: "Angela OLEKO ANDJENGA", sexe: "F" },
    { nom_prenom: "Bliss-Grace WANDJA MILOMBA", sexe: "F" },
    { nom_prenom: "Defi NSILULU", sexe: "F" },
    { nom_prenom: "Diadème BIDIONGO PELENGE", sexe: "F" },
    { nom_prenom: "Diffa KATUNA", sexe: "F" },
    { nom_prenom: "Dorcas DINA MULAJI", sexe: "F" },
    { nom_prenom: "Elie BOPOLO", sexe: "M" },
    { nom_prenom: "Elvicia MUSHENI BASHILE", sexe: "F" },
    { nom_prenom: "Enosu MASTHIK KAZADI", sexe: "F" },
    { nom_prenom: "Eunice NGONGA", sexe: "F" },
    { nom_prenom: "Ezechiel ITEWE", sexe: "M" },
    { nom_prenom: "Exauce ANTWISI", sexe: "M" },
    { nom_prenom: "Gloria MAGAZINI", sexe: "F" },
    { nom_prenom: "Jes'Dani AWAZI", sexe: "M" },
    { nom_prenom: "Jes'Oli AWAZI", sexe: "M" },
    { nom_prenom: "Jessica ANGUMO", sexe: "F" },
    { nom_prenom: "Joyce BOLENGE BAKINI", sexe: "F" },
    { nom_prenom: "Ketsia KATUNA ITUN", sexe: "F" },
    { nom_prenom: "Leslie LUZIBU LUAMPANYA", sexe: "F" },
    { nom_prenom: "Merveille ILANGI", sexe: "F" },
    { nom_prenom: "Michael BASILWANGO", sexe: "M" },
    { nom_prenom: "Mirac NTAMBWE", sexe: "F" },
    { nom_prenom: "Neoma MULIELE", sexe: "F" },
    { nom_prenom: "Paul MULAJI", sexe: "M" },
    { nom_prenom: "Perle TSHIBUABUA TSHIBUABUA", sexe: "F" },
    { nom_prenom: "Plamedi BILA", sexe: "F" },
    { nom_prenom: "Plamedi NGALULA", sexe: "F" },
    { nom_prenom: "Richesse KAZADI", sexe: "M" },
    { nom_prenom: "Ruth OMOYI DJONGA", sexe: "F" },
    { nom_prenom: "Serdia MALU BELOKO", sexe: "F" },
  ];

  /* Initiales = première lettre du prénom + première lettre du nom (dernier mot) */
  function initialesDe(nom) {
    const mots = nom.trim().split(/\s+/);
    const debut = mots[0].charAt(0);
    const fin = mots[mots.length - 1].charAt(0);
    return (debut + fin).toUpperCase();
  }

  /* Décomposition "Prénom NOM POSTNOM" -> { prenom, nom, postnom }
     Règle : les mots en MAJUSCULES sont le nom puis le post-nom. */
  function decomposerNom(nomPrenom) {
    const mots = (nomPrenom || "").trim().split(/\s+/);
    const debutNom = mots.findIndex(function (m) {
      return /[A-ZÀ-Ý]/.test(m) && !/[a-zà-ÿ]/.test(m);
    });
    if (debutNom === -1) {
      return { prenom: mots.join(" "), nom: "", postnom: "" };
    }
    return {
      prenom: mots.slice(0, debutNom).join(" "),
      nom: mots[debutNom] || "",
      postnom: mots.slice(debutNom + 1).join(" "),
    };
  }

  /* ----- Initialisation : liste définitive des moniteurs ----- */
  function initialiser() {
    if (localStorage.getItem(CLE_VERSION) !== String(VERSION)) {
      Object.values(CLES).forEach(function (c) {
        localStorage.removeItem(c);
      });
      localStorage.setItem(CLE_VERSION, String(VERSION));
    }

    if (!localStorage.getItem(CLES.moniteurs)) {
      const liste = MONITEURS_BASE.map(function (m, i) {
        return {
          id: i + 1,
          nom_prenom: m.nom_prenom,
          initials: initialesDe(m.nom_prenom),
          role: "Moniteur",
          statut: "PRESENT",
          sexe: m.sexe,
          telephone: m.telephone,
          commission: m.commission,
        };
      });
      sauverMoniteurs(liste);
    }

    /* Fusion non destructive des aides-moniteurs (ajoute ceux qui manquent) */
    const listeMoniteurs = lire(CLES.moniteurs, []);
    const presents = {};
    listeMoniteurs.forEach(function (m) {
      presents[m.role + "|" + m.nom_prenom] = true;
    });
    let maxId = listeMoniteurs.length
      ? Math.max(...listeMoniteurs.map(function (i) { return i.id; }))
      : 0;
    let aChange = false;
    AIDES_BASE.forEach(function (a) {
      if (presents["Aide-Moniteur|" + a.nom_prenom]) return;
      maxId += 1;
      listeMoniteurs.push({
        id: maxId,
        nom_prenom: a.nom_prenom,
        initials: initialesDe(a.nom_prenom),
        role: "Aide-Moniteur",
        statut: "PRESENT",
        sexe: a.sexe,
        telephone: a.telephone || "",
        commission: a.commission || "",
      });
      aChange = true;
    });
    if (aChange) sauverMoniteurs(listeMoniteurs);

    if (!localStorage.getItem(CLES.enfants)) sauverEnfants([]);
    if (!localStorage.getItem(CLES.visiteurs)) sauverVisiteurs([]);
    if (!localStorage.getItem(CLES.mouvements)) sauverMouvements([]);
  }

  function reinitialiserTout() {
    Object.values(CLES).forEach((c) => localStorage.removeItem(c));
    initialiser();
  }

  /* Restaure les collections depuis des données importées (.db) */
  function restaurer(donnees) {
    const ok =
      donnees &&
      Array.isArray(donnees.moniteurs) &&
      Array.isArray(donnees.enfants) &&
      Array.isArray(donnees.visiteurs) &&
      Array.isArray(donnees.mouvements);
    if (!ok) throw new Error("Fichier invalide");
    sauverMoniteurs(donnees.moniteurs);
    sauverEnfants(donnees.enfants);
    sauverVisiteurs(donnees.visiteurs);
    sauverMouvements(donnees.mouvements);
    return {
      moniteurs: donnees.moniteurs.length,
      enfants: donnees.enfants.length,
      visiteurs: donnees.visiteurs.length,
      mouvements: donnees.mouvements.length,
    };
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
    mouvementsParDate,
    datesMouvements,
    annulerMouvement,
    supprimerMouvement,
    personnesDehors,
    dureeSortie,
    formaterDuree,
    SEUIL_ALERTE_SEC,
    PSAUMES,
    psaumeDuJour,
    initialiser,
    reinitialiserTout,
    restaurer,
    decomposerNom,
  };
})();

DB.initialiser();

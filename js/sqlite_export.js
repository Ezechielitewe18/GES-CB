/* =====================================================
   GES-CB - Export SQLite (.db)
   Génère un VRAI fichier SQLite (format binaire) en pur
   JavaScript, sans dépendance ni internet. Ouvrable avec
   DB Browser for SQLite / python sqlite3 / etc.
   ===================================================== */

const SQLITE_EXPORT = (function () {
  const PAGE_SIZE = 4096;

  /* ----- Encodage varint SQLite (base 128, big-endian) ----- */
  function encodVarint(v) {
    const out = [v & 0x7F];
    let n = Math.floor(v / 128);
    while (n > 0) {
      out.push((n & 0x7F) | 0x80);
      n = Math.floor(n / 128);
    }
    out.reverse();
    return out;
  }

  /* ----- Entier non signé big-endian ----- */
  function intBE(v, n) {
    const out = [];
    let x = v;
    for (let i = n - 1; i >= 0; i--) {
      out[i] = x & 0xFF;
      x = Math.floor(x / 256);
    }
    return out;
  }

  /* ----- Type de série + octets d'une valeur ----- */
  function typeEtValeur(v) {
    if (v === null || v === undefined) return { t: 0, b: [] };
    if (typeof v === "number") {
      if (Number.isInteger(v)) {
        if (v >= -128 && v <= 127) return { t: 1, b: [v & 0xFF] };
        if (v >= -32768 && v <= 32767) return { t: 2, b: intBE(v, 2) };
        if (v >= -8388608 && v <= 8388607) return { t: 3, b: intBE(v, 3) };
        if (v >= -2147483648 && v <= 2147483647) return { t: 4, b: intBE(v, 4) };
        if (v >= -140737488355328 && v <= 140737488355327) {
          return { t: 5, b: intBE(v, 6) };
        }
        return { t: 6, b: intBE(v, 8) };
      }
      const buf = new ArrayBuffer(8);
      new DataView(buf).setFloat64(0, v, false);
      return { t: 7, b: Array.prototype.slice.call(new Uint8Array(buf)) };
    }
    if (typeof v === "string") {
      const enc = new TextEncoder().encode(v);
      return { t: 13 + enc.length * 2, b: Array.prototype.slice.call(enc) };
    }
    return typeEtValeur(v ? 1 : 0);
  }

  /* ----- Enregistrement (record) ----- */
  function enregistrement(colonnes) {
    const types = [];
    const corps = [];
    colonnes.forEach(function (v) {
      const tv = typeEtValeur(v);
      types.push(tv.t);
      tv.b.forEach(function (o) { corps.push(o); });
    });

    const typesEnc = types.map(encodVarint);
    let somme = 0;
    typesEnc.forEach(function (t) { somme += t.length; });

    // La taille du header inclut son propre varint : itérer jusqu'à stabilité
    let headerSize = 1 + somme;
    let hs = encodVarint(headerSize);
    while (hs.length + somme !== headerSize) {
      headerSize = hs.length + somme;
      hs = encodVarint(headerSize);
    }

    const header = hs.concat.apply(hs, typesEnc);
    return header.concat(corps);
  }

  /* ----- Cellule table leaf (payload + rowid) ----- */
  function cellule(rowid, payload) {
    return encodVarint(payload.length).concat(encodVarint(rowid), payload);
  }

  /* ----- Page B-tree table leaf ----- */
  function pageLeaf(headerLen, cellules) {
    const page = new Uint8Array(PAGE_SIZE);
    const n = cellules.length;

    // On remplit les cellules depuis la fin de la page
    let curseur = PAGE_SIZE;
    const offsets = [];
    for (let i = 0; i < n; i++) {
      const c = cellules[i].octets || cellules[i];
      curseur -= c.length;
      offsets[i] = curseur;
      c.forEach(function (o, k) {
        page[curseur + k] = o;
      });
    }

    // Le content start pointe vers la première cellule (offset le plus bas)
    const contentStart = n > 0 ? Math.min.apply(Math, offsets) : PAGE_SIZE;

    page[headerLen] = 13; // table leaf
    page[headerLen + 1] = 0; // premier freeblock (haut)
    page[headerLen + 2] = 0; // premier freeblock (bas)
    page[headerLen + 3] = (n >> 8) & 0xFF; // nb de cellules
    page[headerLen + 4] = n & 0xFF;
    page[headerLen + 5] = (contentStart >> 8) & 0xFF; // offset du contenu
    page[headerLen + 6] = contentStart & 0xFF;
    page[headerLen + 7] = 0; // octets fragmentés

    // Tableau des pointeurs de cellules
    for (let i = 0; i < n; i++) {
      const pos = headerLen + 8 + 2 * i;
      page[pos] = (offsets[i] >> 8) & 0xFF;
      page[pos + 1] = offsets[i] & 0xFF;
    }
    return page;
  }

  /* ----- Page B-tree table interior ----- */
  function pageInterne(entrees) {
    const n = entrees.length;
    const nb = n - 1; // le dernier est le child "right-most"
    const page = new Uint8Array(PAGE_SIZE);

    let curseur = PAGE_SIZE;
    const offsets = [];
    for (let i = 0; i < nb; i++) {
      const e = entrees[i];
      const cell = intBE(e.pageNum, 4).concat(encodVarint(e.maxKey));
      curseur -= cell.length;
      offsets[i] = curseur;
      cell.forEach(function (o, k) {
        page[curseur + k] = o;
      });
    }

    const contentStart = nb > 0 ? Math.min.apply(Math, offsets) : PAGE_SIZE;

    page[0] = 5; // table interior
    page[1] = 0;
    page[2] = 0;
    page[3] = (nb >> 8) & 0xFF;
    page[4] = nb & 0xFF;
    page[5] = (contentStart >> 8) & 0xFF;
    page[6] = contentStart & 0xFF;
    page[7] = 0;

    // Page du child right-most (offset 8, 4 octets)
    const droit = entrees[n - 1].pageNum;
    page[8] = (droit >> 24) & 0xFF;
    page[9] = (droit >> 16) & 0xFF;
    page[10] = (droit >> 8) & 0xFF;
    page[11] = droit & 0xFF;

    // Tableau des pointeurs de cellules (début : offset 12)
    for (let i = 0; i < nb; i++) {
      const pos = 12 + 2 * i;
      page[pos] = (offsets[i] >> 8) & 0xFF;
      page[pos + 1] = offsets[i] & 0xFF;
    }
    return page;
  }

  /* ----- Répartir les éléments en pages qui tiennent ----- */
  function repartir(cellules, feuille) {
    const groupes = [];
    let courant = [];
    let taille = feuille ? 8 : 12; // header B-tree (+ right-most pour interne)
    cellules.forEach(function (c) {
      const len = feuille
        ? (c.octets || c).length + 2 // cellule + pointeur
        : 4 + encodVarint(c.maxKey).length + 2; // page + varint + pointeur
      if (taille + len > PAGE_SIZE && courant.length) {
        groupes.push(courant);
        courant = [];
        taille = feuille ? 8 : 12;
      }
      courant.push(c);
      taille += len;
    });
    if (courant.length) groupes.push(courant);
    return groupes;
  }

  /* ----- Construire un arbre B-tree complet (1+ pages) ----- */
  function construireArbre(cellules, alloc) {
    let prochain = alloc.prochain;

    // Niveau feuilles
    const groupes = repartir(cellules, true);
    let niveau = [];
    if (groupes.length === 0) {
      const num = prochain++;
      alloc.pages[num - 1] = pageLeaf(0, []);
      niveau.push({ num: num, maxKey: 0 });
    } else {
      groupes.forEach(function (g) {
        const num = prochain++;
        alloc.pages[num - 1] = pageLeaf(0, g);
        niveau.push({ num: num, maxKey: g[g.length - 1].rowid });
      });
    }

    // Niveaux internes jusqu'à une seule page racine
    while (niveau.length > 1) {
      const grpInternes = repartir(niveau, false);
      const suiv = [];
      grpInternes.forEach(function (g) {
        const entrees = g.map(function (nd) {
          return { pageNum: nd.num, maxKey: nd.maxKey };
        });
        const num = prochain++;
        alloc.pages[num - 1] = pageInterne(entrees);
        suiv.push({ num: num, maxKey: g[g.length - 1].maxKey });
      });
      niveau = suiv;
    }

    alloc.prochain = prochain;
    return niveau[0].num;
  }

  /* ----- Construction du fichier complet ----- */
  function construireFichier(donnees) {
    const moniteurs = donnees.moniteurs || [];
    const enfants = donnees.enfants || [];
    const visiteurs = donnees.visiteurs || [];
    const mouvements = donnees.mouvements || [];

    const schema = [
      "CREATE TABLE moniteurs (id INTEGER PRIMARY KEY, nom_prenom TEXT NOT NULL, initials TEXT, role TEXT, statut TEXT, sexe TEXT, telephone TEXT, commission TEXT)",
      "CREATE TABLE enfants (id INTEGER PRIMARY KEY, nom_prenom TEXT NOT NULL, statut TEXT, date_creation TEXT)",
      "CREATE TABLE visiteurs (id INTEGER PRIMARY KEY, nom_prenom TEXT NOT NULL, telephone TEXT, pour_qui TEXT, statut TEXT)",
      "CREATE TABLE mouvements (id INTEGER PRIMARY KEY, type_profil TEXT, personne_id INTEGER, nom_personne TEXT, type_action TEXT, motif TEXT, agent_accueil TEXT, date_mouvement TEXT, heure_mouvement TEXT)",
    ];

    function colonnesTable(entete, rows) {
      const triees = rows.slice().sort(function (a, b) { return a.id - b.id; });
      return triees.map(function (r) {
        return {
          rowid: r.id,
          octets: cellule(r.id, enregistrement(entete.map(function (c) {
            return r[c];
          }))),
        };
      });
    }

    const tables = [
      { nom: "moniteurs", cells: colonnesTable(
          ["id", "nom_prenom", "initials", "role", "statut", "sexe", "telephone", "commission"], moniteurs) },
      { nom: "enfants", cells: colonnesTable(
          ["id", "nom_prenom", "statut", "date_creation"], enfants) },
      { nom: "visiteurs", cells: colonnesTable(
          ["id", "nom_prenom", "telephone", "pour_qui", "statut"], visiteurs) },
      { nom: "mouvements", cells: colonnesTable(
          ["id", "type_profil", "personne_id", "nom_personne", "type_action", "motif", "agent_accueil", "date_mouvement", "heure_mouvement"], mouvements) },
    ];

    // Allouer les pages des arbres (numéros à partir de 2 ; page 1 = sqlite_master)
    const alloc = { pages: [], prochain: 2 };
    const racines = {};
    tables.forEach(function (t) {
      racines[t.nom] = construireArbre(t.cells, alloc);
    });

    // sqlite_master : type, name, tbl_name, rootpage, sql
    const masterCells = schema.map(function (sql, i) {
      const nom = sql.match(/CREATE TABLE (\w+)/)[1];
      const payload = enregistrement(["table", nom, nom, racines[nom], sql]);
      return { rowid: i + 1, octets: cellule(i + 1, payload) };
    });
    alloc.pages[0] = pageLeaf(100, masterCells);

    const nbPages = alloc.pages.length;
    const fichier = new Uint8Array(nbPages * PAGE_SIZE);

    // Remplir les pages (la page 1 contient le header en surcharge)
    alloc.pages.forEach(function (p, i) {
      if (p) fichier.set(p, i * PAGE_SIZE);
    });

    // ----- En-tête du fichier SQLite (100 octets) -----
    const header = new Uint8Array(100);
    function ecrire32(off, v) {
      header[off] = (v >> 24) & 0xFF;
      header[off + 1] = (v >> 16) & 0xFF;
      header[off + 2] = (v >> 8) & 0xFF;
      header[off + 3] = v & 0xFF;
    }
    header.set(Array.prototype.slice.call(new TextEncoder().encode("SQLite format 3\u0000")));
    header[16] = (PAGE_SIZE >> 8) & 0xFF; // page size
    header[17] = PAGE_SIZE & 0xFF;
    header[18] = 1; // write version
    header[19] = 1; // read version
    header[20] = 0; // reserved space
    header[21] = 64; // max embedded payload fraction
    header[22] = 32; // min embedded payload fraction
    header[23] = 32; // leaf payload fraction
    ecrire32(24, 1); // file change counter
    ecrire32(28, nbPages); // taille de la base en pages
    ecrire32(32, 0); // première page freelist
    ecrire32(36, 0); // nb pages freelist
    ecrire32(40, 1); // schema cookie
    ecrire32(44, 4); // schema format number
    ecrire32(48, 0); // taille cache par défaut
    ecrire32(52, 0); // plus grande racine B-tree (0 = inconnue)
    ecrire32(56, 1); // encodage texte : UTF-8
    ecrire32(60, 0); // user version
    ecrire32(64, 0); // incremental vacuum
    ecrire32(68, 0); // application id
    ecrire32(72, 0); // réservé pour extensions
    ecrire32(76, 0);
    ecrire32(80, 0);
    ecrire32(84, 0);
    ecrire32(88, 0);
    ecrire32(92, nbPages); // version-valid-for
    ecrire32(96, 0); // SQLITE_VERSION_NUMBER
    fichier.set(header, 0);
    return fichier;
  }

  /* ----- Lecture des données depuis la base (navigateur) ----- */
  function donneesActuelles() {
    return {
      moniteurs: DB.moniteurs(),
      enfants: DB.enfants(),
      visiteurs: DB.visiteurs(),
      mouvements: DB.mouvements(),
    };
  }

  /* ----- Téléchargement ----- */
  function telecharger() {
    const fichier = construireFichier(donneesActuelles());
    const blob = new Blob([fichier], { type: "application/vnd.sqlite3" });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const nom =
      "GES-CB_" +
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "_" + pad(d.getHours()) + pad(d.getMinutes()) +
      ".db";
    const a = document.createElement("a");
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    return nom;
  }

  return {
    construireFichier,
    donneesActuelles,
    telecharger,
  };
})();

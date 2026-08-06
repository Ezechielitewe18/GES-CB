/* =====================================================
   GES-CB - Import / restauration SQLite (.db)
   Lit un VRAI fichier SQLite (format binaire) en pur
   JavaScript, sans dépendance ni internet, et restaure
   les données dans l'application (localStorage).
   ===================================================== */

const SQLITE_IMPORT = (function () {
  const MAGIE = "SQLite format 3\u0000";
  const TABLES = ["moniteurs", "enfants", "visiteurs", "mouvements"];

  function decodVarint(octets, pos) {
    let v = 0;
    for (let i = 0; i < 9; i++) {
      const b = octets[pos + i];
      if (b === undefined) break;
      v = v * 128 + (b & 0x7f);
      if (b < 0x80) return { valeur: v, taille: i + 1 };
    }
    return { valeur: v, taille: 9 };
  }

  function intBE(octets, pos, n) {
    let v = 0;
    for (let i = 0; i < n; i++) v = v * 256 + octets[pos + i];
    return v;
  }

  /* Décode une valeur selon son type de série */
  function decoderValeur(type, octets, pos, fin) {
    if (type === 0) return { valeur: null, taille: 0 };
    if (type === 1) {
      const v = octets[pos] << 24 >> 24;
      return { valeur: v, taille: 1 };
    }
    if (type === 2) return { valeur: intBE(octets, pos, 2) << 16 >> 16, taille: 2 };
    if (type === 3) return { valeur: intBE(octets, pos, 3) << 8 >> 8, taille: 3 };
    if (type === 4) return { valeur: intBE(octets, pos, 4), taille: 4 };
    if (type === 5) return { valeur: intBE(octets, pos, 6), taille: 6 };
    if (type === 6) {
      const dv = new DataView(octets.buffer, octets.byteOffset + pos, 8);
      return { valeur: Number(dv.getBigInt64(0, false)), taille: 8 };
    }
    if (type === 7) {
      const dv = new DataView(octets.buffer, octets.byteOffset + pos, 8);
      return { valeur: dv.getFloat64(0, false), taille: 8 };
    }
    if (type === 8) return { valeur: 0, taille: 0 };
    if (type === 9) return { valeur: 1, taille: 0 };
    if (type >= 13) {
      const n = (type - 13) / 2;
      const dec = new TextDecoder("utf-8");
      const v = dec.decode(octets.subarray(pos, pos + n));
      return { valeur: v, taille: n };
    }
    if (type >= 12) {
      const n = (type - 12) / 2;
      return { valeur: octets.subarray(pos, pos + n), taille: n };
    }
    return { valeur: null, taille: 0 };
  }

  /* Décode un record : [headerSize varint, types varints, valeurs] */
  function decoderRecord(octets, pos) {
    const hs = decodVarint(octets, pos);
    const headerSize = hs.valeur;
    let p = pos + hs.taille;
    const types = [];
    while (p - pos < headerSize) {
      const t = decodVarint(octets, p);
      types.push(t.valeur);
      p += t.taille;
    }
    const valeurs = [];
    let q = p;
    types.forEach(function (type) {
      const d = decoderValeur(type, octets, q, octets.length);
      valeurs.push(d.valeur);
      q += d.taille;
    });
    return valeurs;
  }

  /* Extrait les noms de colonnes d'un CREATE TABLE */
  function nomsColonnes(sql) {
    const entre = sql.indexOf("(");
    const fin = sql.lastIndexOf(")");
    const corps = sql.slice(entre + 1, fin);
    const noms = [];
    corps.split(",").forEach(function (part) {
      const p = part.trim();
      const m = p.match(/^([A-Za-z_][A-Za-z0-9_]*)\b/);
      if (m) noms.push(m[1]);
    });
    return noms;
  }

  function lireFichier(buffer) {
    const octets = new Uint8Array(buffer);
    const nbOctets = octets.length;

    const magie = new TextDecoder("utf-8").decode(octets.subarray(0, 16));
    if (magie !== MAGIE) throw new Error("Ce fichier n'est pas une base SQLite valide.");

    const pageSize = intBE(octets, 16, 2);
    if (pageSize < 512) throw new Error("Taille de page SQLite invalide.");

    const table = {};
    let pageBase = 0;

    function lirePage(num) {
      const debut = (num - 1) * pageSize;
      return octets.subarray(debut, debut + pageSize);
    }

    function extraireRecords(page, base) {
      base = base || 0;
      const nb = intBE(page, base + 3, 2);
      const records = [];
      for (let i = 0; i < nb; i++) {
        const ptr = intBE(page, base + 8 + 2 * i, 2);
        const cellule = page.subarray(ptr, page.length);
        const pl = decodVarint(cellule, 0);
        const rid = decodVarint(cellule, pl.taille);
        const debut = pl.taille + rid.taille;
        const payload = cellule.subarray(debut, debut + pl.valeur);
        records.push({ rowid: rid.valeur, vals: decoderRecord(payload, 0) });
      }
      return records;
    }

    function construireObjets(records, colonnes) {
      const idxId = colonnes.indexOf("id");
      const acc = [];
      records.forEach(function (r) {
        const obj = {};
        colonnes.forEach(function (nom, i) {
          obj[nom] = r.vals[i];
        });
        /* Les bases SQLite réelles stockent l'id comme rowid (hors record) */
        if (idxId !== -1 && (obj.id === null || obj.id === undefined)) {
          obj.id = r.rowid;
        }
        acc.push(obj);
      });
      return acc;
    }

    function parcourir(num, colonnes, acc) {
      const page = lirePage(num);
      const type = page[0];
      if (type === 13) {
        construireObjets(extraireRecords(page), colonnes).forEach(function (obj) {
          acc.push(obj);
        });
      } else if (type === 5) {
        const nb = intBE(page, 3, 2);
        const droit = intBE(page, 8, 4);
        for (let i = 0; i < nb; i++) {
          const ptr = intBE(page, 12 + 2 * i, 2);
          const enfant = intBE(page, ptr, 4);
          parcourir(enfant, colonnes, acc);
        }
        parcourir(droit, colonnes, acc);
      } else {
        throw new Error("Type de page B-tree inattendu : " + type);
      }
    }

    /* Page 1 : sqlite_master (en-tête B-tree à l'offset 100) */
    const master = lirePage(1);
    extraireRecords(master, 100).forEach(function (r) {
      const nom = r.vals[1];
      if (r.vals[0] === "table" && TABLES.indexOf(nom) !== -1) {
        table[nom] = { racine: r.vals[3], colonnes: nomsColonnes(r.vals[4]) };
      }
    });

    if (TABLES.some((t) => !table[t])) {
      throw new Error("Cette base ne contient pas toutes les tables de GES-CB.");
    }

    const donnees = {};
    TABLES.forEach(function (nom) {
      donnees[nom] = [];
      if (table[nom].racine > 0) {
        parcourir(table[nom].racine, table[nom].colonnes, donnees[nom]);
      }
    });

    return donnees;
  }

  /* Lit un File (browser) et restaure dans l'application */
  function restaurerDepuisFichier(file) {
    return new Promise(function (resoudre, rejeter) {
      const lecteur = new FileReader();
      lecteur.onload = function () {
        try {
          const donnees = lireFichier(lecteur.result);
          const resume = DB.restaurer(donnees);
          resoudre(resume);
        } catch (e) {
          rejeter(e);
        }
      };
      lecteur.onerror = function () { rejeter(new Error("Lecture du fichier impossible.")); };
      lecteur.readAsArrayBuffer(file);
    });
  }

  return {
    lireFichier,
    restaurerDepuisFichier,
  };
})();

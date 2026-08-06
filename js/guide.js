/* =====================================================
   GES-CB — Mode démonstration (guide diaporama)
   Défilement automatique (5 s) + navigation manuelle.
   ===================================================== */

const GES_GUIDE = (function () {
  /* Vitesses proposées : 10 s (défaut), 12 s, 8 s, 5 s */
  const VITESSES = [10000, 12000, 8000, 5000];
  let vitesse = VITESSES[0];
  let idxVitesse = 0;

  const DIAPOS = [
    {
      etiquette: "Bienvenue",
      titre: "Bienvenue sur <em>GES-CB</em>",
      texte:
        "GES-CB est le cahier de la porte du camp, version numérique : il enregistre chaque <strong>sortie</strong> et chaque <strong>retour</strong> des moniteurs, aides-moniteurs, enfants et visiteurs.",
      points: [
        "La présentation avance toute seule toutes les 10 secondes",
        "⏱ pour changer la vitesse (12 s / 8 s / 5 s)",
        "◀ ▶ pour avancer ou reculer à votre rythme",
        "⏸ pour mettre en pause et expliquer",
        "Échap pour fermer le guide",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">GES-CB</span></div>' +
        '<div class="fake-corps" style="text-align:center; padding:34px 16px">' +
        '<div style="font-family:var(--serif);font-size:30px;color:var(--or);font-weight:700">GES<span style="color:var(--texte)">-CB</span></div>' +
        '<div style="font-size:13px;color:var(--texte-muet);margin-top:6px">Camp Biblique · Gestion des Entrées & Sorties</div>' +
        '<div style="margin-top:18px;display:flex;justify-content:center;gap:10px">' +
        ICONES("users", 20) + ICONES("helpers", 20) + ICONES("child", 20) + ICONES("door", 20) +
        "</div>" +
        "</div></div>",
    },
    {
      etiquette: "Étape 1",
      titre: "La <em>connexion</em>",
      texte:
        "Au démarrage, l'application demande le <strong>nom complet</strong> et le <strong>mot de passe</strong>. Le compte du camp est unique : <strong>Tantine Nadicha Minga</strong> / <strong>Camp26</strong>.",
      points: [
        "Tapez le nom exactement comme il est écrit",
        "Puis appuyez sur « Se connecter »",
        "Si c'est incorrect, un message rouge s'affiche",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Connexion</span></div>' +
        '<div class="fake-corps">' +
        '<div class="form-groupe"><label class="champ-label">Nom complet</label><input type="text" value="Tantine Nadicha Minga" readonly /></div>' +
        '<div class="form-groupe"><label class="champ-label">Mot de passe</label><input type="password" value="Camp26" readonly /></div>' +
        '<button class="btn" disabled>Se connecter</button>' +
        "</div></div>",
    },
    {
      etiquette: "Étape 2",
      titre: "Le <em>menu</em> principal",
      texte:
        "Après la connexion, le menu donne accès à toutes les pages : les <strong>4 registres</strong> de la porte, les <strong>statistiques</strong> et la <strong>sauvegarde</strong>.",
      points: [
        "Moniteurs · Aides-Moniteurs · Enfants · Visiteurs",
        "Statistiques : présences en temps réel et rapport du jour",
        "Sauvegarde : protéger les données",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Accueil</span></div>' +
        '<div class="fake-corps">' +
        '<div class="mock-grille-menu">' +
        '<div class="mini-carte">' + ICONES("users", 18) + "Moniteurs</div>" +
        '<div class="mini-carte">' + ICONES("helpers", 18) + "Aides</div>" +
        '<div class="mini-carte">' + ICONES("child", 18) + "Enfants</div>" +
        '<div class="mini-carte">' + ICONES("door", 18) + "Visiteurs</div>" +
        '<div class="mini-carte">' + ICONES("chart", 18) + "Stats</div>" +
        '<div class="mini-carte">' + ICONES("download", 18) + "Sauvegarde</div>" +
        "</div></div></div>",
    },
    {
      etiquette: "Étape 3",
      titre: "Enregistrer une <em>sortie</em>",
      texte:
        "Dans une page de registre (ex. Moniteurs), cherchez la personne et appuyez sur le bouton <strong>vert « SORTIE »</strong>. L'heure et le jour s'enregistrent automatiquement.",
      points: [
        "La recherche rapide filtre au fur et à mesure que vous tapez",
        "Une personne peut être sortie plusieurs fois dans la journée",
        "Son statut devient « Dehors »",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Moniteurs</span></div>' +
        '<div class="fake-corps">' +
        '<input type="search" value="Joseph" readonly />' +
        '<div class="mock-ligne"><div><strong>Joseph Etshumba</strong><small>Commission Logistique</small></div><button class="btn btn-vert btn-petit" disabled>SORTIE</button></div>' +
        '<div class="mock-ligne"><div><strong>Grâce Ilunga</strong><small>Commission Cuisine</small></div><span class="mock-etat">Dehors · 1 h 20</span></div>' +
        "</div></div>",
    },
    {
      etiquette: "Étape 4",
      titre: "Enregistrer le <em>retour</em>",
      texte:
        "Quand la personne revient, appuyez sur le bouton <strong>« RETOUR »</strong>. Le temps passé dehors s'affiche aussitôt, avec l'heure de sortie et de retour.",
      points: [
        "L'écran clignote en vert pour confirmer le retour",
        "Un petit « bip » retentit (si le son est activé)",
        "Les durées sont comptées en heures et minutes",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Moniteurs</span></div>' +
        '<div class="fake-corps">' +
        '<div class="mock-ligne"><div><strong>Joseph Etshumba</strong><small>Commission Logistique</small></div><button class="btn btn-vert btn-petit" disabled>RETOUR</button></div>' +
        '<div style="text-align:center;font-size:13px;color:var(--or-clair);font-weight:700">Sortie 09:15 · Retour 11:30 · Dehors 2 h 15</div>' +
        "</div></div>",
    },
    {
      etiquette: "Étape 5",
      titre: "L'alerte après <em>3 heures</em>",
      texte:
        "Si une personne reste dehors plus de <strong>3 heures</strong>, sa ligne devient <strong>rouge</strong> : c'est l'alerte. Il faut alors prévenir les responsables.",
      points: [
        "La ligne rouge ne se désactive qu'au retour de la personne",
        "Le temps dehors est mis à jour en direct",
        "Vérifiez la page régulièrement, surtout après 20 h",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Aide-Moniteurs</span></div>' +
        '<div class="fake-corps">' +
        '<div class="mock-ligne alerte">' +
        "<div><strong style=\"color:#FF8A8A\">Esther Mbayo</strong><small>Commission Intendance</small></div>" +
        '<span class="mock-etat mock-rouge">' + ICONES("alert", 16) + " 3 h 10 dehors</span>" +
        "</div>" +
        '<div class="mock-ligne"><div><strong>Daniel Kasongo</strong><small>Commission Animation</small></div><span class="mock-etat">1 h 05 dehors</span></div>' +
        "</div></div>",
    },
    {
      etiquette: "Étape 6",
      titre: "Historique & <em>annulation</em>",
      texte:
        "Cliquez sur une personne pour ouvrir son <strong>historique</strong>. En cas d'erreur de saisie, le bouton <strong>« Annuler »</strong> supprime la ligne et corrige le statut automatiquement.",
      points: [
        "L'historique indique l'heure, l'action et l'agent de la porte",
        "Appuyez deux fois pour confirmer l'annulation",
        "Le statut « Dehors » se recalcule tout seul",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Historique · Grâce Ilunga</span></div>' +
        '<div class="fake-corps">' +
        '<table class="tableau"><thead><tr><th>Heure</th><th>Action</th><th></th></tr></thead><tbody>' +
        '<tr><td>11:02</td><td><span class="badge badge-vert">RETOUR</span></td><td><button class="btn btn-danger btn-petit" disabled>Annuler</button></td></tr>' +
        '<tr><td>09:20</td><td><span class="badge badge-rouge">SORTIE</span></td><td><button class="btn btn-danger btn-petit" disabled>Annuler</button></td></tr>' +
        "</tbody></table></div></div>",
    },
    {
      etiquette: "Étape 7",
      titre: "Les <em>statistiques</em>",
      texte:
        "La page Statistiques montre les présences en <strong>temps réel</strong>, le rapport du jour, des <strong>graphiques</strong> et le journal des mouvements. Idéale pour la réunion d'évaluation du soir.",
      points: [
        "« Personnes dehors » : le nombre à surveiller à tout moment",
        "Le bouton « Imprimer » produit le rapport du jour",
        "Le tableau de bord trace l'évolution du camp",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Statistiques</span></div>' +
        '<div class="fake-corps">' +
        '<div style="display:flex;gap:8px">' +
        '<div style="flex:1;text-align:center;background:rgba(255,255,255,.05);border-radius:10px;padding:10px"><strong style="font-size:22px;color:var(--or)">12</strong><div style="font-size:11px;color:var(--texte-muet)">Dehors</div></div>' +
        '<div style="flex:1;text-align:center;background:rgba(255,255,255,.05);border-radius:10px;padding:10px"><strong style="font-size:22px;color:var(--or)">58</strong><div style="font-size:11px;color:var(--texte-muet)">Présents</div></div>' +
        "</div>" +
        '<div class="mock-barres">' +
        '<div class="mock-barre" style="height:30%"></div><div class="mock-barre" style="height:45%"></div>' +
        '<div class="mock-barre" style="height:28%"></div><div class="mock-barre" style="height:62%"></div>' +
        '<div class="mock-barre" style="height:50%"></div><div class="mock-barre" style="height:82%"></div>' +
        '<div class="mock-barre" style="height:70%"></div>' +
        "</div>" +
        '<button class="btn btn-gris btn-petit" style="width:100%" disabled>Imprimer le rapport</button>' +
        "</div></div>",
    },
    {
      etiquette: "Étape 8",
      titre: "Sauvegarder <em>chaque jour</em>",
      texte:
        "Les données sont gardées dans le téléphone ou l'ordinateur. Pour les protéger, faites une <strong>sauvegarde</strong> : un fichier <strong>.db</strong> qui contient tout.",
      points: [
        "Chaque soir, appuyez sur « Télécharger le fichier (.db) »",
        "Gardez le fichier précieusement (WhatsApp, e-mail, clé USB)",
        "Pour changer d'appareil : « Restaurer » avec ce fichier",
      ],
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">Sauvegarde</span></div>' +
        '<div class="fake-corps">' +
        '<div class="mock-ligne" style="flex-direction:column;align-items:flex-start;gap:8px">' +
        "<div><strong>Dernière sauvegarde</strong><small>Aujourd'hui à 18:30 · 142 mouvements</small></div>" +
        '<button class="btn btn-petit" style="width:100%" disabled>' + ICONES("download", 16) + " Télécharger le fichier (.db)</button>" +
        '<button class="btn btn-gris btn-petit" style="width:100%" disabled>' + ICONES("upload", 16) + " Restaurer une sauvegarde</button>" +
        "</div></div></div>",
    },
    {
      etiquette: "Récapitulatif",
      titre: "Vous savez tout !",
      texte:
        "En résumé, voici le quotidien de la porte :",
      points: [
        "<strong>1.</strong> Connectez-vous avec le compte du camp",
        "<strong>2.</strong> Enregistrez chaque SORTIE (vert) et chaque RETOUR",
        "<strong>3.</strong> Surveillez les lignes rouges : alerte après 3 h dehors",
        "<strong>4.</strong> Le soir : imprimez les statistiques pour la réunion",
        "<strong>5.</strong> Terminez par une sauvegarde du fichier .db",
      ],
      bouton: "C'est compris, commencer",
      visuel:
        '<div class="fake-app">' +
        '<div class="fake-app-bar"><span class="pastille" style="background:#E74C3C"></span><span class="pastille" style="background:#E67E22"></span><span class="pastille" style="background:#2ECC71"></span><span class="titre-app">GES-CB</span></div>' +
        '<div class="fake-corps" style="text-align:center; padding:34px 16px">' +
        '<div style="width:74px;height:74px;margin:0 auto;border-radius:50%;background:rgba(46,204,113,.15);border:2px solid var(--vert);display:flex;align-items:center;justify-content:center;color:var(--vert)">' +
        ICONES("check", 34) +
        "</div>" +
        '<div style="font-family:var(--serif);font-size:20px;color:var(--or);margin-top:16px">Le camp est entre de bonnes mains</div>' +
        '<div style="font-size:13px;color:var(--texte-muet);margin-top:6px">Merci de tenir le registre avec soin.</div>' +
        "</div></div>",
    },
  ];

  const etat = { index: 0, timer: null, pause: false };
  let doc = null;

  /* ----- Rendu d'une diapositive ----- */
  function afficher() {
    const zone = doc.getElementById("diaporama");
    if (!zone) return;

    const d = DIAPOS[etat.index];
    const total = DIAPOS.length;

    let pointsHtml = "";
    if (d.points && d.points.length) {
      pointsHtml =
        '<ul class="diapo-points">' +
        d.points
          .map(function (p) {
            return (
              '<li><span class="point-icone">' + ICONES("check", 18) + "</span><span>" + p + "</span></li>"
            );
          })
          .join("") +
        "</ul>";
    }

    let visuelHtml = d.visuel ? '<div class="diapo-visuel">' + d.visuel + "</div>" : "";
    let ctaHtml = d.bouton
      ? '<button class="btn guide-bouton" onclick="GES_GUIDE.fermer()">' + d.bouton + "</button>"
      : "";

    let pointsHtmlDots = "";
    for (let i = 0; i < total; i++) {
      pointsHtmlDots +=
        '<button class="guide-point' + (i === etat.index ? " actif" : "") + '" onclick="GES_GUIDE.allerA(' +
        i + ')" aria-label="Diapositive ' + (i + 1) + '"></button>';
    }

    zone.innerHTML =
      '<div class="guide-progress"><div class="guide-progress-bar" id="guide-progress-bar"></div></div>' +
      '<div class="guide-haut">' +
      '<span class="guide-compteur">Étape ' + (etat.index + 1) + " / " + total + "</span>" +
      '<button class="guide-fermer" onclick="GES_GUIDE.fermer()" aria-label="Fermer">✕</button>' +
      "</div>" +
      '<div class="guide-scene"><div class="diapo">' +
      '<div class="diapo-cote">' +
      '<span class="diapo-numero">' + d.etiquette + "</span>" +
      '<h2 class="diapo-titre">' + d.titre + "</h2>" +
      '<p class="diapo-paragraphe">' + d.texte + "</p>" +
      pointsHtml +
      ctaHtml +
      "</div>" +
      visuelHtml +
      "</div></div>" +
      '<div class="guide-controles">' +
      '<button class="guide-nav secondaire" onclick="GES_GUIDE.precedent()" aria-label="Précédent">' +
      ICONES("retour", 22) + "</button>" +
      '<button class="guide-nav" id="btn-pause" onclick="GES_GUIDE.basculerPause()" aria-label="Pause">' +
      (etat.pause ? ICONES("jouer", 22) : ICONES("pause", 22)) + "</button>" +
      '<button class="guide-nav secondaire vitesse" id="btn-vitesse" onclick="GES_GUIDE.changerVitesse()" aria-label="Changer la vitesse">' +
      ICONES("clock", 17) + ' <span id="label-vitesse">' + Math.round(vitesse / 1000) + " s</span></button>" +
      '<button class="guide-nav" onclick="GES_GUIDE.suivant()" aria-label="Suivant">' +
      ICONES("sortie", 22) + "</button>" +
      "</div>" +
      '<div class="guide-pied">' +
      '<div class="guide-points">' + pointsHtmlDots + "</div>" +
      '<div class="guide-hint">← → pour naviguer · Espace : pause · Échap : fermer</div>' +
      "</div>";
  }

  /* ----- Progression / minuterie ----- */
  function lancerProgression() {
    const bar = doc.getElementById("guide-progress-bar");
    if (!bar) return;
    bar.classList.remove("actif");
    void bar.offsetWidth;
    bar.style.animationDuration = vitesse + "ms";
    bar.style.animationPlayState = etat.pause ? "paused" : "running";
    bar.classList.add("actif");
  }

  function arreterTimer() {
    if (etat.timer) {
      clearInterval(etat.timer);
      etat.timer = null;
    }
  }

  function demarrerTimer() {
    arreterTimer();
    lancerProgression();
    etat.timer = setInterval(function () {
      suivant();
    }, vitesse);
  }

  /* ----- Navigation ----- */
  function allerA(i) {
    if (i < 0 || i >= DIAPOS.length) return;
    etat.index = i;
    afficher();
    if (etat.index >= DIAPOS.length - 1) {
      arreterTimer();
      return;
    }
    if (etat.pause) lancerProgression();
    else demarrerTimer();
  }

  function suivant() {
    if (etat.index >= DIAPOS.length - 1) {
      arreterTimer();
      return;
    }
    allerA(etat.index + 1);
  }

  function precedent() {
    if (etat.index <= 0) return;
    allerA(etat.index - 1);
  }

  function basculerPause() {
    etat.pause = !etat.pause;
    const btn = doc.getElementById("btn-pause");
    const bar = doc.getElementById("guide-progress-bar");
    if (btn) btn.innerHTML = etat.pause ? ICONES("jouer", 22) : ICONES("pause", 22);
    if (etat.pause) {
      arreterTimer();
      if (bar) bar.style.animationPlayState = "paused";
    } else {
      demarrerTimer();
    }
  }

  function changerVitesse() {
    idxVitesse = (idxVitesse + 1) % VITESSES.length;
    vitesse = VITESSES[idxVitesse];
    const lbl = doc.getElementById("label-vitesse");
    if (lbl) lbl.textContent = Math.round(vitesse / 1000) + " s";
    if (!etat.pause) demarrerTimer();
  }

  function fermer() {
    arreterTimer();
    if (doc && doc.removeEventListener) doc.removeEventListener("keydown", onTouche);
    if (doc.history && doc.history.length > 1) doc.history.back();
    else if (doc.location) doc.location.href = "index.html";
  }

  /* ----- Clavier ----- */
  function onTouche(e) {
    if (!e || !e.key) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      suivant();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      precedent();
    } else if (e.key === " ") {
      e.preventDefault();
      basculerPause();
    } else if (e.key === "Escape") {
      fermer();
    } else if (e.key === "Home") {
      allerA(0);
    } else if (e.key === "End") {
      allerA(DIAPOS.length - 1);
    }
  }

  /* ----- Démarrage ----- */
  function demarrer(docEl) {
    doc = docEl || document;
    afficher();
    demarrerTimer();
    if (doc.addEventListener) doc.addEventListener("keydown", onTouche);

    const zone = doc.getElementById("diaporama");
    if (zone) {
      let xDebut = null;
      zone.addEventListener("touchstart", function (e) {
        xDebut = e.changedTouches ? e.changedTouches[0].clientX : null;
      });
      zone.addEventListener("touchend", function (e) {
        if (xDebut === null || !e.changedTouches) return;
        const xFin = e.changedTouches[0].clientX;
        const ecart = xFin - xDebut;
        if (ecart < -60) suivant();
        else if (ecart > 60) precedent();
        xDebut = null;
      });
    }
  }

  return {
    demarrer,
    allerA,
    suivant,
    precedent,
    basculerPause,
    changerVitesse,
    fermer,
  };
})();

if (typeof globalThis !== "undefined") globalThis.GES_GUIDE = GES_GUIDE;

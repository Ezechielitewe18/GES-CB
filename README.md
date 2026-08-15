# GES-CB · Gestion des Entrées & Sorties — Camp Biblique

Application web qui gère en **temps réel** les entrées et sorties des personnes au camp biblique : **Moniteurs & Aides-Moniteurs, Enfants et Visiteurs**.

Fonctionne **sans internet** : toutes les données sont enregistrées dans le navigateur (localStorage).

---

## 🔐 Compte de connexion

| Rôle | Nom | Mot de passe | Accès |
|---|---|---|---|
| **Administrateur** | Tantine Nadicha Minga | `Camp26` | Toutes les pages (Moniteurs, Aides, Enfants, Visiteurs, Statistiques) |

---

## 🚀 Utilisation

1. Ouvrir le dossier dans un navigateur (Chrome, Edge, Firefox...) et ouvrir le fichier **`index.html`**.
2. Se connecter avec le compte **Tantine Nadicha Minga** / `Camp26`.
3. Le menu donne accès à toutes les pages.

### Agent de porte
- **Moniteurs** : cliquer sur l'initiale du moniteur, saisir le motif de sortie, puis [Enregistrer la sortie]. Au retour, cliquer sur le moniteur "DEHORS" puis [Valider le retour]. *Double-clic sur un nom → historique de la journée (bouton « Annuler » sur une ligne pour corriger une saisie).*
- **Aides-Moniteurs** : mêmes actions pour les aides.
- **Enfants** : créer + sortir un nouvel enfant (motif optionnel : RDV médical, Cours, Formation, Autre...), ou rechercher un enfant existant (retour / nouvelle sortie). Bouton **Supprimer** (double confirmation) pour retirer un enfant et son historique.
- **Visiteurs** : enregistrer les arrivées et les départs.

### Direction
- **Statistiques** : rapport du jour (moniteurs, aides, enfants, visiteurs), personnes dehors séparées par catégorie, journal des mouvements du jour, **impression du rapport quotidien** pour les réunions d'évaluation.
- **Tableau de bord** : graphiques intégrés (SVG, sans bibliothèque) — répartition des sorties par catégorie (anneau), évolution des sorties par jour (barres), sorties par commission (barres horizontales). Imprimés dans le rapport quotidien.
- **Historique par jour** : sélecteur de date pour consulter le rapport et le journal d'une journée passée (le rapport du jour reste celui d'aujourd'hui par défaut).
- **Export SQLite** : bouton « Télécharger le fichier .db » qui génère un véritable fichier SQLite (binaire, sans dépendance ni internet) contenant les 4 tables, ouvrable avec **DB Browser for SQLite**.
- **Sauvegarde & Restauration** : page **Sauvegarde** pour télécharger un fichier `.db` (sauvegarde) et réimporter un fichier `.db` (restauration). Un rappel s'affiche sur l'accueil tant que le fichier n'a pas été sauvegardé dans la journée. La page propose aussi **« Tout effacer »** (double confirmation) pour repartir de zéro : enfants, visiteurs, historique et personnel ajouté sont supprimés, les moniteurs et aides-moniteurs officiels sont réinstallés.
- **Guide (mode démonstration)** : diaporama automatique (1 diapositive toutes les 5 s) avec boutons ◀ ▶, pause, clavier et fermeture — pour former une nouvelle personne à la porte en quelques minutes. Accessible depuis la page de connexion, l'accueil et le menu.

---

## 📱 Sur téléphone (PWA)

L'app est publiée sur **GitHub Pages** : https://ezechielitewe18.github.io/GES-CB/
- **Android (Chrome)** : ouvrir l'adresse une fois (avec internet) → menu ⋮ → « Installer l'application ».
- **iPhone (Safari)** : ouvrir l'adresse → bouton **Partager** → « Sur l'écran d'accueil ».
- Ensuite l'app fonctionne **sans internet** (service worker `sw.js`). Après chaque mise à jour, il suffit de l'ouvrir une fois connecté.
- Pour reprendre les données d'un autre appareil : sauvegarde `.db` → restauration.

---

## ✨ Fonctionnalités

- 🕐 Horodatage automatique (date + heure) de chaque entrée/sortie
- 🧑‍💼 Journal central : qui est sorti, pourquoi, à quelle heure, validé par quel agent
- 👶 **Enfants internes & externes** : les externes viennent le matin (arrivée) et rentrent chez eux le soir (départ) ; ils ne dorment pas au camp, avec badge « Externe » partout (registre, journal, rapport)
- ⏰ **Alerte rouge clignotante par niveau** si une personne dépasse son seuil : aide-moniteur **10 h**, moniteur **15 h**, enfant **18 h**, visiteur **20 h**
- 📖 Psaume du jour affiché à l'agent de porte à chaque connexion
- 🔔 Bip sonore + flash vert (sortie) / rouge (retour) à chaque validation
- 🖨️ Impression du **rapport quotidien** (statistiques + journal) pour les réunions d'évaluation
- 📅 **Historique par jour** : rapport et journal consultables pour n'importe quelle date
- 📊 **Tableau de bord** : graphiques SVG (anneau par catégorie, barres par jour et par commission)
- ↩️ **Correction d'une saisie** : bouton « Annuler » dans l'historique d'une personne (supprime l'entrée et recale automatiquement le statut)
- 📊 Statistiques en temps réel pour la direction
- 🗄️ **Export SQLite** : téléchargement d'un fichier `.db` (4 tables) pour DB Browser
- 💾 **Sauvegarde & Restauration** : télécharger/réimporter un fichier `.db`, rappel quotidien sur l'accueil
- 📽️ **Mode démonstration** : guide diaporama (11 diapositives, défilement 5 s + navigation manuelle) pour apprendre l'app
- 📱 **PWA** : installable sur téléphone (écran d'accueil), fonctionne hors-ligne (GitHub Pages)

---

## 📦 Sauvegarde des données (SQLite / DB Browser)

Pendant l'utilisation, les données sont stockées dans le navigateur. La page **Sauvegarde** permet de :
- **Sauvegarder** : télécharger un fichier `.db` (`js/sqlite_export.js` — véritable fichier SQLite binaire) ;
- **Restaurer** : réimporter un fichier `.db` (`js/sqlite_import.js`) qui remplace les données actuelles.

Depuis la page **Statistiques**, le bouton **« Télécharger le fichier .db »** génère également ce fichier, ouvrable avec **DB Browser for SQLite** pour consultation, analyse et impression.

- Le fichier contient les tables : `moniteurs`, `enfants`, `visiteurs`, `mouvements`.
- Le générateur écrit le format binaire SQLite directement (pages B-tree, en-tête 100 octets) **sans aucune dépendance**, même en mode hors-ligne.
- Le lecteur lit aussi bien les fichiers générés par l'application que les fichiers créés par un autre outil SQLite (mêmes tables).
- Le schéma SQL de référence se trouve dans `database/schema.sql`.
- Astuce : sauvegarder **chaque soir** (un rappel s'affiche sur l'accueil tant que la sauvegarde du jour n'a pas été faite).

---

## 📁 Structure du projet

```
GES-CB/
├── index.html           # Page de connexion
├── accueil.html         # Menu principal
├── moniteurs.html       # Moniteurs
├── aides.html           # Aides-Moniteurs
├── enfants.html         # Enfants
├── visiteurs.html       # Visiteurs
├── gestion.html         # Gestion du personnel
├── statistiques.html    # Statistiques (rapport + journal + historique par jour)
├── sauvegarde.html      # Sauvegarde & restauration (.db)
├── guide.html           # Mode démonstration (diaporama)
├── css/                 # style, components, responsive, guide
├── js/                  # db, auth, ui, charts, guide, moniteurs, gestion, enfants, visiteurs, statistiques, sauvegarde, sqlite_export, sqlite_import
├── sw.js                # Service worker (fonctionne hors-ligne)
├── manifest.webmanifest # Manifest PWA (installation sur téléphone)
├── favicon.svg          # Icône du site
└── database/
    └── schema.sql       # Schéma SQL de référence (moniteurs, enfants, visiteurs, mouvements)
```

---

## 👥 Moniteurs (liste officielle)

| Initiales | Nom | Sexe | Téléphone | Commission |
|---|---|---|---|---|
| AM | Alistair MINGA SHANGA | M | 0817892936 | Communication |
| AB | Anael BUANDA SUKADI | F | 0906354770 | Protocole |
| AN | Angélique NTUMBA KABITAMBISHI | F | 0840387988 | Enseignement |
| AN | Anne SHIMBA NGOY | F | — | Enseignement |
| AK | Arnold MUTOMBO KADIMA | M | 0819360012 | Sport |
| BB | Benedicte BOLINGO BOFEKO | F | 0826404493 | Cuisine |
| BM | Benel KASONGA MASENGU | F | 0828383336 | Sport |
| BM | Bénie KATULANSONI MAYA | F | 0815406115 | Loisirs |
| BM | Bérénice KABULO MUKANDA | F | 0812963415 | Enseignement |
| BK | Bodmie MPANYA KAZADI | F | 0812849538 | Spirituel |
| CK | Cécile KINGUNA MUKETER | F | 0813793284 | — |
| CM | Christelle MAKWABALA | F | 0998656577 | Coordination |
| CK | Christian KILULA KONDO | M | 0841537757 | Discipline |
| CN | Christian NGOYI | M | — | Protocole |
| CM | Claudette PELENGE MINGA | F | 0815157256 | Médicale |
| CD | Claudine DIASONAMA | F | 0816516312 | — |
| CB | Consel SUAMUNU BASADILA | F | 0856236132 | Cuisine |
| DI | Deborah MBUAYA ILUNGA | F | 0812948180 | — |
| DM | Defi MUSHENI MANZIMI | F | 0998608776 | Protocole |
| DN | Diamante BUBIONGO NSUKU | F | 0843475646 | Protocole |
| DS | Difi SAIDI | F | 0894253885 | Cuisine |
| DB | Divin BASILWANGO | M | — | Logistique |
| DM | Divine BANGWENO MUMIE | F | 0990851607 | — |
| DB | Divine NKOMBO BEYANA | F | 0814451070 | — |
| EM | Eliezer MUTSHI MANDE | M | 0818571738 | Spirituel |
| ET | Elise MANGENZI TELA | F | — | Cuisine |
| EW | Emmanuel WANJA WAMPE | M | 0839333714 | Logistique |
| EE | Esperance | F | 0853719093 | — |
| EM | Esperance NKULU MALOBA | F | 0814734608 | — |
| EK | Esther KALUBI KADIMA | F | 0828757540 | Protocole |
| EM | Esther SHIMBA MWEMA | F | 0998101623 | Enseignement |
| EM | Eunice KAYOWA MANDA | F | 0832711390 | Protocole |
| EM | Exauce BOLINGO MPUTU | M | 0823939556 | Logistique |
| EL | Exauce BULENGHA LUKASU | M | 0820988740 | Protocole |
| FI | Fanny MUTEMBA IRUNG | F | 0810827401 | — |
| FN | Florence MAMPENDO NGOMBOLO | F | 0810851960 | — |
| FB | François MUKANDILA BEYA | M | 0899574304 | Communication |
| GG | Gabriella | F | 0895923903 | — |
| GM | Gauthier MPIANA MINGA | M | 0820078266 | Enseignement |
| GG | Gisele | F | — | — |
| IN | Ida LOKONI NYANZANGO | F | 0999987740 | Enseignement |
| IK | Irene KASENGELA KAZADI | F | 0999335053 | Discipline |
| IN | Israël KONDO NKUNKU | M | 0822422990 | Loisirs |
| IB | Israël SALUMU BIRINGANINE | M | 0826259538 | Coordination |
| JM | Jack NKONKWE MBAYO | M | 0978119169 | Protocole |
| JM | Jedidja KAMWANYA MASEVO | F | 0982751545 | Protocole |
| JM | Jemima MPAMBU MBUZI | F | 0848687079 | — |
| JA | Jessyca BUSHA ANTUIL | F | 0814584762 | Communication |
| JK | Jocelyne KAKUDJI KISULA | F | 0822854669 | Loisirs |
| JM | Joella MUANDA MATONDO | F | 0817466117 | Protocole |
| JL | Joseph LUBOYA LUNGONZO | M | 0822805616 | Cuisine |
| JO | Josué TSHULA OKOMA | M | 0854342690 | Logistique |
| JN | Joy TSHITOKO N'ZITA | M | 0830438374 | Logistique |
| LM | Lorsel MOTEADE MONINGA | F | 0974208637 | Loisirs |
| MS | Mamie IKIESE SAKABENI | F | 0814676604 | — |
| MM | Manassé TSHITOKO MINGA | M | 0825483876 | — |
| MV | Marie Céline AMBOKO VIVUYA | F | 0893690151 | Loisirs |
| MP | Marie-Claver KUNUMANA PWA | F | 0818364469 | Cuisine |
| MM | Marthe | F | 0982646225 | — |
| MM | Matthieu LUAPANYA MULUNGU | M | 0821357747 | — |
| MB | Merveille BOMOLO BONTSUTSU | M | 0833097960 | Cuisine |
| BN | Mirvi BUDIONGO NSILULU | M | 0994207248 | Communication |
| MN | Modestie TEDIKA NSIMBA | M | 0819792870 | — |
| MK | Moise KANDOLO | M | 0816915114 | — |
| NM | Nadicha MUSUAMBA MINGA | F | 0820142656 | Protocole |
| NM | Nancy MUJIKE | F | 0811827556 | Cuisine |
| NL | Nella KIFULUKA TOSHA Léa | F | 0812195812 | Médicale |
| NN | Noémie NDALAMBA | F | — | — |
| PK | Patrick KAMBAMBA | M | — | — |
| PN | Pierre UTSHUDI NKOY | M | 0999987740 | — |
| PL | Plamedi BELOKO LESENGE | F | 0976741536 | Loisirs |
| PK | Prisca KALULA | F | 0811263235 | — |
| RT | Rami TAMBWE | F | 0819983240 | Cuisine |
| RM | Richesse MANIALA MUKANDILA | M | 0812570212 | Logistique |
| RN | Rose MUZALIWA N'ANCHA | F | 0828706024 | Finance |
| SM | Shaloom MALALA | M | 0829999262 | Coordination |
| TN | Tegra BELOKO N'KIRAWE | M | 0990657869 | Spirituel |
| BP | Thomas BANDUKA PANZU | M | 0826305861 | Cuisine |
| VL | Voldis LOYKO WA LOYKO | M | 0814981388 | Communication |

---

## 👥 Aides-Moniteurs (liste officielle)

Les numéros et commissions des aides seront saisis ultérieurement (non fournis).

| Initiales | Nom | Sexe |
|---|---|---|
| AA | Angela OLEKO ANDJENGA | F |
| BM | Bliss-Grace WANDJA MILOMBA | F |
| DN | Defi NSILULU | F |
| DP | Diadème BIDIONGO PELENGE | F |
| DK | Diffa KATUNA | F |
| DM | Dorcas DINA MULAJI | F |
| EB | Elie BOPOLO | M |
| EB | Elvicia MUSHENI BASHILE | F |
| EK | Enosu MASTHIK KAZADI | F |
| EN | Eunice NGONGA | F |
| EI | Ezechiel ITEWE | M |
| EA | Exauce ANTWISI | M |
| GM | Gloria MAGAZINI | F |
| JA | Jes'Dani AWAZI | M |
| JA | Jes'Oli AWAZI | M |
| JA | Jessica ANGUMO | F |
| JB | Joyce BOLENGE BAKINI | F |
| KI | Ketsia KATUNA ITUN | F |
| LL | Leslie LUZIBU LUAMPANYA | F |
| MI | Merveille ILANGI | F |
| MB | Michael BASILWANGO | M |
| MN | Mirac NTAMBWE | F |
| NM | Neoma MULIELE | F |
| PM | Paul MULAJI | M |
| PT | Perle TSHIBUABUA TSHIBUABUA | F |
| PB | Plamedi BILA | F |
| PN | Plamedi NGALULA | F |
| RK | Richesse KAZADI | M |
| RD | Ruth OMOYI DJONGA | F |
| SB | Serdia MALU BELOKO | F |

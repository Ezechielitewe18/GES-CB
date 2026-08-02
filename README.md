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
- **Moniteurs** : cliquer sur l'initiale du moniteur, saisir le motif de sortie, puis [Enregistrer la sortie]. Au retour, cliquer sur le moniteur "DEHORS" puis [Valider le retour]. *Double-clic sur un nom → historique de la journée.*
- **Aides-Moniteurs** : mêmes actions pour les aides.
- **Enfants** : créer + sortir un nouvel enfant (motif optionnel : RDV médical, Cours, Formation, Autre...), ou rechercher un enfant existant (retour / nouvelle sortie).
- **Visiteurs** : enregistrer les arrivées et les départs.

### Direction
- **Statistiques** : rapport du jour (moniteurs, aides, enfants, visiteurs), personnes dehors séparées par catégorie, journal des mouvements du jour, **impression du rapport quotidien** pour les réunions d'évaluation.

---

## ✨ Fonctionnalités

- 🕐 Horodatage automatique (date + heure) de chaque entrée/sortie
- 🧑‍💼 Journal central : qui est sorti, pourquoi, à quelle heure, validé par quel agent
- ⏰ Alerte rouge clignotante si une personne reste dehors plus de **3 heures**
- 📖 Psaume du jour affiché à l'agent de porte à chaque connexion
- 🔔 Bip sonore + flash vert (sortie) / rouge (retour) à chaque validation
- 🖨️ Impression du **rapport quotidien** (statistiques + journal) pour les réunions d'évaluation
- 📊 Statistiques en temps réel pour la direction

---

## 📦 Sauvegarde des données (SQLite / DB Browser)

Pendant l'utilisation, les données sont stockées dans le navigateur. Une fonction **d'export vers SQLite** (`js/sqlite_export.js`) permet de générer un fichier de base de données ouvrable avec **DB Browser for SQLite** pour consultation, analyse et impression.

Le schéma SQL se trouve dans `database/schema.sql`.

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
├── statistiques.html    # Statistiques
├── css/                 # style, components, responsive
├── js/                  # db, auth, ui, moniteurs, enfants, visiteurs, statistiques, sqlite_export
└── database/
    └── schema.sql       # Script SQL pour DB Browser
```

---

## 👥 Moniteurs & Aides-Moniteurs

| Initiales | Nom | Rôle |
|---|---|---|
| TB | Tegra Beloko | Moniteur |
| PB | Plamedie Beloko | Moniteur |
| DB | Divine Bangweno | Aide-Moniteur |
| AM | Alistair Minga | Moniteur |
| CA | Celina Amboko | Moniteur |
| RM | Richesse Maniala | Aide-Moniteur |
| MT | Mirac Tambwe | Aide-Moniteur |
| EW | Emmanuel Wandja | Aide-Moniteur |
| VL | Voldis Loyko | Moniteur |
| EB | Exauce Bolingo | Moniteur |

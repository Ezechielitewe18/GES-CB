# GES-CB · Gestion des Entrées & Sorties — Camp Biblique

Application web qui gère en **temps réel** les entrées et sorties des personnes au camp biblique : **Moniteurs & Aides-Moniteurs, Enfants et Visiteurs**.

Fonctionne **sans internet** : toutes les données sont enregistrées dans le navigateur (localStorage).

---

## 🔐 Comptes de connexion

| Rôle | Nom | Mot de passe | Accès |
|---|---|---|---|
| **Administrateur** (agent de porte) | Tantine Nadicha Minga | `Camp26` | Moniteurs · Enfants · Visiteurs |
| **Super Administrateur** (direction) | Tonton Israel Salumu | `Camp123` | Statistiques uniquement |

---

## 🚀 Utilisation

1. Ouvrir le dossier dans un navigateur (Chrome, Edge, Firefox...) et ouvrir le fichier **`index.html`**.
2. Se connecter avec l'un des deux comptes ci-dessus.
3. Le menu affiche les pages autorisées selon le rôle.

### Agent de porte (Admin)
- **Moniteurs** : cliquer sur l'initiale du moniteur, saisir le motif de sortie, puis [Enregistrer la sortie]. Au retour, cliquer sur le moniteur "DEHORS" puis [Valider le retour]. *Double-clic sur un nom → historique de la journée.*
- **Enfants** : créer + sortir un nouvel enfant, ou rechercher un enfant existant (retour / nouvelle sortie).
- **Visiteurs** : enregistrer les arrivées et les départs.

### Direction (Super Admin)
- **Statistiques** : compteurs temps réel, liste des personnes dehors, journal des mouvements du jour, **export imprimable de la liste des présents** (appel d'urgence / évacuation).

---

## ✨ Fonctionnalités

- 🕐 Horodatage automatique (date + heure) de chaque entrée/sortie
- 🧑‍💼 Journal central : qui est sorti, pourquoi, à quelle heure, validé par quel agent
- ⏰ Alerte rouge clignotante si une personne reste dehors plus de **3 heures**
- 📖 Psaume du jour affiché à l'agent de porte à chaque connexion
- 🔔 Bip sonore + flash vert (sortie) / rouge (retour) à chaque validation
- 🖨️ Export imprimable de la liste des présents en cas d'urgence
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
├── accueil.html         # Menu principal (selon le rôle)
├── moniteurs.html       # Moniteurs & Aides-Moniteurs
├── enfants.html         # Enfants
├── visiteurs.html       # Visiteurs
├── statistiques.html    # Statistiques (Super Admin)
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

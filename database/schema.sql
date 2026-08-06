-- =====================================================
-- GES-CB - Schéma de référence de la base SQLite
-- Généré par js/sqlite_export.js (export hors ligne)
-- Ouvrable avec DB Browser for SQLite, python sqlite3, etc.
-- =====================================================

CREATE TABLE moniteurs (
  id          INTEGER PRIMARY KEY,
  nom_prenom  TEXT NOT NULL,
  initials    TEXT,
  role        TEXT,
  statut      TEXT,
  sexe        TEXT,
  telephone   TEXT,
  commission  TEXT
);

CREATE TABLE enfants (
  id             INTEGER PRIMARY KEY,
  nom_prenom     TEXT NOT NULL,
  statut         TEXT,
  date_creation  TEXT
);

CREATE TABLE visiteurs (
  id          INTEGER PRIMARY KEY,
  nom_prenom  TEXT NOT NULL,
  telephone   TEXT,
  pour_qui    TEXT,
  statut      TEXT
);

CREATE TABLE mouvements (
  id               INTEGER PRIMARY KEY,
  type_profil      TEXT,
  personne_id      INTEGER,
  nom_personne     TEXT,
  type_action      TEXT,
  motif            TEXT,
  agent_accueil    TEXT,
  date_mouvement   TEXT,
  heure_mouvement  TEXT
);

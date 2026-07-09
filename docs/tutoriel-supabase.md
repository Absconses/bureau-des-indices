# Tutoriel : brancher Supabase au Bureau des Indices

**Objectif** : activer le suivi de classe centralisé. Après ce tutoriel, chaque
élève qui joue (chez lui, au CDI, sur son téléphone…) alimente ton tableau de
bord professeur, et sa progression le suit d'un appareil à l'autre.

**Durée : ~15 minutes. Coût : 0 € (offre gratuite largement suffisante).**

> Sans Supabase, la plateforme fonctionne déjà : la progression reste alors
> dans le navigateur de chaque élève, et l'écran professeur ne voit que
> l'appareil sur lequel il est ouvert.

---

## Étape 1 — Créer ton compte Supabase (2 min)

1. Va sur **https://supabase.com** et clique sur **Start your project**.
2. Choisis **Continue with GitHub** et connecte-toi avec ton compte GitHub
   (celui du site : *Absconses*). Autorise Supabase quand GitHub le demande.

## Étape 2 — Créer le projet (3 min)

1. Clique sur **New project**.
2. Remplis :
   - **Name** : `bureau-des-indices`
   - **Database password** : clique sur **Generate a password**, puis
     **copie-le et range-le** (gestionnaire de mots de passe, carnet…).
     Tu n'en auras presque jamais besoin, mais il ne se récupère pas.
   - **Region** : choisis **Europe (Paris)** ou **Europe (Frankfurt)** —
     ⚠️ important pour le RGPD : les données restent dans l'Union européenne.
   - **Plan** : Free.
3. Clique sur **Create new project** et attends ~2 minutes que le projet
   s'initialise (l'écran l'indique).

## Étape 3 — Installer la base (3 min)

1. Dans le menu de gauche, clique sur l'icône **SQL Editor** (symbole `>_`).
2. Ouvre le fichier [`docs/supabase.sql`](supabase.sql) du dépôt
   (sur GitHub : `docs` → `supabase.sql` → bouton « Copy raw file »).
3. **Colle tout le contenu** dans l'éditeur SQL et clique sur **Run**
   (ou Ctrl+Entrée). Tu dois voir « Success. No rows returned ».

C'est ta base : les tables (élèves, événements, sessions), les fonctions de
connexion et le verrouillage RGPD (personne ne peut lire les tables
directement, tout passe par des fonctions contrôlées).

## Étape 4 — Ton mot de passe professeur (1 min)

Toujours dans le **SQL Editor**, efface tout, colle ceci **en remplaçant
`TON-MOT-DE-PASSE`** (garde les apostrophes), puis **Run** :

```sql
insert into prof (mdp_hash) values (crypt('TON-MOT-DE-PASSE', gen_salt('bf')))
on conflict (id) do update set mdp_hash = excluded.mdp_hash;
```

C'est le mot de passe que tu taperas dans « Espace professeur » sur le site.
(Relance cette même requête pour le changer plus tard.)

## Étape 5 — Créer les codes de tes élèves (3 min)

### Générer les codes

Format : `5A-XKR-07` → classe, 3 lettres au hasard, 2 chiffres.
Dans LibreOffice Calc ou Excel, colle cette formule et tire vers le bas
(une ligne par élève, change `"5A-"` selon la classe) :

```
="5A-"&CAR(65+ALEA.ENTRE.BORNES(0;25))&CAR(65+ALEA.ENTRE.BORNES(0;25))&CAR(65+ALEA.ENTRE.BORNES(0;25))&"-"&TEXTE(ALEA.ENTRE.BORNES(0;99);"00")
```

Vérifie qu'il n'y a pas deux codes identiques, puis note **dans ton carnet**
(jamais dans la plateforme !) quelle carte va à quel élève.

### Les enregistrer dans la base

Dans le **SQL Editor**, sur ce modèle (adapte les codes et ajoute autant de
lignes que d'élèves) :

```sql
insert into eleves (code, classe) values
  ('5A-XKR-07', '5A'),
  ('5A-MPT-12', '5A'),
  ('5A-QLZ-33', '5A');
```

Astuce tableur : la formule
`="('"&A1&"', '5A'),"` fabrique ces lignes automatiquement à partir de ta
colonne de codes.

L'élève choisira lui-même son PIN à 4 chiffres à sa **première** connexion.

## Étape 6 — Relier le site à ta base (2 min)

1. Dans Supabase : menu de gauche → **Project Settings** (roue dentée) →
   **API** (ou **API Keys**). Copie :
   - la **Project URL** (ressemble à `https://abcdefgh.supabase.co`) ;
   - la clé **anon / public** (longue chaîne commençant par `eyJ…` ou `sb_publishable_…`).
2. Ouvre le fichier `js/config.js` du site et remplis les deux lignes :

```js
SUPABASE_URL: 'https://abcdefgh.supabase.co',
SUPABASE_ANON_KEY: 'eyJ…ta-clé…',
```

**Deux façons de faire :**
- **Sur GitHub (le plus simple)** : github.com/Absconses/bureau-des-indices →
  dossier `js` → `config.js` → icône crayon ✏️ (Edit) → colle tes valeurs →
  bouton vert **Commit changes**. Le site se met à jour en ~2 minutes.
- **Sur ton PC** : édite `Documents\bureau-des-indices\js\config.js`
  (clic droit → Ouvrir avec → Bloc-notes), enregistre — ou demande-moi de le
  faire et de pousser.

> ℹ️ Cette clé « anon » est **faite pour être publique** : elle ne donne accès
> à rien directement (les tables sont verrouillées), elle sert seulement à
> appeler les fonctions de connexion. Pas de panique en la voyant sur GitHub.

## Étape 7 — Tester (2 min)

1. Ouvre https://absconses.github.io/bureau-des-indices/ (recharge la page).
2. Connecte-toi avec un de tes codes tests + un PIN de ton choix → joue un
   module en entier.
3. Retourne à l'écran de connexion (bouton ⎋ « changer d'agent ») →
   **Espace professeur** → ton mot de passe de l'étape 4 → la classe apparaît
   avec sa médaille. 🎉

---

## Gestion au quotidien

| Besoin | Solution |
|---|---|
| Ajouter une classe / des élèves | Étape 5, avec les nouveaux codes |
| Un élève a oublié son PIN | SQL Editor : `select reinitialiser_pin('TON-MOT-DE-PASSE', '5A-XKR-07');` — il rechoisira un PIN à sa prochaine connexion |
| Voir les données brutes | Menu **Table Editor** → tables `eleves` et `evenements` |
| Changer le mot de passe prof | Relancer la requête de l'étape 4 |
| Fin d'année (RGPD : minimisation) | SQL Editor : `delete from evenements; delete from sessions; delete from eleves;` puis recréer les classes à la rentrée |

## En cas de pépin

- **« Code inconnu. Vérifie ta carte agent. »** → le code n'a pas été inséré à
  l'étape 5 (ou faute de frappe : les codes sont en MAJUSCULES).
- **« PIN incorrect »** → réinitialise-le (tableau ci-dessus).
- **Le tableau prof reste en « mode local »** → `js/config.js` mal rempli
  (URL ou clé incomplète) ou pas encore poussé/déployé : attends 2 min et
  recharge avec Ctrl+F5.
- **Wi-Fi du collège capricieux** → rien à faire : les élèves continuent en
  local et tout se synchronise automatiquement au retour du réseau.
- **Projet Supabase « en pause »** : l'offre gratuite met en pause un projet
  inactif ~7 jours. Ouvre le tableau de bord Supabase → bouton **Restore**.
  (Pense à y passer une fois pendant les grandes vacances, ou au pire :
  Restore à la rentrée, aucune donnée n'est perdue.)

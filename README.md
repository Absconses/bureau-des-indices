# Bureau des Indices

Plateforme web d'autoformation à l'Éducation aux Médias et à l'Information (EMI)
pour le cycle 4 (5e-4e-3e), structurée sur le *Projet de programmes d'EMI du
cycle 4* (CSP, juin 2025). Direction visuelle « enquête » : design tokens dans
`css/tokens.css`.

**État : v1** — moteur complet (12 types d'activités dont l'embed H5P),
les 8 modules du parcours 5e · Domaine 2 « S'informer », connexion par code
pseudonyme + PIN, écran professeur, synchronisation Supabase prête à brancher
(voir [docs/deploiement.md](docs/deploiement.md)).

## Tester en local

Double-cliquer sur **`Apercu local.bat`** (ou lancer `serveur-local.ps1`),
puis ouvrir <http://localhost:8123>. Aucune installation requise.

## Organisation

```
index.html            Coquille de l'application (une seule page)
css/tokens.css        Design tokens (source : design system validé)
css/app.css           Styles des écrans et activités
js/app.js             Routeur + écrans (bureau, dossier)
js/engine.js          Moteur de module (enchaînement, score, résultat)
js/activities/*.js    Un fichier par type d'activité (qcm, tri, gonogo, zone…)
js/state.js           Progression élève (localStorage + file d'événements)
js/sync/supabase.js   Synchronisation Supabase (squelette, v1)
js/docsim.js          Documents simulés (« pièces à examiner »)
content/programme.json           Arborescence parcours > domaines > rubriques > modules
content/modules/<id>.json        Contenu pédagogique, un fichier par module
docs/creer-un-module.md          Guide : créer un module sans programmer
assets/fonts/         IBM Plex auto-hébergée (pas de CDN)
```

## Principes fixés

- Contenu 100 % séparé du moteur (JSON), variantes par élève.
- Aucune donnée nominative ; code pseudonyme + PIN (v1).
- Statique, déployable sur GitHub Pages ; mobile-first ; pas de tracking.
- Module validé (« affaire classée ») à partir de 70 % — bronze 70 / argent 85 / or 100.

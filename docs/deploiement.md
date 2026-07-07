# Déploiement et branchement Supabase

## 1 · Mettre en ligne sur GitHub Pages

Le site est 100 % statique : aucune compilation, on publie le dossier tel quel.

1. Crée un dépôt sur github.com (ex. `bureau-des-indices`), public.
2. Pousse le contenu du dossier (ou glisse-dépose les fichiers via l'interface web
   de GitHub : « Add file → Upload files »).
3. Dans le dépôt : **Settings → Pages → Source : Deploy from a branch**,
   branche `main`, dossier `/ (root)`, puis Save.
4. Deux minutes plus tard, le site est en ligne à
   `https://<ton-pseudo>.github.io/bureau-des-indices/`.

Chaque modification poussée sur `main` met à jour le site automatiquement.

## 2 · Brancher Supabase (suivi de classe)

Sans Supabase, tout fonctionne déjà en mode local (la progression reste dans
le navigateur de chaque élève). Supabase ajoute : le suivi de classe centralisé
et la progression retrouvable d'un appareil à l'autre.

1. Crée un projet sur supabase.com — **région : EU (Frankfurt ou Paris)**.
2. Dans l'éditeur SQL du projet, colle et exécute le contenu de
   [`docs/supabase.sql`](supabase.sql).
3. Toujours dans l'éditeur SQL, définis ton mot de passe professeur et crée
   les codes de tes classes (modèles en commentaire à la fin du fichier SQL).
4. Dans **Settings → API**, copie l'URL du projet et la clé `anon`, puis
   renseigne-les dans [`js/config.js`](../js/config.js).
5. Pousse le fichier modifié : c'est branché. L'écran « Espace professeur »
   demande alors ton mot de passe et affiche toute la classe.

### Générer des codes élèves

Format : `5A-XKR-07` (classe, tiret, 3 caractères au hasard, tiret, 2 chiffres).
Une formule de tableur suffit, par exemple dans LibreOffice/Excel :

```
="5A-"&CAR(65+ALEA.ENTRE.BORNES(0;25))&CAR(65+ALEA.ENTRE.BORNES(0;25))&CAR(65+ALEA.ENTRE.BORNES(0;25))&"-"&TEXTE(ALEA.ENTRE.BORNES(0;99);"00")
```

Imprime la liste, découpe des « cartes agent », distribue-les. La
correspondance carte ↔ élève reste dans ton carnet : elle n'est **jamais**
saisie dans la plateforme (RGPD).

### PIN oublié

Éditeur SQL Supabase :
`select reinitialiser_pin('TON-MDP-PROF', '5A-XKR-07');`
L'élève choisira un nouveau PIN à sa prochaine connexion.

## 3 · Mode dégradé (déjà actif)

Si Supabase est injoignable (Wi-Fi du collège capricieux…), la progression
continue en localStorage et une file d'événements attend le retour du réseau ;
elle est synchronisée automatiquement (toutes les 60 s, au retour en ligne et
à chaque fin de module).

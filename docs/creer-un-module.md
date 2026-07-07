# Créer un nouveau module (sans programmer)

Un module = **un fichier JSON** dans `content/modules/`, déclaré dans `content/programme.json`.

## Étape 1 — Dupliquer le gabarit

Copie `content/modules/5.D2.OUT.1.json`, renomme-le avec l'identifiant du module
(ex. `5.D2.RECH.1.json`), puis remplis les champs.

## Étape 2 — Les champs du module

| Champ | Rôle |
|---|---|
| `id` | Identifiant traçable : `parcours.domaine.rubrique.numéro` (ex. `5.D2.RECH.1`) |
| `objectif` | L'objectif d'apprentissage **verbatim du programme officiel** |
| `titre` | Titre élève, court et accrocheur |
| `accroche` | Une phrase de mise en situation (tutoiement) |
| `documents` | Les documents simulés réutilisés par plusieurs activités (voir plus bas) |
| `activites` | 3 à 6 activités, **jamais deux de la même famille à la suite** |

## Étape 3 — Les activités

Chaque activité a :

- `id` : `A1`, `A2`… (sert au tirage des variantes et au suivi) ;
- `type` : voir le catalogue ci-dessous ;
- `famille` : `questionnement` / `manipulation` / `reflexe` / `exploration` / `scenario` / `production` ;
- `xpParReussite` : XP gagnés par bonne réponse ;
- `variantes` : **une liste**. S'il y en a plusieurs, chaque élève reçoit
  toujours la même (tirée selon son code), mais elle change d'un élève à l'autre —
  cela limite l'échange de réponses. Une seule variante suffit pour commencer.

### Types disponibles

**`qcm`** — question(s) à choix unique, avec ou sans document support.
```json
{ "document": "nomDuDocument",
  "questions": [ {
      "question": "Qui a écrit cet article ?",
      "options": ["choix A", "choix B"],
      "bonnes": [1],
      "feedbackOk": "Pourquoi c'est juste (1-2 phrases).",
      "feedbackKo": "Où était la réponse et pourquoi (1-2 phrases)."
  } ] }
```

**`tri`** — glisser-déposer catégoriel, une carte à la fois.
```json
{ "consigne": "…",
  "categories": [ { "id": "radio", "label": "📻 Radio" } ],
  "items": [ { "texte": "…", "categorie": "radio",
               "feedbackOk": "…", "feedbackKo": "…" } ] }
```

**`gonogo`** — vrai/faux en temps limité (mode chrono, fond sombre).
```json
{ "consigne": "…", "tempsParQuestion": 8,
  "enonces": [ { "texte": "…", "vrai": true, "feedback": "…" } ] }
```

**`zone`** — trouver l'endroit précis d'un document simulé.
```json
{ "document": "nomDuDocument", "consigne": "Touche l'endroit qui…",
  "cibles": ["footer"], "essaisMax": 3,
  "indices": ["indice après 1 raté", "indice après 2 ratés"],
  "feedbackOk": "…", "feedbackKo": "…" }
```

**`ordre`** — remise en ordre d'étapes (l'affichage est mélangé automatiquement).
```json
{ "consigne": "…",
  "items": [ { "texte": "étape 1" }, { "texte": "étape 2" } ],
  "feedbackOk": "…", "feedbackKo": "…" }
```

**`paires`** — appariement : associer chaque carte à sa moitié.
```json
{ "consigne": "…",
  "paires": [ { "gauche": "…", "droite": "…", "feedbackOk": "…", "feedbackKo": "…" } ] }
```

**`trous`** — texte à trous par étiquettes (`{1}`, `{2}`… dans le texte).
```json
{ "consigne": "…",
  "texte": "Je note l'{1} du site et la {2} de publication.",
  "etiquettes": ["adresse", "date", "leurre1", "leurre2"],
  "reponses": ["adresse", "date"],
  "feedbackOk": "…", "feedbackKo": "…" }
```

**`surligner`** — sélectionner les mots pertinents (`*mot*` = mot à trouver).
```json
{ "consigne": "Surligne les mots qui répondent à QUAND.",
  "texte": "Depuis *lundi*, la ville de Saint-Aubin…",
  "feedbackOk": "…", "feedbackKo": "…" }
```

**`hotspots`** — points d'intérêt à explorer sur un document (découverte,
non notée : XP forfaitaire une fois tous les points vus).
```json
{ "document": "nomDuDocument", "consigne": "…",
  "points": [ { "zone": "manchette", "titre": "…", "texte": "…" } ] }
```

**`defile`** — arcade : cliquer les bonnes propositions, se retenir sur les
pièges (fond sombre, temps limité). Les pièges doivent reproduire de vraies
techniques de manipulation (urgence, cadeau, majuscules…).
```json
{ "consigne": "…", "tempsParProposition": 8,
  "propositions": [ { "texte": "…", "bonne": true, "feedback": "…" } ] }
```

**`chat`** — conversation scriptée type messagerie, avec choix de réponses.
```json
{ "contact": { "nom": "Sami", "avatar": "🦈" },
  "etapes": [
    { "de": "eux", "texte": "…" },
    { "choix": [ { "texte": "…", "ok": true, "feedback": "…" } ] },
    { "de": "info", "texte": "conclusion…" } ] }
```

**`h5p-embed`** — embarque un contenu H5P de ta bibliothèque Lümi
(extrait dans `h5p/` avec `outils/extraire-h5p.ps1`). La progression est
créditée via les événements xAPI (completed/answered).
```json
{ "dossier": "h5p/mon-contenu", "consigne": "…" }
```

## Étape 4 — Les documents simulés

Déclarés une fois dans `documents`, réutilisables par plusieurs activités.
Chaque partie d'un document porte une « zone » utilisable par les activités
`zone` et `hotspots`.

| Template | Sert à | Zones principales |
|---|---|---|
| `site-article` | page d'article de site web | `url`, `logo`, `menu`, `surtitre`, `titre`, `auteur`, `date`, `chapo`, `para-1`…, `pub`, `footer` |
| `notice` | résultat d'un portail documentaire | `recherche`, `type`, `titre`, `auteur`, `editeur`, `resume`, `cote`, `dispo` |
| `serp` | page de résultats d'un moteur | `requete`, `res-1`, `res-1-url`, `res-1-titre`, `res-1-annonce`… |
| `une` | Une de journal papier | `nom-journal`, `date`, `prix`, `manchette`, `sous-titre`, `photo`, `legende`, `secondaire-1`…, `sommaire` |
| `collecte` | document de collecte d'élève | `entete`, `extrait-1`, `source-1`… |
| `post` | publication de réseau social | `pseudo`, `bio`, `texte`, `image`, `reactions` |

## Étape 5 — Déclarer le module

Dans `content/programme.json`, dans la bonne rubrique :
```json
{ "id": "5.D2.RECH.1", "titre": "…", "objectif": "… (verbatim)",
  "disponible": true, "fichier": "content/modules/5.D2.RECH.1.json" }
```

## Règle d'or du contenu

> L'élève doit devoir **traiter le document ou la situation** pour répondre.
> Si l'activité est réussissable en lisant seulement la question, refais-la.

Registre : élève de 5e, phrases courtes, tutoiement, exemples du quotidien
(téléphone, réseaux, CDI, exposés). Chaque feedback explique **le pourquoi**
en 1-2 phrases, jamais un simple juste/faux.

/* Chargement des contenus pédagogiques (JSON séparés du moteur). */

const cache = new Map();

async function charger(url) {
  if (cache.has(url)) return cache.get(url);
  const rep = await fetch(url);
  if (!rep.ok) throw new Error(`Contenu introuvable : ${url}`);
  const json = await rep.json();
  cache.set(url, json);
  return json;
}

export function getProgramme() {
  return charger('content/programme.json');
}

export async function getModule(id) {
  const programme = await getProgramme();
  for (const parcours of programme.parcours)
    for (const domaine of parcours.domaines)
      for (const rubrique of domaine.rubriques)
        for (const mod of rubrique.modules)
          if (mod.id === id && mod.fichier) return charger(mod.fichier);
  throw new Error(`Module inconnu ou indisponible : ${id}`);
}

export async function getDomaine(parcoursId, domaineId) {
  const programme = await getProgramme();
  const parcours = programme.parcours.find(p => p.id === parcoursId);
  return parcours?.domaines.find(d => d.id === domaineId) || null;
}

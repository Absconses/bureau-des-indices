/* État élève : progression, XP, choix de variantes.
   v1 démo : localStorage uniquement. La file d'événements est prête pour
   la synchronisation Supabase (voir js/sync/supabase.js). */

/* Un état par code élève : plusieurs élèves peuvent partager un appareil. */
function cleEtat() {
  return 'bdi-etat-v1:' + (localStorage.getItem('bdi-session') || 'INVITE');
}

const defaut = () => ({
  code: localStorage.getItem('bdi-session') || 'INVITE',
  xp: 0,
  modules: {},             // id -> { pct, bonnes, total, xp, medaille, date }
  evenements: []           // file d'attente pour Supabase
});

let etat = null;
let cleCourante = null;

export function getEtat() {
  const cle = cleEtat();
  if (!etat || cleCourante !== cle) {
    cleCourante = cle;
    try { etat = JSON.parse(localStorage.getItem(cle)) || defaut(); }
    catch { etat = defaut(); }
    etat.code = cle.split(':')[1];
  }
  return etat;
}

function sauver() {
  localStorage.setItem(cleCourante, JSON.stringify(etat));
}

/* File d'événements à synchroniser (consommée par js/sync/supabase.js). */
export function prendreEvenements() {
  return getEtat().evenements;
}

export function viderEvenements(nombre) {
  getEtat().evenements.splice(0, nombre);
  sauver();
}

/* Hash déterministe -> la variante tirée est stable pour un élève donné,
   mais varie d'un élève à l'autre (limite la transmission des réponses). */
export function choisirVariante(moduleId, activiteId, nbVariantes) {
  if (nbVariantes <= 1) return 0;
  const graine = `${getEtat().code}|${moduleId}|${activiteId}`;
  let h = 5381;
  for (let i = 0; i < graine.length; i++) h = ((h << 5) + h + graine.charCodeAt(i)) >>> 0;
  return h % nbVariantes;
}

export function medaillePour(pct) {
  if (pct >= 100) return 'or';
  if (pct >= 85) return 'argent';
  if (pct >= 70) return 'bronze';   // 70 % = module validé
  return null;
}

export function enregistrerResultat(moduleId, { bonnes, total, xp }) {
  const e = getEtat();
  const pct = total ? Math.round((bonnes / total) * 100) : 0;
  const medaille = medaillePour(pct);
  const precedent = e.modules[moduleId];
  // On garde le meilleur essai ; l'XP n'est créditée que sur amélioration.
  const dejaGagne = precedent ? precedent.xp : 0;
  const gainXp = Math.max(0, xp - dejaGagne);
  e.xp += gainXp;
  if (!precedent || pct > precedent.pct) {
    e.modules[moduleId] = { pct, bonnes, total, xp: Math.max(xp, dejaGagne), medaille, date: new Date().toISOString() };
  }
  e.evenements.push({ type: 'module_termine', moduleId, pct, bonnes, total, xp, horodatage: new Date().toISOString() });
  sauver();
  return { pct, medaille, gainXp };
}

export function progressionModule(moduleId) {
  return getEtat().modules[moduleId] || null;
}

const GRADES = [
  [0, 'Recrue'], [150, 'Enquêteur·rice'], [400, 'Détective'],
  [800, 'Inspecteur·rice'], [1500, 'Commissaire']
];

export function grade() {
  const xp = getEtat().xp;
  let g = GRADES[0][1];
  for (const [seuil, nom] of GRADES) if (xp >= seuil) g = nom;
  return g;
}

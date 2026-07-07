/* Synchronisation Supabase (région UE) — sans SDK, via l'API REST (RPC).
   Voir docs/supabase.sql pour le schéma et les fonctions serveur.

   Mode dégradé (toujours actif) :
   1. Toute la progression est d'abord écrite en localStorage (state.js).
   2. Chaque résultat rejoint une file `evenements`.
   3. La file est envoyée à intervalle régulier, au retour du réseau et à
      la connexion ; elle n'est vidée qu'après accusé de réception.
   Aucune donnée nominative ne transite : code pseudonyme uniquement. */

import { CONFIG } from '../config.js';
import { prendreEvenements, viderEvenements } from '../state.js';

export function estConfigure() {
  return Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
}

async function rpc(fonction, params) {
  const reponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fonction}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(params)
  });
  if (!reponse.ok) throw new Error(`RPC ${fonction} : ${reponse.status} ${await reponse.text()}`);
  return reponse.json();
}

/* --- Connexion élève : vérifie code+PIN côté serveur, retourne un jeton. --- */
let jeton = sessionStorage.getItem('bdi-jeton') || null;

export async function connexionDistante(code, pin) {
  try {
    const resultat = await rpc('connexion_eleve', { p_code: code, p_pin: pin });
    if (!resultat || !resultat.jeton) {
      return { ok: false, erreur: resultat?.erreur || 'Code ou PIN refusé par le serveur.' };
    }
    jeton = resultat.jeton;
    sessionStorage.setItem('bdi-jeton', jeton);
    return { ok: true };
  } catch (e) {
    console.warn('Supabase injoignable, on continue en local :', e.message);
    return { ok: true, horsLigne: true };   // mode dégradé : on n'empêche jamais de travailler
  }
}

/* --- Envoi de la file d'événements. --- */
let synchroEnCours = false;

export async function synchroniser() {
  if (!estConfigure() || !jeton || !navigator.onLine || synchroEnCours) return { envoye: 0 };
  const lot = prendreEvenements();
  if (!lot.length) return { envoye: 0 };
  synchroEnCours = true;
  try {
    await rpc('enregistrer_evenements', { p_jeton: jeton, p_evenements: lot });
    viderEvenements(lot.length);
    return { envoye: lot.length };
  } catch (e) {
    console.warn('Synchronisation reportée :', e.message);
    return { envoye: 0, erreur: e.message };
  } finally {
    synchroEnCours = false;
  }
}

/* --- Tableau de bord professeur. --- */
export async function tableauProf(motDePasse, classe) {
  return rpc('tableau_prof', { p_mdp: motDePasse, p_classe: classe });
}

/* Déclencheurs : retour du réseau + intervalle régulier. */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { synchroniser(); });
  setInterval(() => { synchroniser(); }, (CONFIG.SYNC_INTERVALLE_S || 60) * 1000);
}

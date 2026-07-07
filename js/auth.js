/* Connexion par code pseudonyme + PIN.
   - Mode local (Supabase non configuré) : les comptes vivent dans le
     navigateur (hash SHA-256 du PIN, jamais le PIN en clair).
   - Mode Supabase : la vérification se fait côté serveur via RPC ; un
     double local permet de continuer hors connexion.
   Aucune donnée nominative : le code est pseudonyme, la correspondance
   code ↔ élève reste chez le professeur, hors plateforme. */

import { CONFIG } from './config.js';
import { connexionDistante, estConfigure } from './sync/supabase.js';

const CLE_SESSION = 'bdi-session';
const CLE_COMPTES = 'bdi-comptes-v1';

export async function hasherPin(pin) {
  const octets = new TextEncoder().encode('bdi:' + pin);
  const empreinte = await crypto.subtle.digest('SHA-256', octets);
  return [...new Uint8Array(empreinte)].map(o => o.toString(16).padStart(2, '0')).join('');
}

export function normaliserCode(brut) {
  return brut.trim().toUpperCase().replace(/\s+/g, '');
}

export function codeValide(code) {
  return CONFIG.FORMAT_CODE.test(code);
}

export function classeDuCode(code) {
  return code.split('-')[0];   // « 5A-XKR-07 » → « 5A »
}

export function sessionActive() {
  return localStorage.getItem(CLE_SESSION);
}

export function estInvite() {
  return sessionActive() === 'INVITE';
}

function comptesLocaux() {
  try { return JSON.parse(localStorage.getItem(CLE_COMPTES)) || {}; }
  catch { return {}; }
}

/* Un code est « nouveau » si aucun PIN ne lui est encore associé. */
export function compteExiste(code) {
  return Boolean(comptesLocaux()[code]);
}

/* Connexion (ou création du PIN à la première connexion).
   Retourne { ok, nouveau } ou { ok:false, erreur }. */
export async function connecter(code, pin) {
  const pinHash = await hasherPin(pin);
  const comptes = comptesLocaux();
  const nouveau = !comptes[code];

  if (estConfigure()) {
    const distant = await connexionDistante(code, pin);
    if (!distant.ok) return distant;   // code inconnu du prof, mauvais PIN…
  } else if (!nouveau && comptes[code] !== pinHash) {
    return { ok: false, erreur: 'Ce PIN ne correspond pas à ce code. Réessaie, ou demande à ton professeur de le réinitialiser.' };
  }

  comptes[code] = pinHash;
  localStorage.setItem(CLE_COMPTES, JSON.stringify(comptes));
  localStorage.setItem(CLE_SESSION, code);
  return { ok: true, nouveau };
}

export function connecterInvite() {
  localStorage.setItem(CLE_SESSION, 'INVITE');
}

export function deconnecter() {
  localStorage.removeItem(CLE_SESSION);
}

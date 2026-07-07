/* Configuration de la plateforme.
   Laisser SUPABASE_URL vide = mode local : tout reste dans le navigateur
   (localStorage), aucune donnée n'est envoyée nulle part.
   Pour brancher Supabase (région UE) : voir docs/deploiement.md. */

export const CONFIG = {
  SUPABASE_URL: '',        // ex. 'https://xxxx.supabase.co'
  SUPABASE_ANON_KEY: '',   // clé « anon » du projet (publique)

  /* Format des codes élèves distribués par le professeur : 5A-XKR-07 */
  FORMAT_CODE: /^[3-6][A-Z]-[A-Z0-9]{3}-[0-9]{2}$/,

  /* Synchronisation : toutes les N secondes quand le réseau est là. */
  SYNC_INTERVALLE_S: 60
};

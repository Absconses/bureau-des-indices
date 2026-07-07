/* Moteur de module : enchaîne les activités d'un module JSON,
   cumule le score et affiche l'écran de résultat. */

import { el, barreProgression, toast } from './ui.js';
import { choisirVariante, enregistrerResultat, medaillePour } from './state.js';

/* Registre des types d'activités. Ajouter un type = ajouter une ligne. */
const TYPES = {
  qcm: () => import('./activities/qcm.js'),
  tri: () => import('./activities/tri.js'),
  gonogo: () => import('./activities/gonogo.js'),
  zone: () => import('./activities/zone.js'),
  ordre: () => import('./activities/ordre.js'),
  paires: () => import('./activities/paires.js'),
  trous: () => import('./activities/trous.js'),
  surligner: () => import('./activities/surligner.js'),
  hotspots: () => import('./activities/hotspots.js'),
  defile: () => import('./activities/defile.js'),
  chat: () => import('./activities/chat.js'),
  'h5p-embed': () => import('./activities/h5p-embed.js')
};

export async function jouerModule(racine, module_, { onQuitter, onSuivant }) {
  const total = module_.activites.length;
  let bonnes = 0, questions = 0, xp = 0;

  racine.replaceChildren();
  const infoEtape = el('p', { class: 'lecteur__etape' }, '');
  const barre = el('div');
  const scene = el('div', { class: 'lecteur__scene' });
  const boutonQuitter = el('button', { class: 'lecteur__quitter', type: 'button', 'aria-label': 'Quitter le module' }, '✕');
  boutonQuitter.addEventListener('click', () => {
    if (confirm('Quitter le module ? Ta progression sur ce module ne sera pas enregistrée.')) onQuitter();
  });
  racine.append(
    el('header', { class: 'lecteur__tete' }, boutonQuitter,
      el('div', { class: 'lecteur__infos' }, infoEtape, barre)),
    scene
  );

  for (let i = 0; i < total; i++) {
    const activite = module_.activites[i];
    infoEtape.textContent = `${module_.titre} · Pièce ${i + 1}/${total}`;
    barre.replaceChildren(barreProgression(Math.round((i / total) * 100), '--d2', true));

    const indexVariante = choisirVariante(module_.id, activite.id, activite.variantes.length);
    const variante = activite.variantes[indexVariante];
    const { run } = await TYPES[activite.type]();
    const resultat = await run(scene, variante, {
      documents: module_.documents || {},
      xpParReussite: activite.xpParReussite,
      activiteId: `${module_.id}.${activite.id}`
    });
    bonnes += resultat.bonnes;
    questions += resultat.total;
    xp += resultat.xp;
    scene.replaceChildren();
    window.scrollTo(0, 0);
  }

  /* --- Écran de résultat --- */
  const { pct, medaille, gainXp } = enregistrerResultat(module_.id, { bonnes, total: questions, xp });
  const labelsMedaille = { or: 'OR', argent: 'ARGENT', bronze: 'BRONZE' };
  const valide = medaille !== null;

  racine.replaceChildren(el('div', { class: 'ecran resultat' },
    el('p', { class: 'label-mono' }, `${module_.titre} · module terminé`),
    el('div', { class: `medal medal--${medaille || 'aucune'}` },
      el('div', { class: 'medal__inner' },
        valide ? `AFFAIRE\nCLASSÉE\n· ${labelsMedaille[medaille]} ·` : 'AFFAIRE\nÀ REPRENDRE')),
    el('h1', { class: 'resultat__titre' }, valide ? 'Enquête bouclée !' : 'Presque…'),
    el('p', { class: 'resultat__detail' },
      valide
        ? `Tu as validé l'objectif : « ${module_.objectif} »`
        : `Il te faut au moins 70 % de bonnes réponses pour classer l'affaire. Rejoue le module : les indices changent parfois !`),
    el('div', { class: 'resultat__stats' },
      el('div', { class: 'stat' }, el('b', {}, `${bonnes}/${questions}`), el('span', {}, 'Bonnes réponses')),
      el('div', { class: 'stat' }, el('b', { class: 'xp' }, `+${gainXp}`), el('span', {}, 'XP gagnés'))
    ),
    el('div', { class: 'resultat__actions' },
      el('button', { class: 'btn-primary', type: 'button', onclick: onSuivant }, 'Retour au dossier →'),
      !valide && el('button', {
        class: 'btn-secondary', type: 'button',
        onclick: () => jouerModule(racine, module_, { onQuitter, onSuivant })
      }, 'Rejouer le module')
    )
  ));
  window.scrollTo(0, 0);
}

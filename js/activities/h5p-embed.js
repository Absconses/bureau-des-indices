/* Embarque un contenu H5P (bibliothèque Lümi) via h5p-standalone, hébergé
   en même origine dans /h5p/, et capte ses événements xAPI pour créditer
   la progression.
   Une variante = { dossier: "h5p/mon-contenu" (contenu .h5p extrait),
                    titre?, consigne? }
   Score : dernier événement xAPI completed/answered portant un result.score
   → bonnes/total ; XP = % de réussite × xpParReussite. */

import { el } from '../ui.js';

let chargement = null;
function chargerBibliotheque() {
  if (window.H5PStandalone) return Promise.resolve();
  if (chargement) return chargement;
  chargement = new Promise((resoudre, rejeter) => {
    const script = document.createElement('script');
    script.src = 'h5p/lib/main.bundle.js';
    script.onload = resoudre;
    script.onerror = () => rejeter(new Error('h5p/lib/main.bundle.js introuvable'));
    document.head.append(script);
  });
  return chargement;
}

export async function run(scene, variante, ctx) {
  scene.replaceChildren(
    el('p', { class: 'consigne' },
      el('small', {}, 'Activité interactive'),
      variante.consigne || variante.titre || 'À toi de jouer !')
  );
  const conteneur = el('div', { class: 'piece', style: 'padding:0' });
  scene.append(conteneur);

  await chargerBibliotheque();
  await new window.H5PStandalone.H5P(conteneur, {
    h5pJsonPath: variante.dossier,
    frameJs: 'h5p/lib/frame.bundle.js',
    frameCss: 'h5p/lib/h5p.css',
    frame: false,
    copyright: false, embed: false, download: false, fullScreen: false
  });

  /* Capture xAPI : on attend un « completed » (ou un « answered » racine). */
  const resultat = await new Promise(resoudre => {
    const recepteur = evenement => {
      const declaration = evenement.data.statement;
      const verbe = declaration.verb?.display?.['en-US'] || '';
      const estRacine = !declaration.context?.contextActivities?.parent?.length;
      if (declaration.result?.score && (verbe === 'completed' || (verbe === 'answered' && estRacine))) {
        window.H5P.externalDispatcher.off('xAPI', recepteur);
        resoudre(declaration.result.score);   // { raw, max, scaled }
      }
    };
    window.H5P.externalDispatcher.on('xAPI', recepteur);
  });

  const bonnes = resultat.raw ?? 0;
  const total = resultat.max ?? 1;
  const xp = Math.round((resultat.scaled ?? bonnes / total) * ctx.xpParReussite * total);

  const suite = el('button', { class: 'btn-primary', type: 'button', style: 'margin-top:16px' },
    `Pièce suivante · ${bonnes}/${total} →`);
  scene.append(suite);
  suite.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  await new Promise(r => suite.addEventListener('click', r, { once: true }));

  return { bonnes, total, xp };
}

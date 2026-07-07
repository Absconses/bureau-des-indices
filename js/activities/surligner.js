/* Surligner les mots pertinents dans un texte.
   Une variante = { consigne, texte: "mots *cibles* entre astérisques",
                    feedbackOk, feedbackKo }
   Score : +1 par cible trouvée, -1 par mot surligné à tort (minimum 0). */

import { el, toast } from '../ui.js';

export async function run(scene, variante, ctx) {
  scene.replaceChildren(el('p', { class: 'consigne' }, el('small', {}, 'Surligne'), variante.consigne));

  const paragraphe = el('p', { class: 'surligner__texte' });
  const mots = [];
  variante.texte.split(/\s+/).forEach((brut, i) => {
    const cible = /^\*.+\*[.,;:!?»)]*$/.test(brut);
    const affiche = brut.replace(/\*/g, '');
    const mot = el('span', { class: 'surligner__mot', role: 'button', tabindex: '0', dataset: { cible: cible ? '1' : '' } }, affiche);
    const basculer = () => { if (!mot.dataset.etat) mot.classList.toggle('choisi'); };
    mot.addEventListener('click', basculer);
    mot.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); basculer(); } });
    mots.push(mot);
    paragraphe.append(mot, ' ');
  });

  const valider = el('button', { class: 'btn-primary', type: 'button', style: 'margin-top:20px' }, 'Valider');
  scene.append(paragraphe, valider);
  await new Promise(r => valider.addEventListener('click', r, { once: true }));
  valider.remove();

  let trouves = 0, erreurs = 0;
  const totalCibles = mots.filter(m => m.dataset.cible).length;
  mots.forEach(m => {
    const choisi = m.classList.contains('choisi');
    if (m.dataset.cible) m.dataset.etat = choisi ? (trouves++, 'ok') : 'rate';
    else if (choisi) { m.dataset.etat = 'ko'; erreurs++; }
    m.classList.remove('choisi');
  });

  const bonnes = Math.max(0, trouves - erreurs);
  const parfait = trouves === totalCibles && erreurs === 0;
  const xp = bonnes * ctx.xpParReussite;
  await toast({
    ok: parfait,
    titre: parfait ? 'Tout trouvé !' : `${trouves}/${totalCibles} trouvé${trouves > 1 ? 's' : ''}${erreurs ? ` · ${erreurs} en trop` : ''}`,
    texte: parfait ? variante.feedbackOk : variante.feedbackKo,
    xp,
    boutonTexte: 'Pièce suivante →'
  });

  return { bonnes, total: totalCibles, xp };
}

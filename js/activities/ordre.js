/* Remise en ordre : toucher les étapes dans le bon ordre (mobile-friendly).
   Une variante = { consigne, items: [{texte}] DANS LE BON ORDRE,
                    feedbackOk, feedbackKo } — l'affichage est mélangé. */

import { el, toast } from '../ui.js';
import { getEtat } from '../state.js';

/* Mélange déterministe par élève (stable d'une session à l'autre). */
function melanger(tableau, graine) {
  let h = 2166136261;
  for (const c of graine) h = (h ^ c.charCodeAt(0)) * 16777619 >>> 0;
  const copie = tableau.map((v, i) => ({ v, i }));
  for (let i = copie.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  // Si le mélange retombe sur l'ordre exact, on décale d'un cran.
  if (copie.every((c, i) => c.i === i)) copie.push(copie.shift());
  return copie;
}

export async function run(scene, variante, ctx) {
  scene.replaceChildren();
  const ordreChoisi = [];   // indices originaux, dans l'ordre touché

  scene.append(el('p', { class: 'consigne' }, el('small', {}, 'Remets dans l’ordre'), variante.consigne));
  const liste = el('div', { class: 'ordre__liste' });
  const valider = el('button', { class: 'btn-primary', type: 'button', disabled: true, style: 'margin-top:20px' }, 'Valider l’ordre');
  scene.append(liste,
    el('p', { class: 'tri__indication' }, 'Touche les étapes dans l’ordre · retouche pour annuler'),
    valider);

  const affiches = melanger(variante.items, getEtat().code + ctx.activiteId);
  const boutons = affiches.map(({ v, i }) => {
    const bouton = el('button', { class: 'ordre__item', type: 'button', dataset: { original: i } },
      el('span', { class: 'numero' }, '·'), v.texte);
    bouton.addEventListener('click', () => {
      if (bouton.dataset.etat) return;
      const position = ordreChoisi.indexOf(i);
      if (position >= 0) ordreChoisi.splice(position, 1);
      else ordreChoisi.push(i);
      boutons.forEach(b => {
        const pos = ordreChoisi.indexOf(Number(b.dataset.original));
        b.classList.toggle('choisi', pos >= 0);
        b.querySelector('.numero').textContent = pos >= 0 ? String(pos + 1) : '·';
      });
      valider.disabled = ordreChoisi.length !== variante.items.length;
    });
    liste.append(bouton);
    return bouton;
  });

  await new Promise(r => valider.addEventListener('click', r, { once: true }));

  let bonnes = 0;
  boutons.forEach(b => {
    const original = Number(b.dataset.original);
    const place = ordreChoisi.indexOf(original);
    const juste = place === original;
    if (juste) bonnes++;
    b.dataset.etat = juste ? 'ok' : 'ko';
    b.disabled = true;
    if (!juste) b.append(el('span', { class: 'place-attendue' }, `→ étape ${original + 1}`));
  });
  valider.remove();
  // On réordonne l'affichage pour montrer le bon ordre.
  [...boutons].sort((a, b) => a.dataset.original - b.dataset.original).forEach(b => liste.append(b));

  const parfait = bonnes === variante.items.length;
  await toast({
    ok: parfait,
    titre: parfait ? 'Ordre parfait !' : `${bonnes} étape${bonnes > 1 ? 's' : ''} bien placée${bonnes > 1 ? 's' : ''} sur ${variante.items.length}`,
    texte: parfait ? variante.feedbackOk : variante.feedbackKo,
    xp: bonnes * ctx.xpParReussite,
    boutonTexte: 'Pièce suivante →'
  });

  return { bonnes, total: variante.items.length, xp: bonnes * ctx.xpParReussite };
}

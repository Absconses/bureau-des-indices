/* Points d'intérêt : explorer un document en touchant des pastilles numérotées.
   Activité de découverte : non notée (0/0), XP forfaitaire une fois tout vu.
   Une variante = { document, consigne, points: [{zone, titre, texte}] } */

import { el } from '../ui.js';
import { rendreDocument } from '../docsim.js';

export async function run(scene, variante, ctx) {
  scene.replaceChildren(el('p', { class: 'consigne' }, el('small', {}, 'Explore la pièce'), variante.consigne));

  const doc = rendreDocument(ctx.documents[variante.document]);
  const boite = el('div', { class: 'piece' }, el('div', { class: 'piece__bandeau' }, '🔍 Pièce à examiner'), doc);
  const carte = el('div', { class: 'hotspot__carte', role: 'status', hidden: true });
  const reste = el('p', { class: 'hotspot__reste label-mono' }, '');
  scene.append(boite, carte, reste);

  let vus = 0;
  const total = variante.points.length;
  const majReste = () => {
    reste.textContent = vus < total
      ? `${total - vus} point${total - vus > 1 ? 's' : ''} d'intérêt à découvrir`
      : 'Tout est découvert !';
  };
  majReste();

  const fini = new Promise(resoudre => {
    variante.points.forEach((point, i) => {
      const hote = doc.querySelector(`[data-zone="${point.zone}"]`);
      if (!hote) { console.warn('Zone introuvable :', point.zone); return; }
      hote.classList.add('zone-hotspot');
      const pastille = el('button', {
        class: 'hotspot__pastille', type: 'button',
        style: 'top:-10px;right:-6px', 'aria-label': `Point d'intérêt ${i + 1}`
      }, String(i + 1));
      pastille.addEventListener('click', () => {
        carte.hidden = false;
        carte.replaceChildren(el('b', {}, `${i + 1} · ${point.titre}`), el('p', {}, point.texte));
        if (!pastille.classList.contains('vu')) {
          pastille.classList.add('vu');
          vus++;
          majReste();
          if (vus === total) resoudre();
        }
        carte.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      hote.append(pastille);
    });
  });

  await fini;
  const xp = ctx.xpParReussite;
  const terminer = el('button', { class: 'btn-primary', type: 'button', style: 'margin-top:16px' }, `Pièce suivante · +${xp} XP →`);
  scene.append(terminer);
  terminer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  await new Promise(r => terminer.addEventListener('click', r, { once: true }));

  /* Découverte : ne compte pas dans le % de réussite, crédite l'XP forfaitaire. */
  return { bonnes: 0, total: 0, xp };
}

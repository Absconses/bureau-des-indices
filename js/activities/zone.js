/* « Trouve la zone » : cliquer l'endroit précis d'un document simulé.
   Une variante = { document, consigne, cibles: [zoneId...], essaisMax,
                    indices: [après 1er raté, après 2e raté], feedbackOk, feedbackKo } */

import { el, toast } from '../ui.js';
import { rendreDocument } from '../docsim.js';

export async function run(scene, variante, ctx) {
  scene.replaceChildren();

  const consigne = el('p', { class: 'consigne' }, el('small', {}, 'Fouille la pièce'), variante.consigne);
  const doc = rendreDocument(ctx.documents[variante.document]);
  doc.classList.add('docsim--cliquable');
  const boite = el('div', { class: 'piece' },
    el('div', { class: 'piece__bandeau' }, '🔍 Pièce à examiner — touche directement la page'),
    doc);
  const indice = el('p', { class: 'sous-titre', role: 'status', style: 'margin-top:12px' });
  scene.append(consigne, boite, indice);

  let essais = 0;
  const trouve = await new Promise(resoudre => {
    doc.addEventListener('click', ev => {
      const zone = ev.target.closest('[data-zone]');
      if (!zone || doc.dataset.fini) return;
      const ok = variante.cibles.includes(zone.dataset.zone);
      if (ok) {
        doc.dataset.fini = '1';
        zone.classList.add('zone-ok');
        resoudre(true);
        return;
      }
      essais++;
      zone.classList.add('zone-ko');
      setTimeout(() => zone.classList.remove('zone-ko'), 400);
      if (essais >= variante.essaisMax) {
        doc.dataset.fini = '1';
        // On révèle la bonne zone pour que l'élève la voie quand même.
        variante.cibles.forEach(c => doc.querySelector(`[data-zone="${c}"]`)?.classList.add('zone-ok'));
        resoudre(false);
      } else {
        indice.textContent = '💡 ' + (variante.indices[essais - 1] || variante.indices.at(-1) || 'Cherche encore…');
      }
    });
  });

  await toast({
    ok: trouve,
    titre: trouve ? (essais === 0 ? 'Du premier coup !' : 'Trouvé !') : 'La zone était là 👇',
    texte: trouve ? variante.feedbackOk : variante.feedbackKo,
    xp: trouve ? ctx.xpParReussite : 0,
    boutonTexte: 'Terminer →'
  });

  return { bonnes: trouve ? 1 : 0, total: 1, xp: trouve ? ctx.xpParReussite : 0 };
}

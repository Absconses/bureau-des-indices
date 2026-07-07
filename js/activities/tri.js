/* Glisser-déposer catégoriel, façon BeDiCi : une carte à la fois,
   des piles en bas d'écran. Deux gestes possibles :
   - glisser la carte du doigt jusqu'à une pile (Pointer Events) ;
   - toucher directement une pile (accessible, une main).
   Une variante = { consigne, categories: [{id,label}], items: [{texte,categorie,feedbackOk,feedbackKo}] } */

import { el, toast } from '../ui.js';

export async function run(scene, variante, ctx) {
  let bonnes = 0;
  let xp = 0;
  const items = variante.items;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    scene.replaceChildren();

    scene.append(
      el('p', { class: 'consigne' }, el('small', {}, `Indice ${i + 1} sur ${items.length}`), variante.consigne),
      el('p', { class: 'tri__restants label-mono' }, `${items.length - i} indice${items.length - i > 1 ? 's' : ''} à trier`)
    );

    const carte = el('div', { class: 'tri__carte', tabindex: '0', role: 'group', 'aria-label': 'Indice à trier : ' + item.texte }, item.texte);
    const piles = el('div', { class: 'tri__piles' });
    scene.append(carte, el('p', { class: 'tri__indication' }, 'Glisse la carte sur une pile — ou touche la pile'), piles);

    const choix = await new Promise(resoudre => {
      const boutonsPiles = variante.categories.map(cat => {
        const p = el('button', { class: 'tri__pile', type: 'button', dataset: { cat: cat.id } },
          cat.label, el('span', { class: 'compte' }, 'dépose ici'));
        p.addEventListener('click', () => resoudre(cat.id));
        piles.append(p);
        return p;
      });

      /* Glisser au doigt / à la souris */
      carte.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        carte.setPointerCapture(ev.pointerId);
        carte.classList.add('saisie');
        const rect = carte.getBoundingClientRect();
        const dx = ev.clientX - rect.left, dy = ev.clientY - rect.top;
        let pileSurvolee = null;

        const bouger = e => {
          carte.style.position = 'fixed';
          carte.style.width = rect.width + 'px';
          carte.style.left = (e.clientX - dx) + 'px';
          carte.style.top = (e.clientY - dy) + 'px';
          pileSurvolee = null;
          for (const p of boutonsPiles) {
            const r = p.getBoundingClientRect();
            const dedans = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
            p.classList.toggle('survolee', dedans);
            if (dedans) pileSurvolee = p;
          }
        };
        const lacher = () => {
          carte.removeEventListener('pointermove', bouger);
          carte.removeEventListener('pointerup', lacher);
          carte.removeEventListener('pointercancel', lacher);
          carte.classList.remove('saisie');
          boutonsPiles.forEach(p => p.classList.remove('survolee'));
          if (pileSurvolee) resoudre(pileSurvolee.dataset.cat);
          else { carte.style.position = ''; carte.style.left = ''; carte.style.top = ''; carte.style.width = ''; }
        };
        carte.addEventListener('pointermove', bouger);
        carte.addEventListener('pointerup', lacher);
        carte.addEventListener('pointercancel', lacher);
      });
    });

    const ok = choix === item.categorie;
    const labelBon = variante.categories.find(c => c.id === item.categorie).label;
    await toast({
      ok,
      titre: ok ? 'Bien trié !' : `C'était : ${labelBon}`,
      texte: ok ? item.feedbackOk : item.feedbackKo,
      xp: ok ? ctx.xpParReussite : 0,
      boutonTexte: i < items.length - 1 ? 'Indice suivant →' : 'Pièce suivante →'
    });
    if (ok) { bonnes++; xp += ctx.xpParReussite; }
  }

  return { bonnes, total: items.length, xp };
}

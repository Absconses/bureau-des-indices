/* Appariement de paires : une carte s'affiche, l'élève choisit sa moitié
   parmi les cartes restantes.
   Une variante = { consigne, paires: [{gauche, droite, feedbackOk, feedbackKo}] } */

import { el, toast } from '../ui.js';
import { getEtat } from '../state.js';

function melanger(tableau, graine) {
  let h = 2166136261;
  for (const c of graine) h = (h ^ c.charCodeAt(0)) * 16777619 >>> 0;
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

export async function run(scene, variante, ctx) {
  let bonnes = 0, xp = 0;
  const restantes = melanger(variante.paires.map(p => p.droite), getEtat().code + ctx.activiteId);

  for (let i = 0; i < variante.paires.length; i++) {
    const paire = variante.paires[i];
    scene.replaceChildren(
      el('p', { class: 'consigne' }, el('small', {}, `Paire ${i + 1} sur ${variante.paires.length}`), variante.consigne),
      el('div', { class: 'paires__gauche' }, paire.gauche)
    );
    const choix = el('div', { class: 'reponses' });
    scene.append(choix);

    const ok = await new Promise(resoudre => {
      restantes.forEach(droite => {
        const bouton = el('button', { class: 'btn-answer', type: 'button' },
          el('span', { class: 'marque', 'aria-hidden': 'true' }, '↔'), droite);
        bouton.addEventListener('click', async () => {
          const juste = droite === paire.droite;
          [...choix.children].forEach(b => {
            const texte = b.childNodes[1].textContent;
            if (texte === paire.droite) { b.dataset.state = 'correct'; b.querySelector('.marque').textContent = '✓'; }
            else if (b === bouton) { b.dataset.state = 'wrong'; b.querySelector('.marque').textContent = '✕'; }
            else b.dataset.state = 'dimmed';
            b.disabled = true;
          });
          await toast({
            ok: juste,
            titre: juste ? 'Bonne paire !' : 'Pas celle-là…',
            texte: juste ? paire.feedbackOk : paire.feedbackKo,
            xp: juste ? ctx.xpParReussite : 0,
            boutonTexte: i < variante.paires.length - 1 ? 'Paire suivante →' : 'Pièce suivante →'
          });
          resoudre(juste);
        });
        choix.append(bouton);
      });
    });

    // La bonne moitié est consommée, même en cas d'erreur (elle a été révélée).
    restantes.splice(restantes.indexOf(paire.droite), 1);
    if (ok) { bonnes++; xp += ctx.xpParReussite; }
  }

  return { bonnes, total: variante.paires.length, xp };
}

/* QCM à réponse unique, avec ou sans document support.
   Une variante = { document?, questions: [{ question, options, bonnes, feedbackOk, feedbackKo }] } */

import { el, toast } from '../ui.js';
import { pieceAExaminer } from '../docsim.js';

export async function run(scene, variante, ctx) {
  let bonnes = 0;
  const total = variante.questions.length;
  let xp = 0;

  for (let qi = 0; qi < total; qi++) {
    const q = variante.questions[qi];
    scene.replaceChildren();

    if (variante.document) {
      scene.append(pieceAExaminer(ctx.documents[variante.document]));
    }

    const consigne = el('p', { class: 'consigne' },
      el('small', {}, total > 1 ? `Question ${qi + 1} sur ${total}` : 'Question'),
      q.question);
    const listeReponses = el('div', { class: 'reponses', role: 'group', 'aria-label': q.question });
    scene.append(consigne, listeReponses);

    const reussi = await new Promise(resoudre => {
      q.options.forEach((opt, i) => {
        const bouton = el('button', { class: 'btn-answer', type: 'button' },
          el('span', { class: 'marque', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
          opt);
        bouton.addEventListener('click', async () => {
          if (bouton.dataset.state) return;   // déjà répondu
          const ok = q.bonnes.includes(i);
          [...listeReponses.children].forEach((b, j) => {
            if (q.bonnes.includes(j)) {
              b.dataset.state = 'correct';
              b.querySelector('.marque').textContent = '✓';
              if (!ok) b.append(el('span', { class: 'etiquette-etat' }, 'la bonne réponse'));
            } else if (j === i) {
              b.dataset.state = 'wrong';
              b.querySelector('.marque').textContent = '✕';
              b.append(el('span', { class: 'etiquette-etat' }, 'ton choix'));
            } else {
              b.dataset.state = 'dimmed';
            }
            b.disabled = true;
          });
          await toast({
            ok,
            titre: ok ? 'Bonne réponse !' : 'Pas tout à fait…',
            texte: ok ? q.feedbackOk : q.feedbackKo,
            xp: ok ? ctx.xpParReussite : 0,
            boutonTexte: qi < total - 1 ? 'Question suivante →' : 'Pièce suivante →'
          });
          resoudre(ok);
        });
        listeReponses.append(bouton);
      });
    });

    if (reussi) { bonnes++; xp += ctx.xpParReussite; }
  }

  return { bonnes, total, xp };
}

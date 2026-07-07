/* Conversation simulée type messagerie : fil scripté, l'élève choisit ses
   réponses parmi des propositions (pas d'IA).
   Une variante = { contact: {nom, avatar}, etapes: [
     { de: "eux"|"info", texte }                          -> bulle affichée
     { choix: [{texte, ok, feedback}] }                   -> l'élève répond
   ] } */

import { el, toast } from '../ui.js';

const attendre = ms => new Promise(r => setTimeout(r, ms));

export async function run(scene, variante, ctx) {
  scene.replaceChildren();
  let bonnes = 0, xp = 0, totalChoix = 0;

  const fil = el('div', { class: 'chat__fil', role: 'log', 'aria-label': 'Conversation' });
  scene.append(
    el('p', { class: 'consigne' },
      el('small', {}, '💬 Messagerie'),
      `${variante.contact.avatar || '👤'} ${variante.contact.nom}`),
    fil
  );
  const zoneChoix = el('div', { class: 'chat__choix' });
  scene.append(zoneChoix);

  const bulle = (de, texte) => {
    const b = el('div', { class: `chat__bulle chat__bulle--${de === 'moi' ? 'moi' : 'eux'}` }, texte);
    fil.append(b);
    b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return b;
  };

  for (const etape of variante.etapes) {
    if (etape.texte) {
      await attendre(500);
      bulle(etape.de || 'eux', etape.texte);
      continue;
    }
    if (!etape.choix) continue;
    totalChoix++;
    await attendre(400);
    zoneChoix.replaceChildren(el('p', { class: 'legende label-mono' }, 'Que réponds-tu ?'));
    const choisi = await new Promise(resoudre => {
      etape.choix.forEach(option => {
        const bouton = el('button', { class: 'btn-answer', type: 'button' },
          el('span', { class: 'marque', 'aria-hidden': 'true' }, '➤'), option.texte);
        bouton.addEventListener('click', () => resoudre(option));
        zoneChoix.append(bouton);
      });
    });
    zoneChoix.replaceChildren();
    bulle('moi', choisi.texte);
    await attendre(400);
    await toast({
      ok: choisi.ok,
      titre: choisi.ok ? 'Bon réflexe !' : 'Pas le bon réflexe…',
      texte: choisi.feedback,
      xp: choisi.ok ? ctx.xpParReussite : 0,
      boutonTexte: 'Continuer →'
    });
    if (choisi.ok) { bonnes++; xp += ctx.xpParReussite; }
  }

  await attendre(400);
  const fin = el('button', { class: 'btn-primary', type: 'button', style: 'margin-top:20px' }, 'Pièce suivante →');
  scene.append(fin);
  fin.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  await new Promise(r => fin.addEventListener('click', r, { once: true }));

  return { bonnes, total: totalChoix, xp };
}

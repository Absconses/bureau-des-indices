/* Texte à trous : glisser des étiquettes dans les blancs (ici : toucher
   une étiquette remplit le premier blanc libre ; toucher un blanc le vide).
   Une variante = { consigne, texte: "… {1} … {2} …", etiquettes: [mots + leurres],
                    reponses: ["mot du blanc 1", "mot du blanc 2"], feedbackOk, feedbackKo } */

import { el, toast } from '../ui.js';

export async function run(scene, variante, ctx) {
  scene.replaceChildren(el('p', { class: 'consigne' }, el('small', {}, 'Complète le texte'), variante.consigne));

  const blancs = [];
  const paragraphe = el('p', { class: 'trous__texte' });
  variante.texte.split(/(\{\d+\})/).forEach(morceau => {
    const m = morceau.match(/^\{(\d+)\}$/);
    if (m) {
      const blanc = el('button', { class: 'trous__blanc', type: 'button', dataset: { n: m[1] }, 'aria-label': `Trou ${m[1]}` }, '');
      blancs[Number(m[1]) - 1] = blanc;
      paragraphe.append(blanc);
    } else {
      paragraphe.append(morceau);
    }
  });

  const banque = el('div', { class: 'trous__banque' });
  const valider = el('button', { class: 'btn-primary', type: 'button', disabled: true, style: 'margin-top:20px' }, 'Valider');
  scene.append(paragraphe,
    el('p', { class: 'tri__indication' }, 'Touche une étiquette pour remplir · touche un trou pour vider'), banque, valider);

  const etiquettes = variante.etiquettes.map(mot => {
    const chip = el('button', { class: 'trous__etiquette', type: 'button' }, mot);
    chip.addEventListener('click', () => {
      const libre = blancs.find(b => !b.textContent);
      if (!libre || chip.disabled) return;
      libre.textContent = mot;
      libre.classList.add('rempli');
      chip.disabled = true;
      valider.disabled = blancs.some(b => !b.textContent);
    });
    banque.append(chip);
    return chip;
  });

  blancs.forEach(blanc => blanc.addEventListener('click', () => {
    if (blanc.dataset.etat || !blanc.textContent) return;
    const chip = etiquettes.find(c => c.disabled && c.textContent === blanc.textContent);
    if (chip) chip.disabled = false;
    blanc.textContent = '';
    blanc.classList.remove('rempli');
    valider.disabled = true;
  }));

  await new Promise(r => valider.addEventListener('click', r, { once: true }));

  let bonnes = 0;
  blancs.forEach((blanc, i) => {
    const juste = blanc.textContent === variante.reponses[i];
    if (juste) bonnes++;
    blanc.dataset.etat = juste ? 'ok' : 'ko';
    blanc.disabled = true;
    if (!juste) blanc.after(el('span', { class: 'trous__correction' }, ` → ${variante.reponses[i]}`));
  });
  valider.remove();
  etiquettes.forEach(c => (c.disabled = true));

  const parfait = bonnes === blancs.length;
  const xp = bonnes * ctx.xpParReussite;
  await toast({
    ok: parfait,
    titre: parfait ? 'Texte complet !' : `${bonnes} trou${bonnes > 1 ? 's' : ''} sur ${blancs.length}`,
    texte: parfait ? variante.feedbackOk : variante.feedbackKo,
    xp,
    boutonTexte: 'Pièce suivante →'
  });

  return { bonnes, total: blancs.length, xp };
}

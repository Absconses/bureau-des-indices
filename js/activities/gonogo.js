/* GO / NO GO : vrai ou faux en temps limité, sur fond sombre (mode chrono).
   Une variante = { consigne, tempsParQuestion, enonces: [{texte, vrai, feedback}] } */

import { el } from '../ui.js';

const RAYON = 40;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

export async function run(scene, variante, ctx) {
  document.body.classList.add('mode-chrono');
  try {
    let bonnes = 0;
    let xp = 0;
    const enonces = variante.enonces;

    /* Écran d'annonce du mode chrono */
    scene.replaceChildren(el('div', { class: 'chrono' },
      el('p', { class: 'consigne', style: 'color:var(--paper);text-align:center;margin-top:40px' },
        el('small', { style: 'color:var(--paper-track)' }, 'Mode chrono'),
        variante.consigne),
      el('div', { class: 'chrono__boutons' },
        el('span'),
        el('button', { class: 'btn-go', type: 'button', onclick: () => scene.dispatchEvent(new Event('go')) }, 'PRÊT ?', el('small', {}, 'Touche pour lancer'))
      )
    ));
    await new Promise(r => scene.addEventListener('go', r, { once: true }));

    for (let i = 0; i < enonces.length; i++) {
      const enonce = enonces[i];
      scene.replaceChildren();

      const nombre = el('b', {}, String(variante.tempsParQuestion));
      const cercleReste = el('circle', {});
      const compte = el('div', { class: 'chrono__compte' }, nombre);
      compte.innerHTML = `
        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
          <circle class="fond" cx="46" cy="46" r="${RAYON}" fill="none" stroke-width="6"/>
          <circle class="reste" cx="46" cy="46" r="${RAYON}" fill="none" stroke-width="6"
            stroke-dasharray="${CIRCONFERENCE}" stroke-dashoffset="0" stroke-linecap="round"/>
        </svg>`;
      compte.append(nombre);

      const zone = el('div', { class: 'chrono' },
        el('p', { class: 'label-mono', style: 'color:var(--paper-track);text-align:center' },
          `Question ${i + 1} / ${enonces.length}`),
        compte,
        el('p', { class: 'chrono__enonce' }, `« ${enonce.texte} »`),
        el('div', { class: 'chrono__boutons' },
          el('button', { class: 'btn-go', type: 'button', dataset: { rep: 'vrai' } }, '✓ GO', el('small', {}, "C'est vrai")),
          el('button', { class: 'btn-nogo', type: 'button', dataset: { rep: 'faux' } }, '✕ NO GO', el('small', {}, "C'est faux"))
        )
      );
      scene.append(zone);

      const reponse = await new Promise(resoudre => {
        const debut = performance.now();
        const duree = variante.tempsParQuestion * 1000;
        const anneau = compte.querySelector('.reste');
        let rafId;
        const tic = t => {
          const ecoule = t - debut;
          const restant = Math.max(0, duree - ecoule);
          nombre.textContent = String(Math.ceil(restant / 1000));
          anneau.style.strokeDashoffset = String(CIRCONFERENCE * (ecoule / duree));
          if (restant <= 3000) compte.classList.add('urgence');
          if (restant <= 0) { resoudre(null); return; }   // trop tard
          rafId = requestAnimationFrame(tic);
        };
        rafId = requestAnimationFrame(tic);
        zone.querySelectorAll('button').forEach(b =>
          b.addEventListener('click', () => {
            cancelAnimationFrame(rafId);
            resoudre(b.dataset.rep === 'vrai');
          }, { once: true }));
      });

      const ok = reponse !== null && reponse === enonce.vrai;
      if (ok) { bonnes++; xp += ctx.xpParReussite; }

      /* Verdict : bref si juste (le rythme prime), touche pour continuer si faux. */
      const verdict = el('div', { class: `chrono__verdict ${ok ? 'ok' : 'ko'}` },
        el('span', {},
          el('b', {}, reponse === null ? '⏰ Trop tard ! ' : ok ? '✓ ' : '✕ '),
          enonce.feedback)
      );
      zone.replaceChildren(
        el('p', { class: 'chrono__enonce' }, `« ${enonce.texte} »`),
        verdict
      );
      if (ok) {
        // Auto-avance après 2 s — ou dès que l'élève touche l'écran.
        await new Promise(r => {
          const minuteur = setTimeout(r, 2000);
          zone.addEventListener('pointerdown', () => { clearTimeout(minuteur); r(); }, { once: true });
        });
      } else {
        const suite = el('button', { class: 'btn-go', type: 'button', style: 'margin-top:16px;width:100%' },
          i < enonces.length - 1 ? 'SUITE →' : 'TERMINER →', el('small', {}, "J'ai compris"));
        zone.append(suite);
        await new Promise(r => suite.addEventListener('click', r, { once: true }));
      }
    }

    return { bonnes, total: enonces.length, xp };
  } finally {
    document.body.classList.remove('mode-chrono');
  }
}

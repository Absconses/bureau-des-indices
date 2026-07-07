/* « Clique uniquement sur les bonnes réponses » : des propositions défilent,
   il faut cliquer les bonnes et SE RETENIR devant les leurres.
   Mode chrono (fond sombre). Les leurres reproduisent de vraies techniques
   de manipulation (urgence, cadeau, compte à rebours…).
   Une variante = { consigne, tempsParProposition, propositions: [{texte, bonne, feedback}] } */

import { el } from '../ui.js';

const RAYON = 40;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

export async function run(scene, variante, ctx) {
  document.body.classList.add('mode-chrono');
  try {
    let bonnes = 0, xp = 0;
    const propositions = variante.propositions;

    scene.replaceChildren(el('div', { class: 'chrono' },
      el('p', { class: 'consigne', style: 'color:var(--paper);text-align:center;margin-top:40px' },
        el('small', { style: 'color:var(--paper-track)' }, 'Mode chrono'),
        variante.consigne),
      el('p', { style: 'color:var(--paper-track);font-size:13px;text-align:center' },
        'Si c’est un piège… ne touche à rien et laisse filer le temps !'),
      el('div', { class: 'chrono__boutons' },
        el('span'),
        el('button', { class: 'btn-go', type: 'button', onclick: () => scene.dispatchEvent(new Event('go')) }, 'PRÊT ?', el('small', {}, 'Touche pour lancer'))
      )
    ));
    await new Promise(r => scene.addEventListener('go', r, { once: true }));

    for (let i = 0; i < propositions.length; i++) {
      const proposition = propositions[i];
      scene.replaceChildren();

      const nombre = el('b', {}, String(variante.tempsParProposition));
      const compte = el('div', { class: 'chrono__compte' });
      compte.innerHTML = `
        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
          <circle class="fond" cx="46" cy="46" r="${RAYON}" fill="none" stroke-width="6"/>
          <circle class="reste" cx="46" cy="46" r="${RAYON}" fill="none" stroke-width="6"
            stroke-dasharray="${CIRCONFERENCE}" stroke-dashoffset="0" stroke-linecap="round"/>
        </svg>`;
      compte.append(nombre);

      const zone = el('div', { class: 'chrono' },
        el('p', { class: 'label-mono', style: 'color:var(--paper-track);text-align:center' },
          `Proposition ${i + 1} / ${propositions.length}`),
        compte,
        el('p', { class: 'chrono__enonce' }, `« ${proposition.texte} »`),
        el('div', { class: 'chrono__boutons', style: 'grid-template-columns:1fr' },
          el('button', { class: 'btn-go', type: 'button' }, '👆 JE CLIQUE', el('small', {}, 'Seulement si c’est fiable'))
        )
      );
      scene.append(zone);

      const aClique = await new Promise(resoudre => {
        const debut = performance.now();
        const duree = variante.tempsParProposition * 1000;
        const anneau = compte.querySelector('.reste');
        let rafId;
        const tic = t => {
          const ecoule = t - debut;
          const restant = Math.max(0, duree - ecoule);
          nombre.textContent = String(Math.ceil(restant / 1000));
          anneau.style.strokeDashoffset = String(CIRCONFERENCE * (ecoule / duree));
          if (restant <= 3000) compte.classList.add('urgence');
          if (restant <= 0) { resoudre(false); return; }   // l'élève s'est retenu
          rafId = requestAnimationFrame(tic);
        };
        rafId = requestAnimationFrame(tic);
        zone.querySelector('.btn-go').addEventListener('click', () => {
          cancelAnimationFrame(rafId);
          resoudre(true);
        }, { once: true });
      });

      const ok = aClique === proposition.bonne;
      if (ok) { bonnes++; xp += ctx.xpParReussite; }

      const entete = proposition.bonne
        ? (ok ? '✓ Bien cliqué ! ' : '✕ Il fallait cliquer ! ')
        : (ok ? '✓ Bien retenu, c’était un piège ! ' : '✕ Aïe, c’était un piège… ');
      const verdict = el('div', { class: `chrono__verdict ${ok ? 'ok' : 'ko'}` },
        el('span', {}, el('b', {}, entete), proposition.feedback));
      zone.replaceChildren(el('p', { class: 'chrono__enonce' }, `« ${proposition.texte} »`), verdict);

      if (ok) {
        // Auto-avance après 2 s — ou dès que l'élève touche l'écran.
        await new Promise(r => {
          const minuteur = setTimeout(r, 2000);
          zone.addEventListener('pointerdown', () => { clearTimeout(minuteur); r(); }, { once: true });
        });
      } else {
        const suite = el('button', { class: 'btn-go', type: 'button', style: 'margin-top:16px;width:100%' },
          i < propositions.length - 1 ? 'SUITE →' : 'TERMINER →', el('small', {}, "J'ai compris"));
        zone.append(suite);
        await new Promise(r => suite.addEventListener('click', r, { once: true }));
      }
    }

    return { bonnes, total: propositions.length, xp };
  } finally {
    document.body.classList.remove('mode-chrono');
  }
}

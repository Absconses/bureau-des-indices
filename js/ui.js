/* Petits utilitaires DOM + composants partagés. */

export function el(tag, attrs = {}, ...enfants) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else n.setAttribute(k, v);
  }
  for (const e of enfants.flat()) {
    if (e == null || e === false || e === true) continue;
    n.append(e.nodeType ? e : document.createTextNode(e));
  }
  return n;
}

/* Toast de feedback (bandeau bas). Résout la promesse quand l'élève continue.
   options : { ok, titre, texte, xp, boutonTexte, autoMs } */
export function toast({ ok, titre, texte, xp = 0, boutonTexte = 'Suite →', autoMs = 0 }) {
  return new Promise(resoudre => {
    const ancien = document.querySelector('.toast');
    if (ancien) ancien.remove();

    const bouton = el('button', { class: 'btn-suite', type: 'button' }, boutonTexte);
    const t = el('div', {
      class: `toast ${ok ? 'toast--ok' : 'toast--ko'}`,
      role: 'status'
    },
      el('div', { class: 'toast__title' },
        el('span', { class: 'toast__icon', style: `color:${ok ? 'var(--ok)' : 'var(--ko)'}` }, ok ? '✓' : '✕'),
        titre,
        xp > 0 ? el('span', { class: 'toast__xp' }, `+${xp} XP`) : null
      ),
      el('p', { class: 'toast__body' }, texte),
      bouton
    );
    document.body.append(t);
    requestAnimationFrame(() => t.classList.add('visible'));

    let fini = false;
    const terminer = () => {
      if (fini) return;
      fini = true;
      t.classList.remove('visible');
      setTimeout(() => t.remove(), 250);
      resoudre();
    };
    bouton.addEventListener('click', terminer);
    if (autoMs > 0) setTimeout(terminer, autoMs);
    bouton.focus({ preventScroll: true });
  });
}

export function barreProgression(pct, couleurVar = '--d2', mince = false) {
  return el('div', { class: `progress${mince ? ' progress--thin' : ''}`, role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 },
    el('div', { class: 'progress__fill', style: `width:${pct}%;background:var(${couleurVar})` })
  );
}

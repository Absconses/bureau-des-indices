/* Écran professeur : couverture objectifs × élèves.
   - Mode local : lit les progressions enregistrées sur CET appareil
     (utile pour tester ; en classe, chaque élève est sur son appareil).
   - Mode Supabase : tableau complet de la classe via RPC, protégé par le
     mot de passe professeur (vérifié côté serveur, jamais stocké ici). */

import { el } from './ui.js';
import { getProgramme } from './content.js';
import { estConfigure, tableauProf } from './sync/supabase.js';
import { connecterProf } from './auth.js';

function badge(medaille, pct) {
  const codes = { or: 'OR', argent: 'AR', bronze: 'BR' };
  if (medaille) return el('span', { class: `prof__badge prof__badge--${medaille}`, title: `${pct} %` }, codes[medaille]);
  if (pct != null) return el('span', { class: 'prof__badge prof__badge--encours', title: `${pct} %` }, 'EC');
  return el('span', { class: 'prof__badge prof__badge--vide' }, '—');
}

function collecterLocal() {
  const eleves = [];
  for (let i = 0; i < localStorage.length; i++) {
    const cle = localStorage.key(i);
    if (!cle.startsWith('bdi-etat-v1:')) continue;
    try {
      const etat = JSON.parse(localStorage.getItem(cle));
      const code = cle.split(':')[1];
      const dates = Object.values(etat.modules || {}).map(m => m.date).sort();
      eleves.push({
        code,
        classe: code.includes('-') ? code.split('-')[0] : '—',
        xp: etat.xp || 0,
        modules: etat.modules || {},
        derniere: dates.at(-1) || null
      });
    } catch { /* entrée corrompue : ignorée */ }
  }
  return eleves.sort((a, b) => a.code.localeCompare(b.code));
}

function rendreTableau(eleves, modules) {
  if (!eleves.length) {
    return el('p', { class: 'note-demo' }, 'Aucune progression enregistrée pour l’instant.');
  }
  const tetes = el('tr', {},
    el('th', {}, 'Élève'),
    modules.map(m => el('th', { title: m.objectif }, m.id.replace('5.D2.', ''))),
    el('th', {}, 'XP'),
    el('th', {}, 'Dernière activité'));

  const lignes = eleves.map(e => el('tr', {},
    el('td', { class: 'prof__code' }, e.code),
    modules.map(m => {
      const p = e.modules[m.id];
      return el('td', {}, badge(p?.medaille || null, p ? p.pct : null));
    }),
    el('td', {}, String(e.xp)),
    el('td', { class: 'prof__date' }, e.derniere ? new Date(e.derniere).toLocaleDateString('fr-FR') : '—')));

  const synthese = el('tr', { class: 'prof__synthese' },
    el('td', {}, '% validation'),
    modules.map(m => {
      const valides = eleves.filter(e => e.modules[m.id]?.medaille).length;
      return el('td', {}, `${Math.round((valides / eleves.length) * 100)} %`);
    }),
    el('td', { colspan: '2' }, ''));

  return el('div', { class: 'prof__defilement' },
    el('table', { class: 'prof__table' }, el('thead', {}, tetes), el('tbody', {}, lignes, synthese)));
}

export async function ecranProf(app) {
  const programme = await getProgramme();
  let parcoursActif = programme.parcours[0].id;
  const modulesDe = id => (programme.parcours.find(p => p.id === id)?.domaines || [])
    .flatMap(d => d.rubriques).flatMap(r => r.modules).filter(m => m.disponible);

  const contenu = el('div', {});
  let dernieresDonnees = null;

  const afficher = (eleves, source) => {
    dernieresDonnees = { eleves, source };
    const pills = programme.parcours.length > 1 && el('div', { class: 'pills', style: 'margin:12px 0' },
      programme.parcours.map(p => el('button', {
        class: 'pill' + (p.id === parcoursActif ? ' pill--active' : ''), type: 'button',
        onclick: () => { parcoursActif = p.id; afficher(eleves, source); }
      }, p.label)));
    contenu.replaceChildren(
      el('p', { class: 'note-demo' }, source),
      pills,
      rendreTableau(eleves, modulesDe(parcoursActif)),
      el('div', { class: 'prof__legende' },
        el('span', {}, el('b', {}, 'OR/AR/BR'), ' médaille (module validé ≥ 70 %)'),
        el('span', {}, el('b', {}, 'EC'), ' commencé, pas encore validé'),
        el('span', {}, el('b', {}, '—'), ' jamais ouvert'))
    );
  };

  if (estConfigure()) {
    const champMdp = el('input', { class: 'field', type: 'password', placeholder: 'Mot de passe professeur', 'aria-label': 'Mot de passe professeur' });
    const champClasse = el('input', { class: 'field', placeholder: 'Classe (ex. 5A)', 'aria-label': 'Classe', style: 'max-width:120px' });
    const erreur = el('p', { class: 'connexion__erreur', role: 'alert', hidden: true });
    const formulaire = el('form', { class: 'prof__acces' }, champMdp, champClasse,
      el('button', { class: 'btn-primary btn-inline', type: 'submit' }, 'Afficher'), erreur);
    formulaire.addEventListener('submit', async ev => {
      ev.preventDefault();
      erreur.hidden = true;
      try {
        const donnees = await tableauProf(champMdp.value, champClasse.value.trim().toUpperCase() || null);
        afficher(donnees, `Données Supabase — classe ${champClasse.value.trim().toUpperCase() || 'toutes'}.`);
      } catch (e) {
        erreur.textContent = 'Accès refusé ou serveur injoignable. ' + e.message;
        erreur.hidden = false;
      }
    });
    contenu.append(formulaire);
  } else {
    afficher(collecterLocal(),
      'Mode local : seules les progressions enregistrées sur CET appareil apparaissent. Une fois Supabase configuré (docs/deploiement.md), ce tableau couvrira toute la classe, protégé par mot de passe.');
  }

  const boutonModeProf = el('button', { class: 'btn-secondary', type: 'button', style: 'margin-top:24px' },
    '🎓 Explorer les modules en mode professeur');
  boutonModeProf.addEventListener('click', () => {
    connecterProf();
    location.hash = '#/';
  });

  app.replaceChildren(el('div', { class: 'ecran' },
    el('a', { class: 'retour', href: '#/' }, '← Retour'),
    el('h1', { class: 'titre-ecran' }, 'Suivi de classe'),
    el('p', { class: 'sous-titre' },
      'Couverture des objectifs du programme par élève, parcours par parcours. Chaque colonne est un objectif d’apprentissage officiel — survole les en-têtes pour le lire en entier.'),
    contenu,
    boutonModeProf,
    el('p', { class: 'sous-titre', style: 'margin-top:8px;font-size:12px' },
      'Le mode professeur ouvre les trois parcours pour préparer tes séances : ta progression d’essai reste sur cet appareil et n’entre jamais dans les statistiques de classe.')
  ));
}

/* Point d'entrée : routeur à ancres (#/) compatible GitHub Pages. */

import { el, barreProgression } from './ui.js';
import { getProgramme, getDomaine, getModule } from './content.js';
import { getEtat, grade, progressionModule } from './state.js';
import { jouerModule } from './engine.js';
import { sessionActive, estInvite, connecter, connecterInvite, deconnecter, normaliserCode, codeValide, compteExiste } from './auth.js';
import { estConfigure, synchroniser } from './sync/supabase.js';
import { ecranProf } from './prof.js';

const app = document.getElementById('app');

/* ---------- Écran : connexion ---------- */
function ecranConnexion() {
  const erreur = el('p', { class: 'connexion__erreur', role: 'alert', hidden: true });
  const champCode = el('input', {
    class: 'field', id: 'code', autocomplete: 'off', autocapitalize: 'characters',
    spellcheck: 'false', placeholder: '5A-XKR-07', 'aria-label': 'Ton code agent'
  });
  const champPin = el('input', {
    class: 'field', id: 'pin', type: 'password', inputmode: 'numeric',
    maxlength: '4', placeholder: '····', 'aria-label': 'Ton code PIN (4 chiffres)'
  });
  const champPin2 = el('input', {
    class: 'field', id: 'pin2', type: 'password', inputmode: 'numeric',
    maxlength: '4', placeholder: '····', 'aria-label': 'Confirme ton PIN'
  });
  const blocPin2 = el('div', { class: 'connexion__champ', hidden: true },
    el('label', { class: 'label-mono', for: 'pin2' }, 'Première connexion : confirme ton PIN'),
    champPin2);
  const bouton = el('button', { class: 'btn-primary', type: 'submit' }, 'Entrer dans le bureau →');

  const montrerErreur = texte => { erreur.textContent = texte; erreur.hidden = false; };

  const formulaire = el('form', { class: 'connexion__form' },
    el('div', { class: 'connexion__champ' },
      el('label', { class: 'label-mono', for: 'code' }, 'Ton code agent'), champCode),
    el('div', { class: 'connexion__champ' },
      el('label', { class: 'label-mono', for: 'pin' }, 'Ton code PIN (4 chiffres)'), champPin),
    blocPin2,
    erreur,
    bouton
  );

  formulaire.addEventListener('submit', async ev => {
    ev.preventDefault();
    erreur.hidden = true;
    const code = normaliserCode(champCode.value);
    const pin = champPin.value.trim();
    if (!codeValide(code)) return montrerErreur('Ce code ne ressemble pas à un code agent (exemple : 5A-XKR-07). Vérifie sur ta carte.');
    if (!/^\d{4}$/.test(pin)) return montrerErreur('Le PIN, c’est 4 chiffres — comme un cadenas de vélo.');

    if (!compteExiste(code) && blocPin2.hidden) {
      blocPin2.hidden = false;
      champPin2.focus();
      // En mode Supabase, un code inconnu de CET appareil peut être un élève
      // qui a déjà son PIN ailleurs : message neutre pour les deux cas.
      montrerErreur(estConfigure()
        ? 'Ce code n’a encore jamais été utilisé sur cet appareil : tape ton PIN une deuxième fois pour confirmer. (Première connexion ? Ce PIN devient ton code secret — retiens-le bien.)'
        : 'Première connexion avec ce code ! Choisis bien ton PIN (tu en auras besoin à chaque fois), puis confirme-le.');
      return;
    }
    if (!blocPin2.hidden && champPin2.value.trim() !== pin) {
      return montrerErreur('Les deux PIN ne sont pas identiques. Recommence.');
    }

    bouton.disabled = true;
    const resultat = await connecter(code, pin);
    bouton.disabled = false;
    if (!resultat.ok) return montrerErreur(resultat.erreur);
    synchroniser();
    location.hash = '#/';
    router();
  });

  app.replaceChildren(el('div', { class: 'ecran connexion' },
    el('div', { class: 'connexion__logo' },
      el('p', { class: 'boot__logo' }, 'BUREAU', el('br'), 'DES INDICES'),
      el('p', { class: 'sous-titre', style: 'margin:8px 0 0' }, 'Ton enquête sur l’info commence ici.')),
    formulaire,
    el('p', { class: 'connexion__aide' }, 'Ton code est distribué par ton professeur.'),
    el('div', { class: 'connexion__liens' },
      el('a', { href: '#/', onclick: () => { connecterInvite(); } }, 'Essayer sans code (invité)'),
      el('a', { href: '#/prof' }, 'Espace professeur'))
  ));
  champCode.focus();
}

/* ---------- Parcours courant (5e / 4e / 3e) ---------- */
function parcoursParDefaut() {
  const memorise = localStorage.getItem('bdi-parcours');
  if (memorise) return memorise;
  const code = getEtat().code;                    // « 5A-XKR-07 » → « 5e »
  return /^[345]/.test(code) ? code[0] + 'e' : '5e';
}

function choisirParcours(id) {
  localStorage.setItem('bdi-parcours', id);
}

/* ---------- Écran : tableau de bord ---------- */
async function ecranAccueil() {
  const programme = await getProgramme();
  const courant = parcoursParDefaut();
  const parcours = programme.parcours.find(p => p.id === courant) || programme.parcours[0];
  const etat = getEtat();

  const pills = programme.parcours.length > 1 && el('div', { class: 'pills', role: 'tablist', 'aria-label': 'Choix du parcours' },
    programme.parcours.map(p =>
      el('button', {
        class: 'pill' + (p.id === parcours.id ? ' pill--active' : ''),
        type: 'button', role: 'tab', 'aria-selected': String(p.id === parcours.id),
        onclick: () => { choisirParcours(p.id); ecranAccueil(); }
      }, p.label)));

  const cartes = parcours.domaines.map((d, i) => {
    const num = String(i + 1).padStart(2, '0');
    if (!d.disponible) {
      return el('div', { class: 'card card--locked' },
        el('span', { class: 'card__tag', style: 'background:var(--ink-faint)' }, `DOSSIER ${num}`),
        el('h2', { class: 'card__titre' }, d.labelEleve),
        el('p', { class: 'card__meta' }, '🔒 En préparation')
      );
    }
    const modules = d.rubriques.flatMap(r => r.modules);
    const valides = modules.filter(m => progressionModule(m.id)?.medaille).length;
    const pct = modules.length ? Math.round((valides / modules.length) * 100) : 0;
    return el('a', { class: 'card', href: `#/domaine/${parcours.id}/${d.id}` },
      el('span', { class: 'card__tag', style: `background:var(--${d.couleur})` }, `DOSSIER ${num}`),
      el('h2', { class: 'card__titre' }, d.labelEleve),
      el('p', { class: 'card__meta' }, `${valides}/${modules.length} affaires classées`),
      el('div', { class: 'card__pied' }, barreProgression(pct, `--${d.couleur}`), el('span', { class: 'card__pct' }, `${pct} %`))
    );
  });

  const boutonSortie = el('button', {
    class: 'agent__sortie', type: 'button', title: 'Changer d’agent', 'aria-label': 'Se déconnecter'
  }, '⎋');
  boutonSortie.addEventListener('click', () => {
    if (confirm('Changer d’agent ? Ta progression reste enregistrée sous ton code.')) {
      deconnecter();
      router();
    }
  });

  app.replaceChildren(el('div', { class: 'ecran' },
    el('div', { class: 'agent' },
      el('span', { class: 'agent__avatar', 'aria-hidden': 'true' }, '🕵️'),
      el('div', {},
        el('p', { class: 'agent__nom' }, estInvite() ? 'Agent invité' : 'Agent ' + etat.code),
        el('p', { class: 'agent__grade' }, 'Grade · ' + grade())),
      el('div', { class: 'agent__xp' }, el('b', {}, String(etat.xp)), el('span', {}, 'XP')),
      boutonSortie
    ),
    el('h1', { class: 'titre-ecran' }, 'Ton bureau'),
    el('p', { class: 'sous-titre' }, 'Choisis un dossier et mène l’enquête sur l’info.'),
    pills,
    el('div', { class: 'pile-cartes' }, cartes),
    (estInvite() || !estConfigure()) && el('div', { class: 'note-demo' },
      estInvite()
        ? el('span', {}, el('b', {}, 'Mode invité. '), 'Ta progression reste sur cet appareil. Avec un code distribué par ton professeur, elle compte pour ta classe.')
        : el('span', {}, el('b', {}, 'Mode local. '), 'La synchronisation Supabase n’est pas encore configurée : la progression reste sur cet appareil (voir docs/deploiement.md).'))
  ));
}

/* ---------- Écran : un domaine et ses modules ---------- */
async function ecranDomaine(parcoursId, domaineId) {
  const domaine = await getDomaine(parcoursId, domaineId);
  if (!domaine || !domaine.disponible) { location.hash = '#/'; return; }

  const sections = domaine.rubriques.map(rubrique =>
    el('section', {},
      el('h2', { class: 'label-mono', style: 'margin:24px 0 4px' }, rubrique.nom),
      el('div', { class: 'pile-cartes', style: 'margin-top:12px' },
        rubrique.modules.map(m => {
          const progression = progressionModule(m.id);
          if (!m.disponible) {
            return el('div', { class: 'card card--locked' },
              el('h3', { class: 'card__titre' }, m.titre),
              el('p', { class: 'card__objectif' }, m.objectif),
              el('p', { class: 'card__meta', style: 'margin-top:8px' }, '🔒 En préparation')
            );
          }
          const etatTexte = progression?.medaille
            ? `Classé · médaille ${progression.medaille} · ${progression.pct} %`
            : progression ? `À reprendre · ${progression.pct} %` : '± 5 min · enquête à mener';
          return el('a', { class: 'card', href: `#/module/${m.id}` },
            el('h3', { class: 'card__titre' }, m.titre),
            el('p', { class: 'card__objectif' }, m.objectif),
            el('p', { class: 'card__meta', style: 'margin-top:8px' },
              (progression?.medaille ? '🏅 ' : '▶ ') + etatTexte)
          );
        }))
    ));

  app.replaceChildren(el('div', { class: 'ecran' },
    el('a', { class: 'retour', href: '#/' }, '← Bureau'),
    el('h1', { class: 'titre-ecran' }, domaine.labelEleve),
    el('p', { class: 'sous-titre' }, `Domaine du programme : « ${domaine.nom} »`),
    sections
  ));
}

/* ---------- Écran : lecteur de module ---------- */
async function ecranModule(moduleId) {
  const module_ = await getModule(moduleId);
  app.replaceChildren();
  await jouerModule(app, module_, {
    onQuitter: () => { location.hash = `#/domaine/${module_.parcours}/${module_.domaine}`; },
    onSuivant: () => { synchroniser(); location.hash = `#/domaine/${module_.parcours}/${module_.domaine}`; }
  });
}

/* ---------- Routeur ---------- */
export async function router() {
  const morceaux = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  try {
    if (morceaux[0] === 'prof') { await ecranProf(app); }
    else if (!sessionActive()) { ecranConnexion(); }
    else if (morceaux[0] === 'domaine' && morceaux[1]) {
      // #/domaine/5e/D2 — ou ancienne forme #/domaine/D2 (parcours courant)
      if (/^[345]e$/.test(morceaux[1])) await ecranDomaine(morceaux[1], morceaux[2]);
      else await ecranDomaine(parcoursParDefaut(), morceaux[1]);
    }
    else if (morceaux[0] === 'module' && morceaux[1]) await ecranModule(morceaux[1]);
    else await ecranAccueil();
  } catch (erreur) {
    app.replaceChildren(el('div', { class: 'ecran' },
      el('h1', { class: 'titre-ecran' }, 'Oups.'),
      el('p', { class: 'sous-titre' }, String(erreur.message || erreur)),
      el('a', { class: 'btn-primary', href: '#/' }, 'Retour au bureau')
    ));
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', router);
router();
synchroniser();

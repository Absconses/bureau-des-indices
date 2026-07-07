/* Rendu des documents simulés (« pièces à examiner »).
   Chaque élément porte un attribut data-zone pour les activités
   d'exploration (« trouve la zone », points d'intérêt). */

import { el } from './ui.js';

const TEMPLATES = {
  /* Page d'article d'un site d'actualité, avec chrome de navigateur. */
  'site-article'(spec) {
    return el('div', { class: 'docsim', dataset: { template: spec.template } },
      el('div', { class: 'docsim__navbar' },
        el('span', { class: 'docsim__points', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
        el('span', { class: 'docsim__url', dataset: { zone: 'url' } }, '🔒 ' + spec.url)
      ),
      el('div', { class: 'docsim__corps' },
        el('div', { class: 'docsim__logo', dataset: { zone: 'logo' } }, spec.nomSite),
        spec.menu && el('nav', { class: 'docsim__menu', dataset: { zone: 'menu' } },
          spec.menu.map(m => el('span', {}, m))),
        spec.surtitre && el('p', { class: 'docsim__surtitre', dataset: { zone: 'surtitre' } }, spec.surtitre),
        el('h3', { class: 'docsim__titre', dataset: { zone: 'titre' } }, spec.titre),
        spec.auteur && el('p', { class: 'docsim__signature', dataset: { zone: 'auteur' } }, spec.auteur),
        spec.date && el('p', { class: 'docsim__date', dataset: { zone: 'date' } }, spec.date),
        spec.chapo && el('p', { class: 'docsim__chapo', dataset: { zone: 'chapo' } }, spec.chapo),
        (spec.corps || []).map((p, i) =>
          el('p', { class: 'docsim__para', dataset: { zone: `para-${i + 1}` } }, p)),
        spec.pub && el('div', { class: 'docsim__pub', dataset: { zone: 'pub' } },
          el('small', {}, 'Publicité'), spec.pub),
        spec.footer && el('div', { class: 'docsim__footer', dataset: { zone: 'footer' } },
          spec.footer.map(l => el('span', {}, l)))
      )
    );
  },

  /* Notice d'un portail documentaire (résultat de recherche du CDI). */
  'notice'(spec) {
    return el('div', { class: 'docsim docsim-notice', dataset: { template: spec.template } },
      el('div', { class: 'docsim__navbar' },
        el('span', { class: 'docsim__points', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
        el('span', { class: 'docsim__url', dataset: { zone: 'url' } }, '🔒 ' + spec.url)
      ),
      el('div', { class: 'docsim__corps' },
        el('div', { class: 'docsim__logo', dataset: { zone: 'logo' } }, spec.nomPortail),
        el('div', { class: 'notice__recherche', dataset: { zone: 'recherche' } }, '🔍 ' + spec.recherche),
        el('p', { class: 'notice__compte' }, spec.nbResultats),
        el('div', { class: 'notice__fiche' },
          el('span', { class: 'notice__type', dataset: { zone: 'type' } }, spec.type),
          el('h3', { class: 'docsim__titre', dataset: { zone: 'titre' } }, spec.titre),
          el('p', { class: 'docsim__signature', dataset: { zone: 'auteur' } }, spec.auteur),
          spec.editeur && el('p', { class: 'docsim__date', dataset: { zone: 'editeur' } }, spec.editeur),
          spec.resume && el('p', { class: 'notice__resume', dataset: { zone: 'resume' } }, spec.resume),
          el('div', { class: 'notice__etageres' },
            el('span', { class: 'notice__cote', dataset: { zone: 'cote' } }, '📍 Cote : ' + spec.cote),
            el('span', { class: `notice__dispo ${spec.disponible ? 'est-dispo' : 'est-sorti'}`, dataset: { zone: 'dispo' } },
              spec.disponible ? '✔ Disponible' : '✕ Emprunté — retour le ' + spec.retour)
          )
        )
      )
    );
  },

  /* Page de résultats d'un moteur de recherche. */
  'serp'(spec) {
    return el('div', { class: 'docsim docsim-serp', dataset: { template: spec.template } },
      el('div', { class: 'docsim__navbar' },
        el('span', { class: 'docsim__points', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')),
        el('span', { class: 'docsim__url', dataset: { zone: 'url' } }, '🔒 ' + spec.url)
      ),
      el('div', { class: 'docsim__corps' },
        el('div', { class: 'serp__barre' },
          el('span', { class: 'docsim__logo', dataset: { zone: 'logo' } }, spec.nomMoteur),
          el('span', { class: 'serp__requete', dataset: { zone: 'requete' } }, spec.requete + ' ✕')
        ),
        el('p', { class: 'notice__compte' }, spec.nbResultats),
        spec.resultats.map((r, i) =>
          el('div', { class: 'serp__resultat' + (r.annonce ? ' serp__resultat--annonce' : ''), dataset: { zone: `res-${i + 1}` } },
            r.annonce && el('span', { class: 'serp__annonce', dataset: { zone: `res-${i + 1}-annonce` } }, 'Annonce'),
            el('p', { class: 'serp__url', dataset: { zone: `res-${i + 1}-url` } }, r.url),
            el('h3', { class: 'serp__titre', dataset: { zone: `res-${i + 1}-titre` } }, r.titre),
            el('p', { class: 'serp__extrait' }, r.extrait)
          ))
      )
    );
  },

  /* Une de journal papier. */
  'une'(spec) {
    return el('div', { class: 'docsim docsim-une', dataset: { template: spec.template } },
      el('div', { class: 'une__bandeau', dataset: { zone: 'bandeau' } },
        el('span', { class: 'une__prix', dataset: { zone: 'prix' } }, spec.prix),
        el('h3', { class: 'une__nom', dataset: { zone: 'nom-journal' } }, spec.nomJournal),
        el('span', { class: 'une__date', dataset: { zone: 'date' } }, spec.date)
      ),
      el('div', { class: 'docsim__corps' },
        el('h2', { class: 'une__manchette', dataset: { zone: 'manchette' } }, spec.manchette),
        spec.sousTitre && el('p', { class: 'docsim__chapo', dataset: { zone: 'sous-titre' } }, spec.sousTitre),
        spec.photo && el('div', { class: 'une__photo', dataset: { zone: 'photo' } },
          el('span', { 'aria-hidden': 'true' }, spec.photo.emoji || '🖼'),
          el('small', { class: 'une__legende', dataset: { zone: 'legende' } }, spec.photo.legende)),
        el('div', { class: 'une__secondaires' },
          (spec.secondaires || []).map((a, i) =>
            el('div', { class: 'une__secondaire', dataset: { zone: `secondaire-${i + 1}` } },
              el('span', { class: 'docsim__surtitre' }, a.rubrique),
              el('p', {}, a.titre)))),
        spec.sommaire && el('div', { class: 'une__sommaire', dataset: { zone: 'sommaire' } },
          el('b', {}, 'Dans ce numéro : '),
          spec.sommaire.map(s => el('span', {}, `${s.rubrique} p.${s.page}`)))
      )
    );
  },

  /* Document de collecte d'un élève (traces de recherche). */
  'collecte'(spec) {
    return el('div', { class: 'docsim docsim-collecte', dataset: { template: spec.template } },
      el('div', { class: 'collecte__entete', dataset: { zone: 'entete' } },
        el('b', {}, '📝 Mon document de collecte'),
        el('span', {}, 'Sujet : ' + spec.sujet)),
      el('div', { class: 'docsim__corps' },
        spec.extraits.map((x, i) =>
          el('div', { class: 'collecte__extrait', dataset: { zone: `extrait-${i + 1}` } },
            el('p', { class: 'collecte__texte' }, '« ' + x.texte + ' »'),
            el('p', { class: 'collecte__source', dataset: { zone: `source-${i + 1}` } },
              'Source : ' + (x.source || '???'))))
      )
    );
  },

  /* Publication sur un réseau social. */
  'post'(spec) {
    return el('div', { class: 'docsim docsim-post', dataset: { template: spec.template } },
      el('div', { class: 'docsim__corps' },
        el('div', { class: 'post__entete' },
          el('span', { class: 'post__avatar', 'aria-hidden': 'true' }, spec.avatar || '👤'),
          el('div', {},
            el('p', { class: 'post__pseudo', dataset: { zone: 'pseudo' } }, spec.pseudo),
            el('p', { class: 'post__bio', dataset: { zone: 'bio' } }, spec.bio))),
        el('p', { class: 'post__texte', dataset: { zone: 'texte' } }, spec.texte),
        spec.image && el('div', { class: 'une__photo post__image', dataset: { zone: 'image' } },
          el('span', { 'aria-hidden': 'true' }, spec.image.emoji || '🖼'),
          el('small', { class: 'une__legende' }, spec.image.legende)),
        el('div', { class: 'post__pied', dataset: { zone: 'reactions' } },
          el('span', {}, `❤️ ${spec.likes}`),
          el('span', {}, `🔁 ${spec.partages}`),
          el('span', {}, `💬 ${spec.commentaires}`))
      )
    );
  }
};

export function rendreDocument(spec) {
  const fabrique = TEMPLATES[spec.template];
  if (!fabrique) throw new Error(`Template de document inconnu : ${spec.template}`);
  return fabrique(spec);
}

/* Encadré « pièce à examiner » repliable autour d'un document. */
export function pieceAExaminer(spec, { replie = false } = {}) {
  const doc = rendreDocument(spec);
  const boite = el('div', { class: 'piece' + (replie ? ' piece--repliee' : '') },
    el('div', { class: 'piece__bandeau' }, '🔍 Pièce à examiner'),
    doc
  );
  if (replie) {
    const bouton = el('button', { class: 'piece__deplier', type: 'button' }, 'Voir la pièce en entier');
    bouton.addEventListener('click', () => {
      const ferme = boite.classList.toggle('piece--repliee');
      bouton.textContent = ferme ? 'Voir la pièce en entier' : 'Replier la pièce';
    });
    boite.append(bouton);
  }
  return boite;
}

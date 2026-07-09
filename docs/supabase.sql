-- ============================================================================
-- BUREAU DES INDICES — schéma Supabase (région UE)
-- À coller dans l'éditeur SQL du projet Supabase (une seule fois).
-- Principe RGPD : aucune donnée nominative. Le code élève est un pseudonyme ;
-- la correspondance code <-> élève reste chez le professeur, hors plateforme.
-- Tout l'accès passe par des fonctions RPC "security definer" : la clé anon
-- ne peut ni lire ni écrire les tables directement (RLS sans policy).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----- Tables ---------------------------------------------------------------

create table if not exists eleves (
  code      text primary key,                   -- ex. 5A-XKR-07
  classe    text not null,                      -- ex. 5A (déduit du code)
  pin_hash  text,                               -- null tant que l'élève n'a pas choisi son PIN
  cree_le   timestamptz not null default now()
);

create table if not exists evenements (
  id          bigint generated always as identity primary key,
  code_eleve  text not null references eleves(code),
  module_id   text not null,                    -- ex. 5.D2.OUT.1
  type        text not null,                    -- ex. module_termine
  score       int,                              -- bonnes réponses
  total       int,                              -- questions posées
  xp          int,
  pct         int,
  horodatage  timestamptz not null default now()
);
create index if not exists evenements_par_eleve on evenements (code_eleve, module_id);

create table if not exists sessions (
  jeton       uuid primary key default gen_random_uuid(),
  code_eleve  text not null references eleves(code),
  cree_le     timestamptz not null default now(),
  expire_le   timestamptz not null default now() + interval '12 hours'
);

create table if not exists prof (
  id        int primary key default 1 check (id = 1),
  mdp_hash  text not null
);

-- ----- RLS : tout est fermé, seules les fonctions RPC passent ---------------

alter table eleves     enable row level security;
alter table evenements enable row level security;
alter table sessions   enable row level security;
alter table prof       enable row level security;

-- ----- Initialisation par le professeur -------------------------------------
-- 1. Définir le mot de passe professeur (remplacer CHANGE-MOI) :
--    insert into prof (mdp_hash) values (crypt('CHANGE-MOI', gen_salt('bf')))
--    on conflict (id) do update set mdp_hash = excluded.mdp_hash;
-- 2. Créer les codes élèves d'une classe (exemple, à adapter) :
--    insert into eleves (code, classe) values
--      ('5A-XKR-07', '5A'), ('5A-MPT-12', '5A'), ('5A-QLZ-33', '5A');
--    (générateur de codes : voir docs/deploiement.md)

-- ----- RPC : connexion élève -------------------------------------------------
-- Premier appel avec un code valide : enregistre le PIN.
-- Appels suivants : vérifie le PIN. Retourne { jeton } ou { erreur }.

create or replace function connexion_eleve(p_code text, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_eleve eleves%rowtype;
  v_jeton uuid;
begin
  if p_pin !~ '^\d{4}$' then
    return json_build_object('erreur', 'PIN invalide.');
  end if;

  select * into v_eleve from eleves where code = upper(p_code);
  if not found then
    return json_build_object('erreur', 'Code inconnu. Vérifie ta carte agent.');
  end if;

  if v_eleve.pin_hash is null then
    update eleves set pin_hash = crypt(p_pin, gen_salt('bf')) where code = v_eleve.code;
  elsif v_eleve.pin_hash <> crypt(p_pin, v_eleve.pin_hash) then
    return json_build_object('erreur', 'PIN incorrect.');
  end if;

  delete from sessions where code_eleve = v_eleve.code and expire_le < now();
  insert into sessions (code_eleve) values (v_eleve.code) returning jeton into v_jeton;
  return json_build_object('jeton', v_jeton);
end;
$$;

-- ----- RPC : réinitialiser le PIN d'un élève (professeur) --------------------

create or replace function reinitialiser_pin(p_mdp text, p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from prof where mdp_hash = crypt(p_mdp, mdp_hash)) then
    return json_build_object('erreur', 'Mot de passe professeur incorrect.');
  end if;
  update eleves set pin_hash = null where code = upper(p_code);
  delete from sessions where code_eleve = upper(p_code);
  return json_build_object('ok', true);
end;
$$;

-- ----- RPC : enregistrement des événements (file du client) ------------------

create or replace function enregistrer_evenements(p_jeton uuid, p_evenements jsonb)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
begin
  select code_eleve into v_code from sessions
    where jeton = p_jeton and expire_le > now();
  if not found then
    raise exception 'Session expirée';
  end if;

  insert into evenements (code_eleve, module_id, type, score, total, xp, pct, horodatage)
  select
    v_code,
    e->>'moduleId',
    coalesce(e->>'type', 'module_termine'),
    (e->>'bonnes')::int,
    (e->>'total')::int,
    (e->>'xp')::int,
    (e->>'pct')::int,
    coalesce((e->>'horodatage')::timestamptz, now())
  from jsonb_array_elements(p_evenements) as e;

  return json_build_object('ok', true);
end;
$$;

-- ----- RPC : tableau professeur ------------------------------------------------
-- Retourne, par élève : meilleur % par module, médaille, XP total, dernière activité.

create or replace function tableau_prof(p_mdp text, p_classe text default null)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from prof where mdp_hash = crypt(p_mdp, mdp_hash)) then
    raise exception 'Mot de passe professeur incorrect';
  end if;

  return coalesce((
    select json_agg(ligne order by ligne->>'code')
    from (
      select json_build_object(
        'code', el.code,
        'classe', el.classe,
        'xp', coalesce((select sum(xp) from (
                 select distinct on (module_id) xp
                 from evenements where code_eleve = el.code
                 order by module_id, pct desc nulls last, horodatage desc) meilleurs), 0),
        'derniere', (select max(horodatage) from evenements where code_eleve = el.code),
        'modules', coalesce((
          select json_object_agg(m.module_id, json_build_object(
            'pct', m.pct,
            'medaille', case when m.pct >= 100 then 'or'
                             when m.pct >= 85 then 'argent'
                             when m.pct >= 70 then 'bronze' end))
          from (
            select distinct on (module_id) module_id, pct
            from evenements
            where code_eleve = el.code and pct is not null
            order by module_id, pct desc
          ) m), '{}'::json)
      ) as ligne
      from eleves el
      where p_classe is null or el.classe = upper(p_classe)
    ) lignes
  ), '[]'::json);
end;
$$;

-- ----- Droits : la clé anon ne peut qu'appeler les RPC -------------------------

revoke all on all tables in schema public from anon, authenticated;
grant execute on function connexion_eleve(text, text) to anon;
grant execute on function enregistrer_evenements(uuid, jsonb) to anon;
grant execute on function tableau_prof(text, text) to anon;
grant execute on function reinitialiser_pin(text, text) to anon;

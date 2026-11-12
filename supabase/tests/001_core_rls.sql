begin;
select plan(24);

-- Données : Alice + Bastien mariés (W1), Chloé seule (W2), Denis sans mariage.
select tests.create_user('alice@test.fr', 'Alice');
select tests.create_user('bastien@test.fr');
select tests.create_user('chloe@test.fr');
select tests.create_user('denis@test.fr');
select tests.create_wedding('alice@test.fr', 'bastien@test.fr') as w1 \gset
select tests.create_wedding('chloe@test.fr') as w2 \gset

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'RLS activée sur toutes les tables publiques');

select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon'),
  0, 'anon n''a aucun droit sur les tables publiques');

select is((select display_name from public.profiles where id = tests.user_id('alice@test.fr')),
  'Alice', 'un profil est créé à l''inscription (nom repris des métadonnées)');

select matches((select rsvp_token from public.weddings where id = :'w1'),
  '^[A-Za-z0-9_-]{43}$', 'jeton RSVP base64url de 43 caractères');

-- ---------------------------------------------------------------------------
-- Contraintes métier
-- ---------------------------------------------------------------------------
select throws_ok(
  format($$insert into public.wedding_members (wedding_id, user_id, side) values (%L, %L, 'A')$$,
    :'w1', tests.user_id('denis@test.fr')),
  '23505', null, 'un 3e membre est refusé (un seul membre par côté)');

select throws_ok(
  format($$insert into public.wedding_members (wedding_id, user_id, side) values (%L, %L, 'B')$$,
    :'w2', tests.user_id('alice@test.fr')),
  '23505', null, 'un utilisateur ne peut appartenir qu''à un seul mariage');

select throws_ok(
  format($$update public.weddings set date_precision = 'month', wedding_date = '2027-06-12' where id = %L$$, :'w1'),
  '23514', null, 'un mois approximatif est stocké au 1er du mois');

select lives_ok(
  format($$update public.weddings set date_precision = 'month', wedding_date = '2027-06-01' where id = %L$$, :'w1'),
  'mois approximatif accepté');

select throws_ok(
  format($$update public.weddings set date_precision = 'day', wedding_date = null where id = %L$$, :'w1'),
  '23514', null, 'une date exacte est obligatoire si la précision est « jour »');

-- ---------------------------------------------------------------------------
-- Anonyme
-- ---------------------------------------------------------------------------
select tests.as_anon();
select throws_ok('select * from public.weddings', '42501', null, 'anon ne lit pas les mariages');
select throws_ok('select * from public.profiles', '42501', null, 'anon ne lit pas les profils');
select tests.clear_authentication();

-- ---------------------------------------------------------------------------
-- Membre (Alice)
-- ---------------------------------------------------------------------------
select tests.authenticate_as('alice@test.fr');

select results_eq('select id from public.weddings', format('values (%L::uuid)', :'w1'),
  'Alice ne voit que son mariage');
select is((select count(*)::int from public.wedding_members), 2, 'Alice voit les 2 membres de son mariage');
select is((select count(*)::int from public.profiles), 2, 'Alice voit son profil et celui de Bastien');

select lives_ok(format($$update public.weddings set venue_city = 'Lyon' where id = %L$$, :'w1'),
  'Alice modifie son mariage');
select is((select count(*)::int from public.weddings where id = :'w2'), 0, 'Alice ne voit pas le mariage de Chloé');

update public.weddings set venue_city = 'Piratage' where id = :'w2';
select tests.clear_authentication();
select isnt((select venue_city from public.weddings where id = :'w2'), 'Piratage',
  'Alice ne peut pas modifier le mariage de Chloé');
select tests.authenticate_as('alice@test.fr');

select throws_ok(format($$update public.weddings set rsvp_token = 'x' where id = %L$$, :'w1'),
  '42501', null, 'le jeton RSVP n''est pas modifiable directement');
select throws_ok(format($$update public.weddings set created_by = null where id = %L$$, :'w1'),
  '42501', null, 'created_by n''est pas modifiable');
select throws_ok(
  format($$insert into public.wedding_members (wedding_id, user_id, side) values (%L, %L, 'B')$$,
    :'w2', tests.user_id('alice@test.fr')),
  '42501', null, 'Alice ne peut pas s''ajouter à un autre mariage');
select throws_ok($$insert into public.weddings (partner_a_name, partner_b_name) values ('X', 'Y')$$,
  '42501', null, 'pas de création directe de mariage (fonction dédiée)');

select lives_ok(format($$insert into public.wedding_vendor_needs (wedding_id, category_code) values (%L, 'dj')$$, :'w1'),
  'Alice ajoute un prestataire prévu');
select throws_ok(format($$insert into public.wedding_vendor_needs (wedding_id, category_code) values (%L, 'dj')$$, :'w2'),
  '42501', null, 'Alice ne peut pas ajouter un prestataire au mariage de Chloé');

-- ---------------------------------------------------------------------------
-- Non-membre (Denis)
-- ---------------------------------------------------------------------------
select tests.authenticate_as('denis@test.fr');
select is((select count(*)::int from public.weddings) + (select count(*)::int from public.wedding_members),
  0, 'Denis ne voit aucun mariage ni membre');

select * from finish();
rollback;

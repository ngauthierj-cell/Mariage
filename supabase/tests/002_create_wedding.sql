begin;
select plan(12);

select tests.create_user('emma@test.fr');
select tests.create_user('felix@test.fr');

-- Anonyme : refusé
select tests.as_anon();
select throws_ok($$select public.create_wedding('Emma', 'Félix')$$, '42501', null,
  'anon ne peut pas créer de mariage');
select tests.clear_authentication();

-- Emma crée son mariage
select tests.authenticate_as('emma@test.fr');
select public.create_wedding(
  p_partner_a_name => '  Emma ', p_partner_b_name => 'Félix',
  p_date_precision => 'month', p_wedding_date => '2027-06-01',
  p_venue_name => 'Château de Lourmarin', p_venue_city => 'Lourmarin',
  p_ceremony_types => '{civile,laique,civile}', p_estimated_guests => 120,
  p_total_budget_cents => 2500000, p_has_honeymoon => true,
  p_vendor_codes => '{caterer,dj,dj}'
) as w \gset

select is((select partner_a_name from public.weddings where id = :'w'), 'Emma', 'prénoms nettoyés');
select is((select ceremony_types from public.weddings where id = :'w'),
  '{civile,laique}'::public.ceremony_type[], 'cérémonies dédoublonnées');
select is((select side::text from public.wedding_members where wedding_id = :'w'), 'A',
  'la créatrice est inscrite côté A');
select is((select created_by from public.weddings where id = :'w'), tests.user_id('emma@test.fr'),
  'created_by renseigné');
select is((select count(*)::int from public.wedding_vendor_needs where wedding_id = :'w'), 2,
  'prestataires prévus enregistrés sans doublon');
select is((select has_honeymoon from public.weddings where id = :'w'), true, 'options enregistrées');
select is(public.current_wedding_id(), :'w'::uuid, 'current_wedding_id renvoie le mariage');

select throws_ok($$select public.create_wedding('Emma', 'Félix')$$, 'P0001', 'Vous avez déjà un mariage',
  'un second mariage est refusé');

-- Félix (sans mariage) : contrôles de validité
select tests.authenticate_as('felix@test.fr');
select throws_ok($$select public.create_wedding('Félix', 'Emma', p_vendor_codes => '{inconnu}')$$, '23503', null,
  'catégorie de prestataire inconnue refusée');
select throws_ok($$select public.create_wedding('', 'Emma')$$, '23514', null, 'prénom vide refusé');
select is(public.current_wedding_id(), null, 'aucun mariage partiel créé après une erreur');

select * from finish();
rollback;

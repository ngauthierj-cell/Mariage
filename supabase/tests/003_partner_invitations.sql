begin;
select plan(24);

select tests.create_user('alice@test.fr');
select tests.create_user('bastien@test.fr');
select tests.create_user('chloe@test.fr');
select tests.create_user('denis@test.fr');
select tests.create_wedding('alice@test.fr') as w \gset
select tests.create_wedding('denis@test.fr') as wd \gset

-- ---------------------------------------------------------------------------
-- Création
-- ---------------------------------------------------------------------------
select tests.as_anon();
select throws_ok('select public.create_partner_invitation()', '42501', null, 'anon ne peut pas inviter');
select tests.clear_authentication();

select tests.authenticate_as('chloe@test.fr');
select throws_ok('select public.create_partner_invitation()', '42501', 'Aucun mariage',
  'sans mariage, pas d''invitation');

select tests.authenticate_as('alice@test.fr');
select token as t1 from public.create_partner_invitation() \gset
select matches(:'t1'::text, '^[A-Za-z0-9_-]{43}$', 'jeton de 43 caractères base64url');
select ok((select expires_at between now() + interval '6 days 23 hours' and now() + interval '7 days 1 minute'
           from public.partner_invitations where revoked_at is null), 'expire dans 7 jours');

select tests.clear_authentication();
select is((select token_hash from public.partner_invitations where wedding_id = :'w' and revoked_at is null),
  public.hash_token(:'t1'), 'seul le hash sha256 est stocké');
select is((select count(*)::int from public.partner_invitations where token_hash = convert_to(:'t1', 'UTF8')),
  0, 'le jeton en clair n''est stocké nulle part');

-- Nouvelle génération : l'ancienne est révoquée
select tests.authenticate_as('alice@test.fr');
select token as t2 from public.create_partner_invitation() \gset
select is((select count(*)::int from public.partner_invitations where revoked_at is null), 1,
  'une seule invitation active à la fois');
select throws_ok('select token_hash from public.partner_invitations', '42501', null,
  'les membres ne lisent pas le hash du jeton');

-- ---------------------------------------------------------------------------
-- Aperçu
-- ---------------------------------------------------------------------------
select tests.authenticate_as('bastien@test.fr');
select is((select status from public.preview_partner_invitation(:'t2')), 'valid', 'aperçu : valide');
select is((select partner_a_name from public.preview_partner_invitation(:'t2')), 'Alice', 'aperçu : prénoms');
select is((select status from public.preview_partner_invitation(:'t1')), 'revoked', 'aperçu : ancien lien révoqué');
select is((select status from public.preview_partner_invitation('inexistant')), 'invalid', 'aperçu : lien inconnu');
select is((select partner_a_name from public.preview_partner_invitation('inexistant')), null,
  'aperçu : aucun prénom pour un lien inconnu');

select tests.authenticate_as('denis@test.fr');
select is((select status from public.preview_partner_invitation(:'t2')), 'already_member',
  'aperçu : déjà membre d''un autre mariage');

-- ---------------------------------------------------------------------------
-- Acceptation
-- ---------------------------------------------------------------------------
select throws_ok(format('select public.accept_partner_invitation(%L)', :'t2'), 'P0001', 'Vous avez déjà un mariage',
  'un membre d''un autre mariage ne peut pas accepter');

select tests.authenticate_as('bastien@test.fr');
select throws_ok(format('select public.accept_partner_invitation(%L)', :'t1'), 'P0001', 'Invitation annulée',
  'un lien révoqué est refusé');
select is(public.accept_partner_invitation(:'t2'), :'w'::uuid, 'Bastien rejoint le mariage');
select is((select side::text from public.wedding_members where user_id = tests.user_id('bastien@test.fr')), 'B',
  'Bastien est inscrit côté B');
select is((select count(*)::int from public.weddings), 1, 'Bastien voit désormais le mariage');
select is((select status from public.preview_partner_invitation(:'t2')), 'own', 'aperçu : déjà membre de ce mariage');

select tests.authenticate_as('chloe@test.fr');
select throws_ok(format('select public.accept_partner_invitation(%L)', :'t2'), 'P0001', 'Invitation déjà utilisée',
  'le lien est à usage unique');

select tests.authenticate_as('alice@test.fr');
select throws_ok('select public.create_partner_invitation()', 'P0001', 'Votre moitié a déjà rejoint l''espace',
  'plus d''invitation possible à 2 membres');

-- Expiration
select tests.clear_authentication();
delete from public.wedding_members where user_id = tests.user_id('bastien@test.fr');
select tests.authenticate_as('alice@test.fr');
select token as t3 from public.create_partner_invitation() \gset
select tests.clear_authentication();
update public.partner_invitations set expires_at = now() - interval '1 minute' where token_hash = public.hash_token(:'t3');
select tests.authenticate_as('chloe@test.fr');
select is((select status from public.preview_partner_invitation(:'t3')), 'expired', 'aperçu : expiré');
select throws_ok(format('select public.accept_partner_invitation(%L)', :'t3'), 'P0001', 'Invitation expirée',
  'un lien expiré est refusé');

select * from finish();
rollback;

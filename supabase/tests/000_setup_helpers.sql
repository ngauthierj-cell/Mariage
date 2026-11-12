-- Helpers de test (exécuté en premier, hors transaction : les fonctions persistent).
create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Crée un utilisateur Auth et renvoie son id.
create or replace function tests.create_user(p_email text, p_name text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (gen_random_uuid(), p_email, case when p_name is null then '{}'::jsonb else jsonb_build_object('full_name', p_name) end)
  returning id into v_id;
  return v_id;
end $$;

-- Retrouve l'id d'un utilisateur de test par e-mail.
create or replace function tests.user_id(p_email text)
returns uuid language sql security definer set search_path = '' as $$
  select id from auth.users where email = p_email;
$$;

-- Bascule la session sur un utilisateur connecté (comme PostgREST).
create or replace function tests.authenticate_as(p_email text)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', tests.user_id(p_email), 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create or replace function tests.as_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end $$;

create or replace function tests.clear_authentication()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  reset role;
end $$;

-- Crée un mariage (en superutilisateur) avec ses membres.
create or replace function tests.create_wedding(p_a_email text, p_b_email text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.weddings (partner_a_name, partner_b_name, created_by)
  values ('Alice', 'Bastien', tests.user_id(p_a_email))
  returning id into v_id;
  insert into public.wedding_members (wedding_id, user_id, side) values (v_id, tests.user_id(p_a_email), 'A');
  if p_b_email is not null then
    insert into public.wedding_members (wedding_id, user_id, side) values (v_id, tests.user_id(p_b_email), 'B');
  end if;
  return v_id;
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

select plan(1);
select pass('helpers de test installés');
select * from finish();

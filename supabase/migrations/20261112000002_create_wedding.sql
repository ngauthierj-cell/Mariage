-- =============================================================================
-- 0002 — Création d'un mariage (onboarding)
-- =============================================================================
-- Crée le mariage, y inscrit l'utilisateur courant (côté A) et enregistre les
-- prestataires prévus, en une seule transaction.

create function public.create_wedding(
  p_partner_a_name text,
  p_partner_b_name text,
  p_date_precision public.date_precision default 'unknown',
  p_wedding_date date default null,
  p_venue_name text default null,
  p_venue_city text default null,
  p_is_abroad boolean default false,
  p_ceremony_types public.ceremony_type[] default '{}',
  p_estimated_guests integer default null,
  p_total_budget_cents bigint default null,
  p_has_bachelor_parties boolean default false,
  p_has_stationery boolean default false,
  p_has_registry boolean default false,
  p_has_honeymoon boolean default false,
  p_vendor_codes text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_wedding_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  if exists (select 1 from public.wedding_members where user_id = v_user_id) then
    raise exception 'Vous avez déjà un mariage' using errcode = 'P0001', hint = 'already_member';
  end if;

  insert into public.weddings (
    partner_a_name, partner_b_name, date_precision, wedding_date, venue_name, venue_city, is_abroad,
    ceremony_types, estimated_guests, total_budget_cents, has_bachelor_parties, has_stationery,
    has_registry, has_honeymoon, created_by
  ) values (
    btrim(p_partner_a_name), btrim(p_partner_b_name), p_date_precision, p_wedding_date,
    nullif(btrim(p_venue_name), ''), nullif(btrim(p_venue_city), ''), coalesce(p_is_abroad, false),
    (select coalesce(array_agg(distinct c), '{}') from unnest(coalesce(p_ceremony_types, '{}')) as c),
    p_estimated_guests, p_total_budget_cents,
    coalesce(p_has_bachelor_parties, false), coalesce(p_has_stationery, false),
    coalesce(p_has_registry, false), coalesce(p_has_honeymoon, false), v_user_id
  )
  returning id into v_wedding_id;

  insert into public.wedding_members (wedding_id, user_id, side) values (v_wedding_id, v_user_id, 'A');

  -- Les codes inconnus provoquent une erreur de clé étrangère (23503).
  insert into public.wedding_vendor_needs (wedding_id, category_code)
  select distinct v_wedding_id, code from unnest(coalesce(p_vendor_codes, '{}')) as code;

  return v_wedding_id;
end;
$$;

revoke execute on function public.create_wedding from public, anon;
grant execute on function public.create_wedding to authenticated;

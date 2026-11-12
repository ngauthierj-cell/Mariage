-- =============================================================================
-- 0001 — Socle : profils, mariages, membres, invitations partenaire, prestataires prévus
-- =============================================================================
-- Principes :
--  * RLS activée sur TOUTES les tables ; le rôle `anon` n'a accès à aucune table.
--  * L'appartenance à un mariage est vérifiée par public.is_wedding_member().
--  * Les écritures sensibles (création de mariage, ajout de membre, invitations)
--    passent par des fonctions SECURITY DEFINER (étapes 3 et 4).

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.ceremony_type as enum ('civile', 'religieuse', 'laique');
create type public.date_precision as enum ('day', 'month', 'unknown');
create type public.wedding_side as enum ('A', 'B');

-- -----------------------------------------------------------------------------
-- Utilitaires
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Jeton aléatoire de 32 octets encodé en base64url (43 caractères, non devinable).
create function public.generate_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(32), 'base64'), E'+/=\n', '-_');
$$;

-- -----------------------------------------------------------------------------
-- Profils (1 par utilisateur Auth)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Mariages
-- -----------------------------------------------------------------------------
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  partner_a_name text not null check (char_length(btrim(partner_a_name)) between 1 and 60),
  partner_b_name text not null check (char_length(btrim(partner_b_name)) between 1 and 60),

  -- Date exacte (`day`), mois approximatif (`month`, stocké au 1er du mois) ou inconnue.
  date_precision public.date_precision not null default 'unknown',
  wedding_date date,

  venue_name text check (char_length(venue_name) <= 120),
  venue_city text check (char_length(venue_city) <= 120),
  is_abroad boolean not null default false,

  ceremony_types public.ceremony_type[] not null default '{}',
  estimated_guests integer check (estimated_guests between 0 and 2000),
  total_budget_cents bigint check (total_budget_cents between 0 and 100000000000),

  -- Options
  has_bachelor_parties boolean not null default false, -- EVJF / EVG
  has_stationery boolean not null default false,       -- faire-part
  has_registry boolean not null default false,         -- liste de mariage
  has_honeymoon boolean not null default false,        -- voyage de noces

  -- RSVP public
  rsvp_token text not null unique default public.generate_token(),
  rsvp_enabled boolean not null default false,
  rsvp_deadline date,

  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint weddings_date_consistency check (
    (date_precision = 'unknown' and wedding_date is null)
    or (date_precision = 'day' and wedding_date is not null)
    or (date_precision = 'month' and wedding_date is not null and extract(day from wedding_date) = 1)
  ),
  constraint weddings_rsvp_token_length check (char_length(rsvp_token) >= 43)
);

create trigger weddings_set_updated_at
  before update on public.weddings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Membres : 2 conjoints maximum (un par côté), un seul mariage actif par utilisateur.
-- -----------------------------------------------------------------------------
create table public.wedding_members (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  side public.wedding_side not null,
  joined_at timestamptz not null default now(),
  primary key (wedding_id, user_id),
  constraint wedding_members_one_per_side unique (wedding_id, side),
  constraint wedding_members_one_wedding_per_user unique (user_id)
);

-- Appartenance au mariage, utilisée par toutes les politiques RLS.
-- SECURITY DEFINER pour éviter la récursion RLS sur wedding_members.
create function public.is_wedding_member(target_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_members m
    where m.wedding_id = target_wedding_id
      and m.user_id = (select auth.uid())
  );
$$;

-- Mariage de l'utilisateur courant (ou null).
create function public.current_wedding_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.wedding_id from public.wedding_members m where m.user_id = (select auth.uid());
$$;

-- -----------------------------------------------------------------------------
-- Invitations du partenaire (lien à usage unique, jeton stocké haché)
-- -----------------------------------------------------------------------------
create table public.partner_invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  token_hash bytea not null unique check (octet_length(token_hash) = 32), -- sha256
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz
);

create index partner_invitations_wedding_idx on public.partner_invitations (wedding_id);

-- -----------------------------------------------------------------------------
-- Catégories de prestataires (référentiel) et prestataires prévus
-- -----------------------------------------------------------------------------
create table public.vendor_categories (
  code text primary key check (code ~ '^[a-z_]+$'),
  label text not null,
  sort smallint not null default 0
);

insert into public.vendor_categories (code, label, sort) values
  ('venue', 'Lieu de réception', 10),
  ('caterer', 'Traiteur', 20),
  ('photographer', 'Photographe', 30),
  ('videographer', 'Vidéaste', 40),
  ('dj', 'DJ / animation', 50),
  ('musicians', 'Musiciens', 60),
  ('florist', 'Fleuriste', 70),
  ('decorator', 'Décoration', 80),
  ('wedding_planner', 'Wedding planner', 90),
  ('officiant', 'Officiant de cérémonie laïque', 100),
  ('dress', 'Robe / tenue', 110),
  ('suit', 'Costume', 120),
  ('hair_makeup', 'Coiffure & maquillage', 130),
  ('cake', 'Pièce montée / gâteau', 140),
  ('rings', 'Alliances', 150),
  ('stationery', 'Faire-part & papeterie', 160),
  ('transport', 'Transport', 170),
  ('accommodation', 'Hébergement des invités', 180),
  ('childcare', 'Animation enfants / baby-sitting', 190),
  ('photobooth', 'Photobooth', 200);

create table public.wedding_vendor_needs (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_code text not null references public.vendor_categories (code),
  created_at timestamptz not null default now(),
  primary key (wedding_id, category_code)
);

-- =============================================================================
-- Droits et RLS
-- =============================================================================
-- Supabase accorde par défaut tous les droits à anon/authenticated : on repart de zéro.
revoke all on public.profiles, public.weddings, public.wedding_members, public.partner_invitations,
  public.vendor_categories, public.wedding_vendor_needs from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.partner_invitations enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.wedding_vendor_needs enable row level security;

-- Profils : je vois le mien et celui de mon/ma conjoint·e ; je ne modifie que le mien.
grant select, update (display_name) on public.profiles to authenticated;

create policy "profiles_select_self_or_partner" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.wedding_members m
      where m.user_id = profiles.id and public.is_wedding_member(m.wedding_id)
    )
  );

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Mariages : lecture, modification et suppression par les membres.
-- La création passe par une fonction dédiée (étape 3).
-- rsvp_token, created_by et id ne sont pas modifiables directement.
grant select, delete on public.weddings to authenticated;
grant update (
  partner_a_name, partner_b_name, date_precision, wedding_date, venue_name, venue_city, is_abroad,
  ceremony_types, estimated_guests, total_budget_cents, has_bachelor_parties, has_stationery,
  has_registry, has_honeymoon, rsvp_enabled, rsvp_deadline
) on public.weddings to authenticated;

create policy "weddings_select_members" on public.weddings
  for select to authenticated using (public.is_wedding_member(id));

create policy "weddings_update_members" on public.weddings
  for update to authenticated
  using (public.is_wedding_member(id))
  with check (public.is_wedding_member(id));

create policy "weddings_delete_members" on public.weddings
  for delete to authenticated using (public.is_wedding_member(id));

-- Membres : lecture seule (ajout via l'invitation partenaire).
grant select on public.wedding_members to authenticated;

create policy "wedding_members_select_members" on public.wedding_members
  for select to authenticated using (public.is_wedding_member(wedding_id));

-- Invitations : lecture seule pour les membres (création/révocation via fonctions).
grant select (id, wedding_id, created_by, created_at, expires_at, used_at, used_by, revoked_at)
  on public.partner_invitations to authenticated;

create policy "partner_invitations_select_members" on public.partner_invitations
  for select to authenticated using (public.is_wedding_member(wedding_id));

-- Référentiel : lisible par tout utilisateur connecté.
grant select on public.vendor_categories to authenticated;

create policy "vendor_categories_select_all" on public.vendor_categories
  for select to authenticated using (true);

-- Prestataires prévus : gestion complète par les membres.
grant select, insert, delete on public.wedding_vendor_needs to authenticated;

create policy "wedding_vendor_needs_all_members" on public.wedding_vendor_needs
  for all to authenticated
  using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

-- Les fonctions internes ne sont pas appelables par anon.
revoke execute on function public.is_wedding_member(uuid) from public, anon;
revoke execute on function public.current_wedding_id() from public, anon;
revoke execute on function public.generate_token() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.is_wedding_member(uuid) to authenticated;
grant execute on function public.current_wedding_id() to authenticated;

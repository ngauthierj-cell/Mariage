-- =============================================================================
-- 0003 — Invitation du partenaire (lien à usage unique, 7 jours, 2 membres max)
-- =============================================================================
-- Le jeton en clair n'est renvoyé qu'une fois, à la création ; seul son sha256
-- est stocké. Une seule invitation active par mariage : en générer une nouvelle
-- révoque la précédente.

create function public.hash_token(p_token text)
returns bytea
language sql
immutable
set search_path = ''
as $$
  select sha256(convert_to(p_token, 'UTF8'));
$$;

-- -----------------------------------------------------------------------------
-- Création (renvoie le jeton en clair, une seule fois)
-- -----------------------------------------------------------------------------
create function public.create_partner_invitation()
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wedding_id uuid := public.current_wedding_id();
  v_token text := public.generate_token();
  v_expires timestamptz;
begin
  if v_wedding_id is null then
    raise exception 'Aucun mariage' using errcode = '42501';
  end if;

  if (select count(*) from public.wedding_members m where m.wedding_id = v_wedding_id) >= 2 then
    raise exception 'Votre moitié a déjà rejoint l''espace' using errcode = 'P0001', hint = 'full';
  end if;

  update public.partner_invitations i
     set revoked_at = now()
   where i.wedding_id = v_wedding_id and i.used_at is null and i.revoked_at is null;

  insert into public.partner_invitations (wedding_id, token_hash, created_by)
  values (v_wedding_id, public.hash_token(v_token), (select auth.uid()))
  returning partner_invitations.expires_at into v_expires;

  return query select v_token, v_expires;
end;
$$;

-- -----------------------------------------------------------------------------
-- Révocation de l'invitation en cours
-- -----------------------------------------------------------------------------
create function public.revoke_partner_invitation()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wedding_id uuid := public.current_wedding_id();
begin
  if v_wedding_id is null then
    raise exception 'Aucun mariage' using errcode = '42501';
  end if;
  update public.partner_invitations i
     set revoked_at = now()
   where i.wedding_id = v_wedding_id and i.used_at is null and i.revoked_at is null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Aperçu avant acceptation (statut + prénoms ; aucune autre donnée)
-- -----------------------------------------------------------------------------
-- Statuts : valid, invalid, expired, used, revoked, full, own (déjà membre de
-- ce mariage), already_member (membre d'un autre mariage).
create function public.preview_partner_invitation(p_token text)
returns table (status text, partner_a_name text, partner_b_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_inv public.partner_invitations%rowtype;
  v_wedding public.weddings%rowtype;
  v_current uuid := public.current_wedding_id();
begin
  if (select auth.uid()) is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  select * into v_inv from public.partner_invitations i where i.token_hash = public.hash_token(p_token);
  if not found then
    return query select 'invalid'::text, null::text, null::text;
    return;
  end if;

  select * into v_wedding from public.weddings w where w.id = v_inv.wedding_id;

  return query select
    case
      when v_current = v_inv.wedding_id then 'own'
      when v_inv.used_at is not null then 'used'
      when v_inv.revoked_at is not null then 'revoked'
      when v_inv.expires_at <= now() then 'expired'
      when (select count(*) from public.wedding_members m where m.wedding_id = v_inv.wedding_id) >= 2 then 'full'
      when v_current is not null then 'already_member'
      else 'valid'
    end,
    v_wedding.partner_a_name,
    v_wedding.partner_b_name;
end;
$$;

-- -----------------------------------------------------------------------------
-- Acceptation : inscrit l'utilisateur sur le côté libre et consomme le jeton
-- -----------------------------------------------------------------------------
create function public.accept_partner_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_inv public.partner_invitations%rowtype;
  v_side public.wedding_side;
begin
  if v_user_id is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  -- Verrou : deux acceptations simultanées du même lien ne peuvent pas réussir.
  select * into v_inv from public.partner_invitations i
   where i.token_hash = public.hash_token(p_token)
   for update;

  if not found then
    raise exception 'Invitation introuvable' using errcode = 'P0001', hint = 'invalid';
  elsif v_inv.used_at is not null then
    raise exception 'Invitation déjà utilisée' using errcode = 'P0001', hint = 'used';
  elsif v_inv.revoked_at is not null then
    raise exception 'Invitation annulée' using errcode = 'P0001', hint = 'revoked';
  elsif v_inv.expires_at <= now() then
    raise exception 'Invitation expirée' using errcode = 'P0001', hint = 'expired';
  end if;

  if exists (select 1 from public.wedding_members m where m.user_id = v_user_id) then
    raise exception 'Vous avez déjà un mariage' using errcode = 'P0001', hint = 'already_member';
  end if;

  select s into v_side
    from unnest(enum_range(null::public.wedding_side)) as s
   where not exists (select 1 from public.wedding_members m where m.wedding_id = v_inv.wedding_id and m.side = s)
   order by s
   limit 1;

  if v_side is null then
    raise exception 'Ce mariage compte déjà deux membres' using errcode = 'P0001', hint = 'full';
  end if;

  insert into public.wedding_members (wedding_id, user_id, side) values (v_inv.wedding_id, v_user_id, v_side);

  update public.partner_invitations i
     set used_at = now(), used_by = v_user_id
   where i.id = v_inv.id;

  return v_inv.wedding_id;
end;
$$;

revoke execute on function public.hash_token(text) from public, anon, authenticated;
revoke execute on function public.create_partner_invitation() from public, anon;
revoke execute on function public.revoke_partner_invitation() from public, anon;
revoke execute on function public.preview_partner_invitation(text) from public, anon;
revoke execute on function public.accept_partner_invitation(text) from public, anon;
grant execute on function public.create_partner_invitation() to authenticated;
grant execute on function public.revoke_partner_invitation() to authenticated;
grant execute on function public.preview_partner_invitation(text) to authenticated;
grant execute on function public.accept_partner_invitation(text) to authenticated;

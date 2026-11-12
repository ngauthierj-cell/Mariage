# Notre Mariage — PWA de planning de mariage

@AGENTS.md

## Produit
- PWA **mobile-first, en français**, pour les couples qui organisent leur mariage en France. Gratuit, sans publicité.
- Un **mariage = un espace partagé par 2 conjoints** (mêmes droits, pas de « propriétaire »), synchronisé en temps réel.
- Un utilisateur n'a qu'**un seul mariage actif**.
- Modules : invités et RSVP (release 1), budget et prestataires, rétroplanning, plan de table (releases suivantes, schéma déjà anticipé).

## Stack
- Next.js 16 (App Router, Cache Components activé) + TypeScript strict + Tailwind CSS v4.
  ⚠️ Next 16 diffère de Next 13–15 : lire `node_modules/next/dist/docs/` avant d'utiliser une API (par exemple `middleware.ts` est devenu `proxy.ts`).
- Supabase : Auth (lien magique + Google), Postgres avec RLS sur **toutes** les tables, Realtime.
- Vercel (déploiement), GitHub (code).
- Tests : Vitest (unitaires), pgTAP (RLS, `supabase/tests`), Playwright (e2e, plus tard).

## Commandes
- `npm run dev` : serveur de développement
- `npm run build` : build de production
- `npm test` : tests unitaires
- `npm run lint` : ESLint
- `npm run typecheck` : `next typegen` + `tsc`
- `npm run icons` : régénère les icônes PWA (Playwright/Chromium)

Avant chaque commit, lancer `npm run lint && npm run typecheck && npm test && npm run build`.

## Arborescence
- `src/app/` : routes. Slugs en français (`/connexion`, `/invites`, `/plan-de-table`…). Zone connectée dans `(app)/`, RSVP public dans `r/[token]`.
- `src/features/<module>/` : `components/`, `actions.ts` (Server Actions), `queries.ts`, `schemas.ts` (Zod).
- `src/components/ui/` : design system. `src/lib/` : clients Supabase, realtime, utilitaires.
- `supabase/migrations/` : SQL numéroté. `supabase/seed.sql` : référentiels. `supabase/tests/` : tests RLS.

## Design
- Jetons dans `src/styles/tokens.ts`, à garder **synchronisés** avec `@theme` dans `src/app/globals.css` (un test le vérifie).
- Couleurs : ivoire `ivory` (fond), noir `ink` (texte, bouton principal), `gold` **décoratif uniquement sur fond clair** (texte or → `gold-deep`), `field` pour les bordures de champs.
- Titres en `font-serif` (Cormorant Garamond), texte en `font-sans` (Inter). Beaucoup d'espace blanc ; cartes `rounded-3xl`, boutons pilule.
- Accessibilité : contrastes AA (testés), **cibles tactiles ≥ 44 px** (`min-h-touch`), labels reliés aux champs, focus visible, `prefers-reduced-motion` respecté.

## Conventions
- Code et identifiants en anglais ; textes d'interface, commentaires métier et URL en français.
- Montants en **centimes** (`bigint`, EUR), pourcentages en **points de base** (10 000 = 100 %).
- Toute table porte un `wedding_id` (ON DELETE CASCADE) et une RLS fondée sur `is_wedding_member(wedding_id)`.
- Le client anonyme n'accède à aucune table : le RSVP public passe par des RPC `SECURITY DEFINER` appelées côté serveur.
- Les jetons (RSVP, invitation partenaire) sont aléatoires (≥ 32 octets) ; ceux à usage unique sont stockés hachés (sha256).
- Un commit par étape testable.

## Règles métier validées
- **Cérémonie** : sélection multiple (`civile`, `religieuse`, `laique`).
- **Temps** : mairie, cérémonie, dîner, brunch. Le couple coche, par foyer, les temps auxquels il est invité ; l'invité ne voit que ceux-là.
- **+1** : autorisé par personne ; l'invité saisit le nom du +1 (créé comme `guest` avec `plus_one_of`).
- **Enfants** : simple booléen `is_child`.
- **Recherche RSVP** : prénom + nom exact d'un membre, sans tenir compte des accents ni de la casse, sans auto-complétion. En cas d'homonymes, on demande le prénom d'un autre membre du foyer. Un nom inconnu reçoit un message neutre.
- **Modification** : possible jusqu'à la date limite ; ensuite le formulaire est fermé et seul le couple peut corriger. Chaque réponse garde sa `source` (`guest_form` | `couple`).
- **Régimes** : liste fermée (végétarien, végétalien, sans gluten, sans porc, halal, casher, allergie + précision). Ce sont des données sensibles (art. 9 RGPD), d'où une case de consentement explicite et une purge automatique 6 mois après le mariage.
- **Limites RSVP** : 20 recherches et 10 envois par heure et par IP ; 50 envois par jour et par mariage.
- **Suppression** : chaque conjoint peut supprimer tout le mariage, après avoir retapé les deux prénoms.
- **Invitation du partenaire** : lien à usage unique, valable 7 jours, 2 membres maximum.

## Feuille de route — release 1
1. ✅ Squelette, design system, PWA, CLAUDE.md
2. Migrations du socle + RLS, clients Supabase, auth (lien magique + Google)
3. Onboarding
4. Invitation du partenaire
5. Synchronisation temps réel
6. Invités (foyers)
7. RSVP : réglages + formulaire public + limites de tentatives
8. Saisie manuelle des réponses par le couple
9. Suppression du mariage / RGPD
10. Migrations anticipées : budget, rétroplanning, plan de table

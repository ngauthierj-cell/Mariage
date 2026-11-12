# Mise en place de Supabase, Google et Vercel

Compter environ 20 minutes. Tout est gratuit (offres « Free »).

## 1. Créer le projet Supabase

1. Créer un compte sur supabase.com, puis **New project**.
   - Nom : `mariage`
   - Région : **West EU (Paris)** (`eu-west-3`), pour garder les données en France (RGPD)
   - Mot de passe de base : le générer et le garder dans un gestionnaire de mots de passe
2. Dans **Project Settings > API Keys**, noter :
   - l'URL du projet (`https://xxxx.supabase.co`)
   - la clé **publishable** (`sb_publishable_…`)
   - la clé **secret** (`sb_secret_…`, à ne jamais exposer)
3. En local : `cp .env.example .env.local`, puis remplir les valeurs.

## 2. Appliquer les migrations

```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>   # le « ref » est dans l'URL du projet
npx supabase db push                              # applique supabase/migrations/*
npm run db:types                                  # régénère src/types/database.ts
```

## 3. Configurer l'authentification

**Authentication > URL Configuration**
- Site URL : `http://localhost:3000` (puis l'URL Vercel de production)
- Redirect URLs : `http://localhost:3000/**` et `https://<domaine>/**`
  (le lien de l'e-mail est construit à partir de l'URL de redirection : sans ces entrées, il serait cassé)

**Authentication > Email Templates > Magic Link** (et **Confirm signup**)
- Sujet : `Votre lien de connexion`
- Corps : copier le contenu de `supabase/templates/magic_link.html`

> Ce modèle envoie à la fois un **lien** (`/auth/confirm`) et un **code à 6 chiffres**.
> Le code est indispensable pour la PWA installée sur iPhone : un lien ouvert depuis
> l'app Mail s'ouvre dans Safari, qui ne partage pas sa session avec l'app installée.

**E-mails en production** : l'envoi intégré de Supabase est limité à quelques e-mails
par heure, ce qui convient pour les tests. Avant l'ouverture au public, brancher un SMTP
(par exemple Brevo, gratuit jusqu'à 300 e-mails par jour et hébergé en France) dans
**Authentication > SMTP Settings**.

## 4. Connexion Google

1. Sur console.cloud.google.com : créer un projet, puis ouvrir **APIs & Services > OAuth consent screen**.
   - Type : External ; nom de l'app : « Notre Mariage » ; e-mail d'assistance
   - Scopes : `openid`, `email`, `profile`
2. **Credentials > Create credentials > OAuth client ID**
   - Type : Web application
   - Authorized JavaScript origins : `http://localhost:3000`, `https://<domaine>`
   - Authorized redirect URIs : `https://<ref>.supabase.co/auth/v1/callback`
3. Dans Supabase, **Authentication > Sign In / Providers > Google** : activer, puis coller le Client ID et le Client Secret.

## 5. Vercel

1. Sur vercel.com : **Add New > Project**, puis importer le dépôt GitHub `Mariage`.
2. Variables d'environnement : les 3 clés Supabase, plus `NEXT_PUBLIC_SITE_URL=https://<domaine>`.
3. Déployer, puis reporter l'URL obtenue dans Supabase (Site URL, Redirect URLs) et dans Google (origins).

## Tests de la base en local

`npm run db:test` crée un Postgres jetable, y reproduit le minimum de Supabase
(`scripts/db/supabase-shim.sql`), applique les migrations et lance les tests pgTAP
de `supabase/tests/`. Prérequis : Postgres 16+, pgTAP et pg_prove.
Avec Docker, `npx supabase start && npx supabase test db` donne le même résultat
sur la vraie pile Supabase.

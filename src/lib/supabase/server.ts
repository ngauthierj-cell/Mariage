import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * À créer à chaque requête : il lit/écrit les cookies de session.
 */
export async function createClient() {
  // cookies() puis connection() d'abord : rendu à la requête uniquement (le client
  // Supabase lit l'heure courante, interdit pendant un pré-rendu avec Cache Components).
  const cookieStore = await cookies();
  await connection();
  const { url, key } = getSupabasePublicEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : écriture impossible, le proxy rafraîchit la session.
        }
      },
    },
  });
}

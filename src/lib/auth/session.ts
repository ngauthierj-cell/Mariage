import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_PATH } from "./routes";

export type CurrentUser = { id: string; email: string | null };

/**
 * Utilisateur connecté (JWT vérifié via getClaims). Redirige vers la connexion sinon.
 * Mémoïsé pour la durée de la requête.
 */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) redirect(LOGIN_PATH);
  return { id: sub, email: typeof data.claims.email === "string" ? data.claims.email : null };
});

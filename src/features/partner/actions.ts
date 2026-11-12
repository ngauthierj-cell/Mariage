"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/auth/routes";
import { requireUser } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type InvitationResult =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; error: string };

/** Génère un nouveau lien (révoque le précédent). Le jeton n'est visible qu'ici. */
export async function createInvitation(): Promise<InvitationResult> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_partner_invitation");
  if (error || !data?.[0]) {
    return {
      ok: false,
      error: error?.hint === "full" ? "Votre moitié a déjà rejoint votre espace." : "Impossible de créer le lien. Réessayez.",
    };
  }
  const site = await getSiteUrl();
  revalidatePath("/reglages");
  return { ok: true, url: `${site}/rejoindre/${data[0].token}`, expiresAt: data[0].expires_at };
}

export async function revokeInvitation(): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.rpc("revoke_partner_invitation");
  revalidatePath("/reglages");
}

export type AcceptState = { error?: string };

const ACCEPT_ERRORS: Record<string, string> = {
  invalid: "Ce lien d'invitation n'est pas valide.",
  used: "Ce lien a déjà été utilisé.",
  revoked: "Ce lien a été annulé. Demandez-en un nouveau.",
  expired: "Ce lien a expiré. Demandez-en un nouveau.",
  full: "Cet espace compte déjà deux membres.",
  already_member: "Vous faites déjà partie d'un autre mariage.",
};

export async function acceptInvitation(_prev: AcceptState, formData: FormData): Promise<AcceptState> {
  await requireUser();
  const token = String(formData.get("token") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_partner_invitation", { p_token: token });
  if (error) return { error: ACCEPT_ERRORS[error.hint ?? ""] ?? "Impossible de rejoindre cet espace. Réessayez." };
  redirect(HOME_PATH);
}

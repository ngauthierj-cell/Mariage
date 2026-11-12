import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export type PartnerStatus = {
  members: Array<{ userId: string; side: Enums<"wedding_side">; joinedAt: string; displayName: string | null }>;
  activeInvitation: { expiresAt: string } | null;
};

/** Membres du mariage courant et invitation en cours (RLS : mariage de l'utilisateur uniquement). */
export async function getPartnerStatus(weddingId: string): Promise<PartnerStatus> {
  const supabase = await createClient();
  const [members, profiles, invitations] = await Promise.all([
    supabase.from("wedding_members").select("user_id, side, joined_at").eq("wedding_id", weddingId).order("side"),
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("partner_invitations")
      .select("expires_at")
      .eq("wedding_id", weddingId)
      .is("used_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  if (members.error || profiles.error || invitations.error) throw new Error("Lecture des membres impossible.");

  const names = new Map(profiles.data.map((p) => [p.id, p.display_name]));
  return {
    members: members.data.map((m) => ({
      userId: m.user_id,
      side: m.side,
      joinedAt: m.joined_at,
      displayName: names.get(m.user_id) ?? null,
    })),
    activeInvitation: invitations.data[0] ? { expiresAt: invitations.data[0].expires_at } : null,
  };
}

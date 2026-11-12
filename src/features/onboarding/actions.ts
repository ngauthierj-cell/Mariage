"use server";

import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/auth/routes";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { todayInParis } from "@/lib/utils/dates";
import { parseOnboardingForm, type FieldErrors } from "./schemas";

export type OnboardingState = { errors?: FieldErrors; formError?: string };

export async function createWedding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  await requireUser();
  const parsed = parseOnboardingForm(formData, todayInParis());
  if (!parsed.success) return { errors: parsed.errors };

  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_wedding", {
    p_partner_a_name: d.partner_a_name,
    p_partner_b_name: d.partner_b_name,
    p_date_precision: d.date_precision,
    p_wedding_date: d.wedding_date ?? undefined,
    p_venue_name: d.venue_name ?? undefined,
    p_venue_city: d.venue_city ?? undefined,
    p_is_abroad: d.is_abroad,
    p_ceremony_types: d.ceremony_types,
    p_estimated_guests: d.estimated_guests ?? undefined,
    p_total_budget_cents: d.total_budget_cents ?? undefined,
    p_has_bachelor_parties: d.has_bachelor_parties,
    p_has_stationery: d.has_stationery,
    p_has_registry: d.has_registry,
    p_has_honeymoon: d.has_honeymoon,
    p_vendor_codes: d.vendor_codes,
  });

  // Déjà membre d'un mariage (double envoi, autre onglet…) : on y va directement.
  if (error && error.hint !== "already_member") {
    return { formError: "La création a échoué. Vérifiez votre connexion et réessayez." };
  }
  redirect(HOME_PATH);
}

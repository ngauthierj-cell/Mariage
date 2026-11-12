import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export const ONBOARDING_PATH = "/bienvenue";

/** Mariage de l'utilisateur connecté (RLS : un seul visible), ou null. */
export const getCurrentWedding = cache(async (): Promise<Tables<"weddings"> | null> => {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("weddings").select("*").maybeSingle();
  if (error) throw new Error(`Lecture du mariage impossible : ${error.message}`);
  return data;
});

/** Comme getCurrentWedding, mais renvoie vers l'onboarding s'il n'y a pas encore de mariage. */
export async function requireWedding(): Promise<Tables<"weddings">> {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect(ONBOARDING_PATH);
  return wedding;
}

export async function getVendorCategories(): Promise<Tables<"vendor_categories">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("vendor_categories").select("*").order("sort");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  return data;
}

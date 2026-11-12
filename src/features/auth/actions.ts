"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH, safeNextPath } from "@/lib/auth/routes";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "./errors";
import { emailSchema, otpCodeSchema } from "./schemas";

export type LoginState =
  | { step: "email"; error?: string; email?: string }
  | { step: "code"; email: string; error?: string };

/** Étape 1 : envoi d'un e-mail contenant un lien magique et un code. */
export async function requestEmailOtp(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  const rawEmail = String(formData.get("email") ?? "");
  if (!parsed.success) return { step: "email", email: rawEmail, error: parsed.error.issues[0].message };

  const next = safeNextPath(formData.get("suite") as string | null);
  const site = await getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${site}/auth/callback?suite=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { step: "email", email: rawEmail, error: authErrorMessage(error.code) };
  return { step: "code", email: parsed.data };
}

/** Étape 2 (alternative au lien) : saisie du code reçu par e-mail. */
export async function verifyEmailOtp(prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = prev.step === "code" ? prev.email : "";
  const parsed = otpCodeSchema.safeParse(String(formData.get("code") ?? ""));
  if (!email) return { step: "email", error: "Saisissez d'abord votre adresse e-mail." };
  if (!parsed.success) return { step: "code", email, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: parsed.data, type: "email" });
  if (error) return { step: "code", email, error: authErrorMessage(error.code) };

  redirect(safeNextPath(formData.get("suite") as string | null));
}

/** Connexion Google (OAuth, flux PKCE). */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNextPath(formData.get("suite") as string | null);
  const site = await getSiteUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${site}/auth/callback?suite=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`${LOGIN_PATH}?erreur=google`);
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}

/** Point d'entrée unique du formulaire de connexion (un seul état côté client). */
export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  return formData.get("intent") === "verify" ? verifyEmailOtp(prev, formData) : requestEmailOtp(prev, formData);
}

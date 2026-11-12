import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "magiclink", "signup"];

/**
 * Lien de connexion reçu par e-mail.
 * - Modèle personnalisé : `?token_hash=…&type=email` — fonctionne même si le lien
 *   est ouvert dans un autre navigateur que celui de la demande (cas fréquent sur mobile).
 * - Modèle par défaut de Supabase : `?code=…` (PKCE, même navigateur uniquement).
 * `suite` indique la page où revenir (ex. une invitation du partenaire).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("suite"));

  const supabase = await createClient();
  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}${LOGIN_PATH}?erreur=lien`);
}

/** Routes de l'espace connecté (zone `(app)`). */
export const PROTECTED_PREFIXES = [
  "/accueil",
  "/bienvenue",
  "/invites",
  "/budget",
  "/planning",
  "/plan-de-table",
  "/reglages",
] as const;

export const LOGIN_PATH = "/connexion";
export const HOME_PATH = "/accueil";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * N'accepte que des chemins internes (évite les redirections ouvertes
 * du type `?suite=//evil.com` ou `?suite=https://evil.com`).
 */
export function safeNextPath(next: string | null | undefined, fallback: string = HOME_PATH): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  try {
    const url = new URL(next, "http://local");
    if (url.origin !== "http://local") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

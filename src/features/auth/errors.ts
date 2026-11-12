/** Traduit les erreurs Supabase Auth en messages compréhensibles. */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Trop de demandes. Patientez une minute avant de réessayer.";
    case "otp_expired":
      return "Ce code a expiré ou est incorrect. Demandez-en un nouveau.";
    case "email_address_invalid":
      return "Adresse e-mail invalide.";
    case "signup_disabled":
      return "Les inscriptions sont momentanément fermées.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}

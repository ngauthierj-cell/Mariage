import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Adresse e-mail invalide." }));

/** Code à usage unique reçu par e-mail (6 chiffres par défaut, jusqu'à 8 selon la config). */
export const otpCodeSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{6,8}$/, { error: "Le code doit contenir 6 chiffres." }));

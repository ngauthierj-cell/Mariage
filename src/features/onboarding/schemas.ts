import { z } from "zod";
import { isValidIsoDate } from "@/lib/utils/dates";
import { parseEurosToCents } from "@/lib/utils/money";

export const CEREMONY_TYPES = ["civile", "religieuse", "laique"] as const;
export const OPTIONS = ["has_bachelor_parties", "has_stationery", "has_registry", "has_honeymoon"] as const;

/** Étapes de l'assistant ; chaque champ appartient à une étape (pour y revenir en cas d'erreur). */
export const STEPS = ["couple", "date", "lieu", "ceremonie", "invites", "prestataires", "options"] as const;
export type Step = (typeof STEPS)[number];

export const FIELD_STEP: Record<string, Step> = {
  partner_a_name: "couple",
  partner_b_name: "couple",
  date_precision: "date",
  wedding_date: "date",
  wedding_month: "date",
  venue_name: "lieu",
  venue_city: "lieu",
  location: "lieu",
  ceremony_types: "ceremonie",
  estimated_guests: "invites",
  total_budget: "invites",
  vendor_codes: "prestataires",
};

const name = z.string().trim().min(1, "Indiquez un prénom.").max(60, "60 caractères maximum.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .transform((v) => (v === "" ? null : v));

export type WeddingInput = {
  partner_a_name: string;
  partner_b_name: string;
  date_precision: "day" | "month" | "unknown";
  wedding_date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  is_abroad: boolean;
  ceremony_types: (typeof CEREMONY_TYPES)[number][];
  estimated_guests: number | null;
  total_budget_cents: number | null;
  has_bachelor_parties: boolean;
  has_stationery: boolean;
  has_registry: boolean;
  has_honeymoon: boolean;
  vendor_codes: string[];
};

export type FieldErrors = Partial<Record<string, string>>;

/** Valide le formulaire d'onboarding. `today` (AAAA-MM-JJ, Paris) borne la date du mariage. */
export function parseOnboardingForm(
  form: FormData,
  today: string,
): { success: true; data: WeddingInput } | { success: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const str = (k: string) => String(form.get(k) ?? "");

  const a = name.safeParse(str("partner_a_name"));
  if (!a.success) errors.partner_a_name = a.error.issues[0].message;
  const b = name.safeParse(str("partner_b_name"));
  if (!b.success) errors.partner_b_name = b.error.issues[0].message;

  // Date
  const precisionParsed = z.enum(["day", "month", "unknown"]).safeParse(str("date_precision") || "unknown");
  const date_precision = precisionParsed.success ? precisionParsed.data : "unknown";
  let wedding_date: string | null = null;
  const maxYear = Number(today.slice(0, 4)) + 6;
  if (date_precision === "day") {
    const d = str("wedding_date");
    if (!isValidIsoDate(d)) errors.wedding_date = "Indiquez la date du mariage.";
    else if (d < today) errors.wedding_date = "La date doit être à venir.";
    else if (Number(d.slice(0, 4)) > maxYear) errors.wedding_date = "Date trop lointaine.";
    else wedding_date = d;
  } else if (date_precision === "month") {
    const m = str("wedding_month");
    const d = `${m}-01`;
    if (!/^\d{4}-\d{2}$/.test(m) || !isValidIsoDate(d)) errors.wedding_month = "Indiquez le mois envisagé.";
    else if (m < today.slice(0, 7)) errors.wedding_month = "Le mois doit être à venir.";
    else if (Number(m.slice(0, 4)) > maxYear) errors.wedding_month = "Date trop lointaine.";
    else wedding_date = d;
  }

  // Lieu
  const venueName = optionalText(120).safeParse(str("venue_name"));
  if (!venueName.success) errors.venue_name = venueName.error.issues[0].message;
  const venueCity = optionalText(120).safeParse(str("venue_city"));
  if (!venueCity.success) errors.venue_city = venueCity.error.issues[0].message;

  // Cérémonies
  const ceremonies = form.getAll("ceremony_types").map(String);
  const ceremony_types = CEREMONY_TYPES.filter((c) => ceremonies.includes(c));

  // Invités et budget
  let estimated_guests: number | null = null;
  const guests = str("estimated_guests").trim();
  if (guests !== "") {
    const n = Number(guests);
    if (!Number.isInteger(n) || n < 0 || n > 2000) errors.estimated_guests = "Entre 0 et 2 000 invités.";
    else estimated_guests = n;
  }
  const total_budget_cents = parseEurosToCents(str("total_budget"));
  if (total_budget_cents !== null && (Number.isNaN(total_budget_cents) || total_budget_cents > 100_000_000_000)) {
    errors.total_budget = "Montant invalide (ex. 25 000).";
  }

  const vendor_codes = [...new Set(form.getAll("vendor_codes").map(String))].filter((c) => /^[a-z_]+$/.test(c));

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      partner_a_name: a.data!,
      partner_b_name: b.data!,
      date_precision,
      wedding_date,
      venue_name: venueName.data ?? null,
      venue_city: venueCity.data ?? null,
      is_abroad: str("location") === "abroad",
      ceremony_types,
      estimated_guests,
      total_budget_cents: total_budget_cents === null || Number.isNaN(total_budget_cents) ? null : total_budget_cents,
      has_bachelor_parties: form.get("has_bachelor_parties") === "on",
      has_stationery: form.get("has_stationery") === "on",
      has_registry: form.get("has_registry") === "on",
      has_honeymoon: form.get("has_honeymoon") === "on",
      vendor_codes,
    },
  };
}

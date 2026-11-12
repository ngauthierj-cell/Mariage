import type { Enums } from "@/types/database";

const TZ = "Europe/Paris";
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export function todayInParis(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    now,
  );
}

function toUtc(isoDate: string): Date {
  const m = ISO_DATE.exec(isoDate);
  if (!m) throw new Error(`Date invalide : ${isoDate}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function isValidIsoDate(isoDate: string): boolean {
  if (!ISO_DATE.test(isoDate)) return false;
  const d = toUtc(isoDate);
  return d.toISOString().slice(0, 10) === isoDate;
}

/** Nombre de jours calendaires entre deux dates AAAA-MM-JJ (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

export function formatWeddingDate(precision: Enums<"date_precision">, date: string | null): string {
  if (precision === "unknown" || !date) return "Date à définir";
  const options: Intl.DateTimeFormatOptions =
    precision === "day"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
      : { month: "long", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("fr-FR", options).format(toUtc(date));
}

/** Compte à rebours « J-x » (date exacte uniquement), ou null. */
export function countdownLabel(precision: Enums<"date_precision">, date: string | null, today: string): string | null {
  if (precision !== "day" || !date) return null;
  const days = daysBetween(today, date);
  if (days < 0) return null;
  if (days === 0) return "C'est aujourd'hui !";
  return `J-${days}`;
}

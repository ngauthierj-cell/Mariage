/** "25 000", "25000,50", "25 000 €" → centimes. null si vide, NaN si invalide. */
export function parseEurosToCents(input: string): number | null {
  const cleaned = input.replace(/[\s  €]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  const [euros, decimals = ""] = cleaned.split(".");
  return Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
}

export function formatCents(cents: number, { decimals = false } = {}): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(cents / 100);
}

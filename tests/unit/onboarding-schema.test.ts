import { describe, expect, it } from "vitest";
import { parseOnboardingForm } from "@/features/onboarding/schemas";

const TODAY = "2026-11-12";

function form(entries: Array<[string, string]>) {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

const base: Array<[string, string]> = [
  ["partner_a_name", " Emma "],
  ["partner_b_name", "Félix"],
];

describe("parseOnboardingForm", () => {
  it("accepte le minimum (prénoms seuls)", () => {
    const r = parseOnboardingForm(form(base), TODAY);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.partner_a_name).toBe("Emma");
      expect(r.data.date_precision).toBe("unknown");
      expect(r.data.wedding_date).toBeNull();
      expect(r.data.total_budget_cents).toBeNull();
    }
  });

  it("formulaire complet", () => {
    const r = parseOnboardingForm(
      form([
        ...base,
        ["date_precision", "month"],
        ["wedding_month", "2027-06"],
        ["venue_name", "Domaine des Oliviers"],
        ["venue_city", "Aix-en-Provence"],
        ["location", "france"],
        ["ceremony_types", "laique"],
        ["ceremony_types", "civile"],
        ["estimated_guests", "120"],
        ["total_budget", "25 000"],
        ["vendor_codes", "dj"],
        ["vendor_codes", "dj"],
        ["vendor_codes", "caterer"],
        ["has_honeymoon", "on"],
      ]),
      TODAY,
    );
    expect(r).toMatchObject({
      success: true,
      data: {
        wedding_date: "2027-06-01",
        ceremony_types: ["civile", "laique"],
        estimated_guests: 120,
        total_budget_cents: 2_500_000,
        vendor_codes: ["dj", "caterer"],
        has_honeymoon: true,
        has_registry: false,
        is_abroad: false,
      },
    });
  });

  it("refuse des prénoms vides et une date passée", () => {
    const r = parseOnboardingForm(
      form([
        ["partner_a_name", "  "],
        ["partner_b_name", ""],
        ["date_precision", "day"],
        ["wedding_date", "2026-11-11"],
      ]),
      TODAY,
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(Object.keys(r.errors).sort()).toEqual(["partner_a_name", "partner_b_name", "wedding_date"]);
    }
  });

  it("accepte le jour même et le mois en cours", () => {
    expect(parseOnboardingForm(form([...base, ["date_precision", "day"], ["wedding_date", TODAY]]), TODAY).success).toBe(true);
    expect(parseOnboardingForm(form([...base, ["date_precision", "month"], ["wedding_month", "2026-11"]]), TODAY).success).toBe(true);
  });

  it("refuse un budget ou un nombre d'invités invalides", () => {
    const r = parseOnboardingForm(form([...base, ["estimated_guests", "-3"], ["total_budget", "beaucoup"]]), TODAY);
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(r.errors).sort()).toEqual(["estimated_guests", "total_budget"]);
  });

  it("ignore les types de cérémonie inconnus", () => {
    const r = parseOnboardingForm(form([...base, ["ceremony_types", "pirate"]]), TODAY);
    expect(r.success && r.data.ceremony_types).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { countdownLabel, daysBetween, formatWeddingDate, isValidIsoDate, todayInParis } from "@/lib/utils/dates";
import { formatCents, parseEurosToCents } from "@/lib/utils/money";

describe("dates", () => {
  it("todayInParis tient compte du fuseau (23h30 UTC = lendemain à Paris en été)", () => {
    expect(todayInParis(new Date("2027-06-11T23:30:00Z"))).toBe("2027-06-12");
  });
  it("daysBetween traverse le changement d'heure", () => {
    expect(daysBetween("2027-03-27", "2027-03-29")).toBe(2);
  });
  it("isValidIsoDate refuse le 30 février", () => {
    expect(isValidIsoDate("2027-02-30")).toBe(false);
    expect(isValidIsoDate("2027-02-28")).toBe(true);
  });
  it("formate en français", () => {
    expect(formatWeddingDate("day", "2027-06-12")).toBe("samedi 12 juin 2027");
    expect(formatWeddingDate("month", "2027-06-01")).toBe("juin 2027");
    expect(formatWeddingDate("unknown", null)).toBe("Date à définir");
  });
  it("compte à rebours", () => {
    expect(countdownLabel("day", "2027-06-12", "2027-06-02")).toBe("J-10");
    expect(countdownLabel("day", "2027-06-12", "2027-06-12")).toBe("C'est aujourd'hui !");
    expect(countdownLabel("day", "2027-06-12", "2027-06-13")).toBeNull();
    expect(countdownLabel("month", "2027-06-01", "2027-05-01")).toBeNull();
  });
});

describe("montants", () => {
  it.each([
    ["25 000", 2_500_000],
    ["25000,50", 2_500_050],
    ["25 000 €", 2_500_000],
    ["12.5", 1_250],
    ["", null],
  ])("parseEurosToCents(%j) = %j", (input, expected) => {
    expect(parseEurosToCents(input)).toBe(expected);
  });
  it.each(["abc", "-5", "1,234"])("refuse %j", (input) => {
    expect(parseEurosToCents(input)).toBeNaN();
  });
  it("formatCents", () => {
    expect(formatCents(2_500_000).replace(/\s/g, " ")).toBe("25 000 €");
  });
});

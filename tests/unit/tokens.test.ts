import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/utils/contrast";
import { colors } from "@/styles/tokens";

const AA_TEXT = 4.5;
const AA_UI = 3;

describe("contrastes AA", () => {
  const backgrounds = { ivory: colors.ivory, surface: colors.surface, champagne: colors.champagne };

  it.each(Object.entries(backgrounds))("texte courant lisible sur %s", (_, bg) => {
    for (const fg of [colors.ink, colors.muted, colors.goldDeep, colors.danger, colors.success]) {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it("bouton principal (ivoire sur noir) et or sur noir", () => {
    expect(contrastRatio(colors.ivory, colors.ink)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(colors.gold, colors.ink)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("bordures de champs ≥ 3:1", () => {
    expect(contrastRatio(colors.field, colors.surface)).toBeGreaterThanOrEqual(AA_UI);
    expect(contrastRatio(colors.field, colors.ivory)).toBeGreaterThanOrEqual(AA_UI);
  });

  it("l'or clair reste décoratif sur fond clair", () => {
    expect(contrastRatio(colors.gold, colors.ivory)).toBeLessThan(AA_TEXT);
  });
});

describe("synchronisation tokens.ts ↔ globals.css", () => {
  const css = readFileSync("src/app/globals.css", "utf8").toLowerCase();
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

  it.each(Object.entries(colors))("--color-%s", (name, value) => {
    expect(css).toContain(`--color-${kebab(name)}: ${value.toLowerCase()};`);
  });
});

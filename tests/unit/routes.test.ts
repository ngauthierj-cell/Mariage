import { describe, expect, it } from "vitest";
import { isProtectedPath, safeNextPath } from "@/lib/auth/routes";

describe("isProtectedPath", () => {
  it.each(["/accueil", "/invites", "/invites/123", "/plan-de-table", "/rejoindre/xyz"])("%s est protégé", (p) => {
    expect(isProtectedPath(p)).toBe(true);
  });
  it.each(["/", "/connexion", "/r/abc", "/rejoindreX", "/invitesX", "/hors-ligne"])("%s est public", (p) => {
    expect(isProtectedPath(p)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("garde un chemin interne", () => {
    expect(safeNextPath("/invites?tri=nom")).toBe("/invites?tri=nom");
  });
  it.each([null, "", "https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "invites"])(
    "refuse %s",
    (v) => {
      expect(safeNextPath(v)).toBe("/accueil");
    },
  );
});

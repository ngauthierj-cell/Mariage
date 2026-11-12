/**
 * Jetons de couleur de l'identité « chic » : ivoire, noir profond, or/champagne.
 * Source unique de vérité : `globals.css` doit rester aligné (vérifié par les tests).
 *
 * Règles de contraste (WCAG AA) :
 * - `gold` (or clair) est DÉCORATIF sur fond clair (2,3:1). Pour du texte or sur
 *   ivoire, utiliser `goldDeep`. `gold` reste lisible sur fond `ink`.
 * - `line` sert aux séparateurs décoratifs ; les bordures de champs de formulaire
 *   utilisent `field` (≥ 3:1, exigence pour les composants d'interface).
 */
export const colors = {
  ivory: "#FAF7F0",
  surface: "#FFFFFF",
  champagne: "#F1E6D0",
  ink: "#16130F",
  muted: "#5E574C",
  gold: "#C6A15B",
  goldDeep: "#7D5F25",
  line: "#E7DFCF",
  field: "#8A8072",
  danger: "#9B2C2C",
  success: "#2F6B3F",
} as const;

export type ColorToken = keyof typeof colors;

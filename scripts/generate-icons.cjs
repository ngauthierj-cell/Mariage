// Génère les icônes PWA à partir d'un SVG (esperluette or sur fond noir).
// Usage : node scripts/generate-icons.cjs  (utilise Playwright/Chromium)
const { chromium } = require("playwright");
const { mkdir } = require("node:fs/promises");

const INK = "#16130F";
const GOLD = "#C6A15B";

// `safe` = fraction de la zone utile (les icônes maskable doivent tenir dans 80 %).
function svg(size, { safe = 1, rounded = false } = {}) {
  const r = rounded ? size * 0.22 : 0;
  const font = size * 0.62 * safe;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" fill="${INK}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.36 * safe}" fill="none" stroke="${GOLD}" stroke-width="${size * 0.012}"/>
    <text x="50%" y="50%" dy="0.33em" text-anchor="middle" font-family="'Cormorant Garamond', 'DejaVu Serif', Georgia, serif"
      font-style="italic" font-size="${font}" fill="${GOLD}">&amp;</text>
  </svg>`;
}

const targets = [
  ["icon-192.png", 192, { rounded: true }],
  ["icon-512.png", 512, { rounded: true }],
  ["icon-maskable-512.png", 512, { safe: 0.78 }],
  ["apple-touch-icon.png", 180, {}],
];

(async () => {
await mkdir("public/icons", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, size, opts] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size, opts)}</body></html>`);
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log("✓", name);
}
await browser.close();
})();

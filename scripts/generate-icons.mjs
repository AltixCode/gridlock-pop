#!/usr/bin/env node
/**
 * Regenerates every store/launcher asset from one vector source, so the icon, the adaptive icon
 * and the splash mark can never drift apart. Run: npm run assets
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const BG = '#0B1020';
const TILES = [
  { x: 0, y: 1, base: '#38BDF8', dark: '#0EA5E9' },
  { x: 1, y: 1, base: '#A78BFA', dark: '#8B5CF6' },
  { x: 1, y: 0, base: '#FBBF24', dark: '#F59E0B' },
  { x: 2, y: 0, base: '#F472B6', dark: '#EC4899' },
];

/** The mark: a 3x2 cluster of tiles reading as a piece mid-placement. */
function mark({ size = 1024, inset = 0.2, withBackground = true, monochrome = false }) {
  const board = size * (1 - inset * 2);
  const cell = board / 3;
  const gap = cell * 0.08;
  const tile = cell - gap;
  const radius = tile * 0.26;
  // The cluster spans 3 columns x 2 rows — centre that bounding box, not the notional 3x3 grid.
  const originX = (size - 3 * cell) / 2 + gap / 2;
  const originY = (size - 2 * cell) / 2 + gap / 2;

  const tiles = TILES.map(({ x, y, base, dark }) => {
    const px = originX + x * cell;
    const py = originY + y * cell;
    const lift = tile * 0.1;
    const fill = monochrome ? '#FFFFFF' : base;
    const shade = monochrome ? '#FFFFFF' : dark;
    return `
      <rect x="${px}" y="${py}" width="${tile}" height="${tile}" rx="${radius}" fill="${shade}"/>
      <rect x="${px}" y="${py}" width="${tile}" height="${tile - lift}" rx="${radius}" fill="${fill}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${withBackground ? `<rect width="${size}" height="${size}" fill="${BG}"/>` : ''}
    ${tiles}
  </svg>`;
}

async function render(svg, out, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log(`✓ ${out}`);
}

await mkdir('assets', { recursive: true });

// Store / launcher icon — opaque, no transparency (App Store rejects alpha channels).
await render(mark({ size: 1024, inset: 0.16 }), 'assets/icon.png', 1024);
// Adaptive icon foreground — Android masks the outer 33%, so the mark sits well inside.
await render(
  mark({ size: 1024, inset: 0.3, withBackground: false }),
  'assets/android-icon-foreground.png',
  1024,
);
await render(
  mark({ size: 1024, inset: 0.3, withBackground: false, monochrome: true }),
  'assets/android-icon-monochrome.png',
  1024,
);
await writeFile(
  'assets/android-icon-background.png',
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: BG },
  })
    .png()
    .toBuffer(),
);
console.log('✓ assets/android-icon-background.png');
// Splash mark — transparent, drawn over the splash background colour.
await render(
  mark({ size: 1024, inset: 0.26, withBackground: false }),
  'assets/splash-icon.png',
  1024,
);
await render(mark({ size: 256, inset: 0.14 }), 'assets/favicon.png', 48);

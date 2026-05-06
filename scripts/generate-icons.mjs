/**
 * Generates PWA icons from logo-glyph.svg.
 * Run once: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'public', 'logo-glyph.svg');
const out = resolve(root, 'public', 'icons');

mkdirSync(out, { recursive: true });

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
];

for (const { name, size, maskable } of sizes) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - padding * 2;

  const icon = sharp(src).resize(inner, inner);

  if (maskable) {
    // Amber background (#F59E0B) with centered glyph — safe zone = 80%
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 245, g: 158, b: 11, alpha: 1 },
      },
    })
      .composite([{ input: await icon.toBuffer(), top: padding, left: padding }])
      .png()
      .toFile(resolve(out, name));
  } else {
    // White background
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: await icon.toBuffer(), top: padding, left: padding }])
      .png()
      .toFile(resolve(out, name));
  }

  console.log(`✓ ${name} (${size}×${size}${maskable ? ' maskable' : ''})`);
}

// Screenshot placeholder (390×844 white)
await sharp({
  create: { width: 390, height: 844, channels: 4, background: { r: 250, g: 250, b: 250, alpha: 1 } },
})
  .png()
  .toFile(resolve(out, 'screenshot-mobile.png'));
console.log('✓ screenshot-mobile.png (placeholder)');

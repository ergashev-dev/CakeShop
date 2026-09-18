import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, 'public');
const svgPath = path.resolve(publicDir, 'cake-logo.svg');

// Google SERP and modern mobile favicon SVG with rich, high-contrast, premium styling
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="50%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#EAB308"/>
      <stop offset="100%" stop-color="#CA8A04"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Solid rounded base circle -->
  <circle cx="60" cy="60" r="58" fill="url(#bgGrad)" filter="url(#shadow)"/>
  <circle cx="60" cy="60" r="54" fill="none" stroke="#FDE047" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.8"/>

  <!-- Cake Stand -->
  <ellipse cx="60" cy="94" rx="34" ry="6" fill="#F8FAFC" opacity="0.9"/>
  <path d="M54 94 L50 102 L70 102 L66 94 Z" fill="#E2E8F0"/>

  <!-- Bottom Cake Tier -->
  <path d="M32 72 C32 72, 32 88, 60 88 C88 88, 88 72, 88 72 L88 80 C88 86, 75 90, 60 90 C45 90, 32 86, 32 80 Z" fill="url(#goldGrad)"/>
  <ellipse cx="60" cy="72" rx="28" ry="8" fill="#FEF08A"/>

  <!-- Middle Tier Frosting -->
  <path d="M40 56 C40 56, 40 70, 60 70 C80 70, 80 56, 80 56 L80 63 C80 67, 71 70, 60 70 C49 70, 40 67, 40 63 Z" fill="#FFFFFF"/>
  <ellipse cx="60" cy="56" rx="20" ry="6" fill="#FFFFFF"/>

  <!-- Cream Drips -->
  <path d="M40 58 Q45 66 50 59 Q55 67 60 59 Q65 67 70 59 Q75 66 80 58" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>

  <!-- Strawberries / Cherries on top -->
  <circle cx="50" cy="54" r="4.5" fill="#EF4444"/>
  <circle cx="60" cy="53" r="5" fill="#DC2626"/>
  <circle cx="70" cy="54" r="4.5" fill="#EF4444"/>

  <!-- Candle -->
  <rect x="58" y="34" width="4" height="14" rx="2" fill="url(#goldGrad)"/>
  
  <!-- Candle Flame -->
  <path d="M60 22 C62.5 26, 64 29, 60 33 C56 29, 57.5 26, 60 22 Z" fill="#F59E0B"/>
  <circle cx="60" cy="29" r="2" fill="#FEF08A"/>

  <!-- Brand Sparkles -->
  <path d="M26 34 L28 38 L32 40 L28 42 L26 46 L24 42 L20 40 L24 38 Z" fill="#FDE047"/>
  <path d="M92 40 L93.5 43 L96.5 44.5 L93.5 46 L92 49 L90.5 46 L87.5 44.5 L90.5 43 Z" fill="#FDE047"/>
</svg>`;

async function generate() {
  console.log('Generating high-res favicons for Google SERP & mobile...');
  const svgBuffer = Buffer.from(faviconSvg);

  // 1. 48x48 (Google Search Primary Standard Favicon)
  const p48 = path.resolve(publicDir, 'favicon-48x48.png');
  await sharp(svgBuffer).resize(48, 48).png().toFile(p48);
  console.log('✅ Created favicon-48x48.png');

  // 2. 96x96 (High-DPI Google Favicon)
  const p96 = path.resolve(publicDir, 'favicon-96x96.png');
  await sharp(svgBuffer).resize(96, 96).png().toFile(p96);
  console.log('✅ Created favicon-96x96.png');

  // 3. 180x180 (Apple Touch Icon)
  const p180 = path.resolve(publicDir, 'apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile(p180);
  console.log('✅ Created apple-touch-icon.png');

  // 4. 192x192 (Android / PWA icon)
  const p192 = path.resolve(publicDir, 'favicon-192x192.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile(p192);
  console.log('✅ Created favicon-192x192.png');

  // 5. 512x512 (Store / PWA splash)
  const p512 = path.resolve(publicDir, 'favicon-512x512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile(p512);
  console.log('✅ Created favicon-512x512.png');

  // 6. ICO file at root (/favicon.ico)
  // Standard ICO header with 48x48 PNG embedded
  const png48Buffer = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const icoPath = path.resolve(publicDir, 'favicon.ico');
  
  // Create multi-layer ICO structure for maximum browser & crawler compatibility
  // ICO header: 2 bytes reserved (0), 2 bytes type (1 = ICO), 2 bytes image count (1)
  const header = Buffer.from([0, 0, 1, 0, 1, 0]);
  // Directory entry (16 bytes):
  // width (48), height (48), color palette (0), reserved (0), color planes (1, 0), bpp (32, 0), size (4 bytes), offset (4 bytes: 6 + 16 = 22)
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(48, 0); // width
  dirEntry.writeUInt8(48, 1); // height
  dirEntry.writeUInt8(0, 2);  // color palette
  dirEntry.writeUInt8(0, 3);  // reserved
  dirEntry.writeUInt16LE(1, 4); // color planes
  dirEntry.writeUInt16LE(32, 6); // bpp
  dirEntry.writeUInt32LE(png48Buffer.length, 8); // image size
  dirEntry.writeUInt32LE(22, 12); // offset

  const icoBuffer = Buffer.concat([header, dirEntry, png48Buffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('✅ Created standard /favicon.ico (Googlebot compatible)');

  // Also write the SVG version as favicon.svg for modern browser tabs
  fs.writeFileSync(path.resolve(publicDir, 'favicon.svg'), faviconSvg);
  console.log('✅ Updated favicon.svg');
}

generate().catch(console.error);

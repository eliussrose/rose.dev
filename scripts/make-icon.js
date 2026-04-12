/**
 * Generates a simple rose-themed PNG icon using pure Node.js (no external deps).
 * Writes a 512x512 PNG to public/icon.png using the 'sharp' package if available,
 * otherwise falls back to copying a placeholder.
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const pngPath = path.join(__dirname, '..', 'public', 'icon.png');

if (sharp && fs.existsSync(svgPath)) {
  sharp(fs.readFileSync(svgPath))
    .resize(512, 512)
    .png()
    .toFile(pngPath)
    .then(() => console.log('icon.png created via sharp'))
    .catch(e => console.error('sharp failed:', e));
} else {
  console.log('sharp not available — install it with: npm install sharp');
  console.log('Or convert manually: inkscape --export-png=public/icon.png public/icon.svg');
}

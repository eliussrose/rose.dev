/**
 * Copies missing dependencies into .next/standalone/node_modules
 * so the standalone server can run without the full node_modules tree.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STANDALONE = path.join(ROOT, '.next', 'standalone');
const STANDALONE_NM = path.join(STANDALONE, 'node_modules');
const ROOT_NM = path.join(ROOT, 'node_modules');

// Packages that Next.js standalone needs but doesn't always copy
const REQUIRED = [
  '@swc/helpers',
  'sharp',
];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) return; // already there
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// Also copy .next/static into standalone/public/_next/static (required for assets)
const staticSrc = path.join(ROOT, '.next', 'static');
const staticDest = path.join(STANDALONE, '.next', 'static');
if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
  copyDir(staticSrc, staticDest);
  console.log('Copied .next/static into standalone');
}

// Copy public folder
const publicSrc = path.join(ROOT, 'public');
const publicDest = path.join(STANDALONE, 'public');
if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
  copyDir(publicSrc, publicDest);
  console.log('Copied public into standalone');
}

// Copy required node_modules
for (const pkg of REQUIRED) {
  const src = path.join(ROOT_NM, pkg);
  const dest = path.join(STANDALONE_NM, pkg);
  if (fs.existsSync(src)) {
    copyDir(src, dest);
    console.log(`Copied ${pkg} into standalone/node_modules`);
  }
}

console.log('Standalone deps copy complete.');

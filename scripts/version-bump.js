/**
 * Auto Version Bump Script
 * Increments patch version on each build
 * @copyright Copyright (c) 2026 Prosinres. All rights reserved.
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

// Parse current version
const [major, minor, patch] = pkg.version.split('.').map(Number);

// Increment patch version
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`✓ Version bumped: ${major}.${minor}.${patch} → ${newVersion}`);

// Update version in electron-builder.json if exists
const builderPath = path.join(__dirname, '..', 'electron-builder.json');
if (fs.existsSync(builderPath)) {
  const builder = JSON.parse(fs.readFileSync(builderPath, 'utf-8'));
  // electron-builder uses package.json version automatically
  console.log(`✓ Electron builder will use version: ${newVersion}`);
}

/**
 * Version Reset Script
 * Resets version to a specific value
 * @copyright Copyright (c) 2026 Prosinres. All rights reserved.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const packagePath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

console.log(`Current version: ${pkg.version}`);

rl.question('Enter new version (e.g., 2.0.0): ', (newVersion) => {
  // Validate version format
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('❌ Invalid version format. Use: major.minor.patch (e.g., 2.0.0)');
    rl.close();
    process.exit(1);
  }

  pkg.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  
  console.log(`✓ Version reset to: ${newVersion}`);
  rl.close();
});

const fs = require('fs');
const path = require('path');

console.log('Bundling Node.js binary for production...');

// Find Node.js executable
const nodePath = process.execPath;
const targetDir = path.join(__dirname, '..', 'resources');
const targetPath = path.join(targetDir, 'node.exe');

// Create resources directory
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy Node.js binary
try {
  fs.copyFileSync(nodePath, targetPath);
  console.log('✓ Node.js binary copied to:', targetPath);
  console.log('✓ Size:', (fs.statSync(targetPath).size / 1024 / 1024).toFixed(2), 'MB');
} catch (error) {
  console.error('✗ Failed to copy Node.js binary:', error.message);
  process.exit(1);
}

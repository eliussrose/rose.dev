/**
 * Downloads and bundles Node.js portable for Windows
 * This ensures the app can run without requiring Node.js to be installed
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const NODE_VERSION = '20.11.0'; // LTS version
const ARCH = 'x64';
const PLATFORM = 'win';

const DOWNLOAD_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.zip`;
const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
const ZIP_FILE = path.join(RESOURCES_DIR, 'node.zip');
const NODE_EXE = path.join(RESOURCES_DIR, 'node.exe');

// Create resources directory
if (!fs.existsSync(RESOURCES_DIR)) {
  fs.mkdirSync(RESOURCES_DIR, { recursive: true });
}

// Check if node.exe already exists
if (fs.existsSync(NODE_EXE)) {
  console.log('✓ node.exe already exists in resources/');
  process.exit(0);
}

console.log(`Downloading Node.js v${NODE_VERSION} for Windows...`);
console.log(`URL: ${DOWNLOAD_URL}`);

// Download the zip file
const file = fs.createWriteStream(ZIP_FILE);
https.get(DOWNLOAD_URL, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download: ${response.statusCode}`);
    process.exit(1);
  }

  const totalSize = parseInt(response.headers['content-length'], 10);
  let downloaded = 0;

  response.on('data', (chunk) => {
    downloaded += chunk.length;
    const percent = ((downloaded / totalSize) * 100).toFixed(1);
    process.stdout.write(`\rDownloading: ${percent}%`);
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('\n✓ Download complete');
    
    // Extract node.exe from zip
    console.log('Extracting node.exe...');
    try {
      // Use PowerShell to extract (available on all Windows)
      const extractCmd = `powershell -command "Expand-Archive -Path '${ZIP_FILE}' -DestinationPath '${RESOURCES_DIR}' -Force"`;
      execSync(extractCmd, { stdio: 'inherit' });
      
      // Find and move node.exe to resources root
      const extractedDir = path.join(RESOURCES_DIR, `node-v${NODE_VERSION}-${PLATFORM}-${ARCH}`);
      const extractedNodeExe = path.join(extractedDir, 'node.exe');
      
      if (fs.existsSync(extractedNodeExe)) {
        fs.copyFileSync(extractedNodeExe, NODE_EXE);
        console.log('✓ node.exe extracted successfully');
        
        // Clean up
        fs.unlinkSync(ZIP_FILE);
        fs.rmSync(extractedDir, { recursive: true, force: true });
        console.log('✓ Cleanup complete');
      } else {
        console.error('✗ node.exe not found in extracted files');
        process.exit(1);
      }
    } catch (error) {
      console.error('✗ Extraction failed:', error.message);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  fs.unlinkSync(ZIP_FILE);
  console.error('✗ Download failed:', err.message);
  process.exit(1);
});

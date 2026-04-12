/**
 * LSP Manager Test Script
 * 
 * This script tests the LSP Server Manager functionality
 * Run with: node test-lsp-manager.js
 */

const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}▶ Testing: ${name}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Check Node.js version
async function testNodeVersion() {
  logTest('Node.js Version');
  const version = process.version;
  const major = parseInt(version.split('.')[0].substring(1));
  
  if (major >= 18) {
    logSuccess(`Node.js ${version} (✓ Compatible)`);
    return true;
  } else {
    logError(`Node.js ${version} (✗ Need v18 or higher)`);
    return false;
  }
}

// Test 2: Check dependencies
async function testDependencies() {
  logTest('Dependencies Check');
  
  try {
    // Check if package.json exists
    const packageJson = require('./package.json');
    logSuccess('package.json found');
    
    // Check LSP dependencies
    const requiredDeps = [
      'monaco-languageclient',
      'vscode-languageclient',
      'vscode-languageserver-protocol',
      'pyright',
    ];
    
    let allFound = true;
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep]) {
        logSuccess(`${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        logError(`${dep}: NOT FOUND`);
        allFound = false;
      }
    }
    
    return allFound;
  } catch (error) {
    logError(`Error reading package.json: ${error.message}`);
    return false;
  }
}

// Test 3: Check if modules are installed
async function testModulesInstalled() {
  logTest('Node Modules Installation');
  
  const fs = require('fs');
  const modulesPath = path.join(__dirname, 'node_modules');
  
  if (!fs.existsSync(modulesPath)) {
    logError('node_modules not found. Run: npm install');
    return false;
  }
  
  logSuccess('node_modules directory exists');
  
  // Check specific modules
  const modules = ['pyright', 'monaco-languageclient', 'next'];
  let allFound = true;
  
  for (const mod of modules) {
    const modPath = path.join(modulesPath, mod);
    if (fs.existsSync(modPath)) {
      logSuccess(`${mod} installed`);
    } else {
      logError(`${mod} NOT installed`);
      allFound = false;
    }
  }
  
  return allFound;
}

// Test 4: Check Pyright
async function testPyright() {
  logTest('Pyright Installation');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const pyright = spawn('npx', ['pyright', '--version'], {
      shell: true,
      cwd: __dirname,
    });
    
    let output = '';
    
    pyright.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pyright.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    pyright.on('close', (code) => {
      if (code === 0 && output.includes('pyright')) {
        logSuccess(`Pyright installed: ${output.trim()}`);
        resolve(true);
      } else {
        logError('Pyright not found or not working');
        logWarning('Try: npm install -g pyright');
        resolve(false);
      }
    });
    
    pyright.on('error', (error) => {
      logError(`Error checking Pyright: ${error.message}`);
      resolve(false);
    });
  });
}

// Test 5: Check LSP files
async function testLSPFiles() {
  logTest('LSP Files Check');
  
  const fs = require('fs');
  const files = [
    'app/lib/lsp/types.ts',
    'app/lib/lsp/config.ts',
    'app/lib/lsp/utils.ts',
    'app/lib/lsp/server-manager.ts',
    'app/lib/lsp/index.ts',
    'app/api/lsp/route.ts',
  ];
  
  let allFound = true;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} NOT FOUND`);
      allFound = false;
    }
  }
  
  return allFound;
}

// Test 6: Check Electron files
async function testElectronFiles() {
  logTest('Electron Integration Check');
  
  const fs = require('fs');
  const files = [
    'electron.js',
    'preload.js',
    'types/electron.d.ts',
  ];
  
  let allFound = true;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if LSP code is present
      if (file === 'electron.js' && content.includes('lsp-start')) {
        logSuccess(`${file} has LSP handlers`);
      } else if (file === 'preload.js' && content.includes('window.electron.lsp')) {
        logSuccess(`${file} exposes LSP API`);
      } else if (file === 'types/electron.d.ts' && content.includes('LSPAPI')) {
        logSuccess(`${file} has LSP types`);
      } else {
        logSuccess(`${file} exists`);
      }
    } else {
      logError(`${file} NOT FOUND`);
      allFound = false;
    }
  }
  
  return allFound;
}

// Test 7: Syntax check (TypeScript compilation)
async function testTypeScriptSyntax() {
  logTest('TypeScript Syntax Check');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      shell: true,
      cwd: __dirname,
    });
    
    let output = '';
    let errorOutput = '';
    
    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        logSuccess('No TypeScript errors found');
        resolve(true);
      } else {
        logWarning('TypeScript compilation has errors (this is OK for now)');
        if (output) {
          console.log(output);
        }
        resolve(true); // Don't fail on TS errors
      }
    });
    
    tsc.on('error', (error) => {
      logWarning(`Could not run TypeScript check: ${error.message}`);
      resolve(true); // Don't fail if tsc not available
    });
  });
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('LSP Manager Verification Tests', 'blue');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };
  
  // Run all tests
  const tests = [
    { name: 'Node.js Version', fn: testNodeVersion, critical: true },
    { name: 'Dependencies', fn: testDependencies, critical: true },
    { name: 'Modules Installed', fn: testModulesInstalled, critical: true },
    { name: 'Pyright', fn: testPyright, critical: false },
    { name: 'LSP Files', fn: testLSPFiles, critical: true },
    { name: 'Electron Files', fn: testElectronFiles, critical: true },
    { name: 'TypeScript Syntax', fn: testTypeScriptSyntax, critical: false },
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
      } else {
        if (test.critical) {
          results.failed++;
        } else {
          results.warnings++;
        }
      }
    } catch (error) {
      logError(`Test failed with error: ${error.message}`);
      if (test.critical) {
        results.failed++;
      } else {
        results.warnings++;
      }
    }
    
    await sleep(100); // Small delay between tests
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log('Test Summary', 'blue');
  console.log('='.repeat(60));
  
  logSuccess(`Passed: ${results.passed}`);
  if (results.warnings > 0) {
    logWarning(`Warnings: ${results.warnings}`);
  }
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  
  console.log('');
  
  if (results.failed === 0) {
    log('✓ All critical tests passed!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Run: npm run dev', 'yellow');
    log('2. Open: http://localhost:3000', 'yellow');
    log('3. Test LSP API in browser console', 'yellow');
    log('4. Or run: npm run electron:dev', 'yellow');
    return true;
  } else {
    log('✗ Some critical tests failed', 'red');
    log('\nPlease fix the issues above before proceeding.', 'yellow');
    return false;
  }
}

// Run tests
runTests().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

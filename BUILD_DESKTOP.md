# 🖥️ Desktop App Build Guide - Kora AI

## 📋 Overview

Kora AI can be built as a standalone desktop application (.exe for Windows, .dmg for Mac, .AppImage for Linux) using Electron.

---

## 🚀 Quick Build

### Windows (.exe):
```bash
npm install
npm run electron:build:win
```

### Mac (.dmg):
```bash
npm install
npm run electron:build:mac
```

### Linux (.AppImage):
```bash
npm install
npm run electron:build:linux
```

**Output:** `dist-electron/` folder

---

## 📦 What's Included

### Electron Setup:
- **electron.js** - Main process (window management, IPC)
- **preload.js** - Secure bridge between renderer and main
- **electron-builder.json** - Build configuration

### Features in Desktop App:
- ✅ Native window (no browser chrome)
- ✅ System tray integration
- ✅ File system access
- ✅ Native terminal execution
- ✅ Auto-updates (can be configured)
- ✅ Offline mode support
- ✅ Better performance

---

## 🛠️ Development Mode

### Run in Electron (Development):
```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Electron
npm run electron
```

### Or use single command:
```bash
npm run electron:dev
```

This will:
1. Start Next.js dev server on port 3000
2. Wait for server to be ready
3. Launch Electron window
4. Enable hot reload

---

## 📦 Build Process Explained

### Step 1: Next.js Build
```bash
npm run build
```
- Creates optimized production build
- Outputs to `out/` folder (static export)
- Minifies and optimizes assets

### Step 2: Electron Build
```bash
electron-builder
```
- Packages Next.js build with Electron
- Creates installers for target platform
- Signs and notarizes (if configured)

### Combined:
```bash
npm run electron:build
```

---

## 🎯 Build Targets

### Windows:
- **NSIS Installer** - Standard Windows installer
- **Portable** - No installation required
- **Architectures:** x64, ia32 (32-bit)

### Mac:
- **DMG** - Disk image installer
- **ZIP** - Compressed app bundle
- **Universal** - Intel + Apple Silicon (optional)

### Linux:
- **AppImage** - Universal Linux package
- **DEB** - Debian/Ubuntu package
- **RPM** - RedHat/Fedora package (optional)

---

## ⚙️ Configuration

### electron-builder.json

```json
{
  "appId": "com.taskkora.koraai",
  "productName": "Kora AI",
  "win": {
    "target": ["nsis", "portable"],
    "icon": "public/favicon.ico"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.developer-tools"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Development"
  }
}
```

### Customize:
- Change `appId` for your fork
- Update `icon` path
- Add/remove build targets
- Configure auto-update server

---

## 🔧 Advanced Configuration

### Code Signing (Windows):

1. Get a code signing certificate
2. Add to `electron-builder.json`:
```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password"
  }
}
```

### Mac Notarization:

1. Get Apple Developer account
2. Add to `electron-builder.json`:
```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist"
  },
  "afterSign": "scripts/notarize.js"
}
```

### Auto-Updates:

1. Setup update server (GitHub Releases, S3, etc.)
2. Add to `electron.js`:
```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

---

## 📊 Build Sizes

### Approximate sizes:

**Windows:**
- Installer: ~150-200 MB
- Portable: ~180-220 MB

**Mac:**
- DMG: ~160-210 MB
- ZIP: ~150-200 MB

**Linux:**
- AppImage: ~170-220 MB
- DEB: ~150-200 MB

**Why so large?**
- Includes Chromium engine (~100 MB)
- Node.js runtime (~30 MB)
- Your app code and dependencies

---

## 🚀 Optimization Tips

### 1. Reduce Bundle Size:
```bash
# Analyze bundle
npm run build -- --analyze

# Remove unused dependencies
npm prune --production
```

### 2. Use asar Archive:
```json
{
  "asar": true,
  "asarUnpack": ["node_modules/sharp/**/*"]
}
```

### 3. Exclude Files:
```json
{
  "files": [
    "!**/*.map",
    "!**/*.md",
    "!**/test/**"
  ]
}
```

---

## 🐛 Troubleshooting

### Problem: "electron-builder not found"
```bash
npm install --save-dev electron-builder
```

### Problem: "Cannot find module 'electron'"
```bash
npm install --save-dev electron
```

### Problem: Build fails on Mac
```bash
# Install required tools
xcode-select --install
```

### Problem: Build fails on Linux
```bash
# Install dependencies
sudo apt-get install -y rpm
```

### Problem: "Next.js API routes not working"
**Solution:** API routes don't work in static export. Use Electron IPC instead:

```javascript
// Instead of fetch('/api/terminal')
const result = await window.electron.executeCommand(command);
```

---

## 🔄 Migration from Web to Desktop

### Update API calls:

**Before (Web):**
```typescript
const response = await fetch('/api/terminal', {
  method: 'POST',
  body: JSON.stringify({ command })
});
```

**After (Desktop):**
```typescript
if (window.electron?.isElectron) {
  // Use Electron IPC
  const result = await window.electron.executeCommand(command);
} else {
  // Use fetch for web
  const response = await fetch('/api/terminal', ...);
}
```

---

## 📱 Distribution

### Windows:
1. Upload `.exe` to GitHub Releases
2. Users download and install
3. Windows Defender may warn (need code signing)

### Mac:
1. Upload `.dmg` to GitHub Releases
2. Users drag to Applications folder
3. Gatekeeper may block (need notarization)

### Linux:
1. Upload `.AppImage` to GitHub Releases
2. Users make executable: `chmod +x KoraAI.AppImage`
3. Run: `./KoraAI.AppImage`

---

## 🎯 Next Steps

### After Building:

1. **Test the app:**
   - Install on clean machine
   - Test all features
   - Check for errors

2. **Create installer:**
   - Add custom installer UI
   - Include license agreement
   - Add desktop shortcuts

3. **Setup auto-updates:**
   - Configure update server
   - Test update mechanism
   - Add update notifications

4. **Distribute:**
   - Upload to GitHub Releases
   - Create download page
   - Write installation guide

---

## 📚 Resources

- **Electron Docs:** https://www.electronjs.org/docs
- **electron-builder:** https://www.electron.build/
- **Next.js Static Export:** https://nextjs.org/docs/app/building-your-application/deploying/static-exports

---

## 💡 Tips

### Development:
- Use `npm run electron:dev` for hot reload
- Check Electron DevTools (Ctrl+Shift+I)
- Test on target OS before building

### Production:
- Always test built app before release
- Use semantic versioning (2.0.0, 2.0.1, etc.)
- Keep changelog updated

### Performance:
- Minimize dependencies
- Use code splitting
- Enable asar compression

---

**Ready to build? Run:**
```bash
npm run electron:build:win
```

**Output will be in:** `dist-electron/`

🎉 Happy Building!

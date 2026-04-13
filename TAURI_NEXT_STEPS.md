# 🎯 Tauri Migration - Next Steps

## ✅ Completed So Far:

1. ✓ Rust installed (v1.94.1)
2. ✓ Tauri CLI installing
3. ✓ Tauri API installing
4. ✓ package.json updated with Tauri scripts
5. ✓ Next.js configured for static export
6. ✓ Templates created

---

## 📋 Remaining Steps:

### Step 1: Wait for Installation (5-10 minutes)

Tauri packages installing হচ্ছে। Installation complete হলে verify করুন:

```powershell
npx tauri --version
```

### Step 2: Initialize Tauri (10 minutes)

```powershell
npx tauri init
```

**Questions & Answers:**
- What is your app name? → `rose.dev AI IDE`
- What should the window title be? → `rose.dev AI IDE`
- Where are your web assets (relative to `<current dir>/src-tauri/tauri.conf.json`)? → `../.next`
- What is the url of your dev server? → `http://localhost:3000`
- What is your frontend dev command? → `npm run dev`
- What is your frontend build command? → `npm run build`

### Step 3: Update Tauri Configuration

After init, edit `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3000",
    "distDir": "../.next"
  },
  "package": {
    "productName": "rose.dev AI IDE",
    "version": "2.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "execute": true
      },
      "fs": {
        "all": true,
        "scope": ["$HOME/**", "$APPDATA/**"]
      },
      "dialog": {
        "all": true
      }
    },
    "bundle": {
      "identifier": "com.prosinres.rosedev.ide",
      "icon": ["icons/icon.ico"]
    },
    "windows": [
      {
        "title": "rose.dev AI IDE",
        "width": 1400,
        "height": 900
      }
    ]
  }
}
```

### Step 4: Create Rust Commands

Edit `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

#[tauri::command]
fn execute_command(command: String) -> Result<String, String> {
    let output = Command::new("cmd")
        .args(&["/C", &command])
        .output()
        .map_err(|e| e.to_string())?;
    
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            execute_command,
            read_file,
            write_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 5: Test Development Mode

```powershell
npm run tauri:dev
```

### Step 6: Build for Production

```powershell
npm run tauri:build
```

**Output:** `src-tauri/target/release/bundle/nsis/rose.dev-AI-IDE_2.0.0_x64-setup.exe`

---

## 🎯 Quick Commands:

```powershell
# Check Tauri version
npx tauri --version

# Initialize
npx tauri init

# Dev mode
npm run tauri:dev

# Build
npm run tauri:build
```

---

## ⏱️ Time Estimate:

- Installation: 5-10 minutes (in progress)
- Init & Config: 15 minutes
- Testing: 10 minutes
- **Total:** ~30-40 minutes for basic setup

---

## 📞 Status:

✅ Phase 1 Complete: Setup & Installation
⏳ Phase 2 Pending: Initialize & Configure
⏳ Phase 3 Pending: Test & Build

---

**Next:** Wait for installation to complete, then run `npx tauri init`

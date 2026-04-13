# 🚀 Tauri Migration Guide - rose.dev AI IDE

## 📋 Overview

Electron থেকে Tauri তে migrate করছি কারণ:
- ✅ 10x ছোট installer (15 MB vs 150 MB)
- ✅ 3x কম memory usage
- ✅ দ্রুত startup
- ✅ Better security
- ✅ কোনো production build সমস্যা নেই

---

## 🎯 Migration Steps

### Step 1: Prerequisites Install করুন

```powershell
# Rust install করুন (Tauri এর জন্য প্রয়োজন)
winget install --id Rustlang.Rustup

# Restart PowerShell
# Verify installation
rustc --version
cargo --version
```

### Step 2: Tauri CLI Install করুন

```powershell
# Tauri CLI install
npm install -D @tauri-apps/cli

# Tauri API install
npm install @tauri-apps/api
```

### Step 3: Tauri Initialize করুন

```powershell
# Initialize Tauri
npx tauri init

# প্রশ্নের উত্তর:
# App name: rose.dev AI IDE
# Window title: rose.dev AI IDE
# Web assets location: .next/out (static export)
# Dev server URL: http://localhost:3000
# Dev command: npm run dev
# Build command: npm run build
```

### Step 4: Next.js Configuration আপডেট করুন

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",  // Static export for Tauri
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: ".next",
  // Tauri specific
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
};

export default nextConfig;
```

### Step 5: API Routes কে Tauri Commands এ Convert করুন

Tauri তে API routes এর পরিবর্তে Rust commands ব্যবহার করতে হয়।

#### Example: Terminal Command

**Before (Next.js API):**
```typescript
// app/api/terminal/route.ts
export async function POST(req: Request) {
  const { command } = await req.json();
  // Execute command
}
```

**After (Tauri Command):**
```rust
// src-tauri/src/main.rs
#[tauri::command]
fn execute_command(command: String) -> Result<String, String> {
    use std::process::Command;
    
    let output = Command::new("cmd")
        .args(&["/C", &command])
        .output()
        .map_err(|e| e.to_string())?;
    
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
```

**Frontend (React):**
```typescript
import { invoke } from '@tauri-apps/api/tauri';

async function runCommand(cmd: string) {
  const result = await invoke<string>('execute_command', { command: cmd });
  return result;
}
```

### Step 6: File System Operations

```rust
// src-tauri/src/main.rs
use tauri::api::file;

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
```

### Step 7: Package.json Scripts আপডেট করুন

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:win": "tauri build --target x86_64-pc-windows-msvc"
  }
}
```

### Step 8: Tauri Configuration

```json
// src-tauri/tauri.conf.json
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
        "all": false,
        "execute": true,
        "open": true
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
      "active": true,
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.ico"
      ],
      "identifier": "com.prosinres.rosedev.ide",
      "targets": "all"
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "rose.dev AI IDE",
        "width": 1400,
        "height": 900
      }
    ]
  }
}
```

---

## 🔄 API Routes Migration Map

### 1. Terminal API → Tauri Command
```rust
#[tauri::command]
fn execute_command(command: String, cwd: Option<String>) -> Result<CommandOutput, String>
```

### 2. File System API → Tauri FS
```rust
#[tauri::command]
fn read_file(path: String) -> Result<String, String>

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String>

#[tauri::command]
fn delete_file(path: String) -> Result<(), String>
```

### 3. GitHub API → Keep as Frontend
GitHub API calls কে frontend থেকেই করুন (Tauri command এর দরকার নেই)

### 4. AI Analysis → Keep as Frontend
AI provider calls frontend থেকে করুন

---

## 📦 Build Process

### Development:
```powershell
npm run tauri:dev
```

### Production Build:
```powershell
npm run tauri:build
```

### Output:
```
src-tauri/target/release/bundle/
  ├── msi/rose.dev-AI-IDE_2.0.0_x64_en-US.msi  (~15 MB)
  └── nsis/rose.dev-AI-IDE_2.0.0_x64-setup.exe (~15 MB)
```

---

## ✅ Migration Checklist

- [ ] Rust installed
- [ ] Tauri CLI installed
- [ ] Tauri initialized
- [ ] Next.js configured for static export
- [ ] API routes converted to Tauri commands
- [ ] File system operations migrated
- [ ] Terminal commands migrated
- [ ] Icons prepared (32x32, 128x128, ico)
- [ ] Dev mode tested
- [ ] Production build tested
- [ ] Installer tested

---

## 🎯 Expected Results

### Before (Electron):
- Installer: 150 MB
- Memory: 200-300 MB
- Startup: 3-5 seconds
- Build issues: ✗

### After (Tauri):
- Installer: 10-15 MB
- Memory: 50-100 MB
- Startup: 1-2 seconds
- Build issues: ✓ None

---

## 🚀 Next Steps

1. Install Rust
2. Run migration commands
3. Test in dev mode
4. Build for production
5. Test installer

আমি কি এখন migration শুরু করব? 🎯

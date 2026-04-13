# 🔧 Tauri Build Requirements - Visual Studio Build Tools

## ❌ Current Error:

```
error: linker `link.exe` not found
note: the msvc targets depend on the msvc linker but `link.exe` was not found
note: please ensure that Visual Studio 2017 or later, or Build Tools for Visual Studio were installed with the Visual C++ option.
```

## ✅ Solution: Install Visual Studio Build Tools

### Option 1: Visual Studio Build Tools (Recommended - 7 GB)

1. Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. Run installer and select:
   - ✓ Desktop development with C++
   - ✓ MSVC v143 - VS 2022 C++ x64/x86 build tools
   - ✓ Windows 10/11 SDK

3. Install করুন (7-10 GB download)

### Option 2: Full Visual Studio Community (Free - 10+ GB)

1. Download: https://visualstudio.microsoft.com/vs/community/

2. Install with:
   - ✓ Desktop development with C++

### Option 3: Winget Command (Fastest)

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --silent --override "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

---

## 📋 After Installation:

### Step 1: Restart PowerShell

Close and reopen PowerShell to refresh environment variables.

### Step 2: Verify Installation

```powershell
# Check if link.exe is available
where.exe link.exe
```

Expected output:
```
C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.xx.xxxxx\bin\Hostx64\x64\link.exe
```

### Step 3: Build Tauri

```powershell
$env:Path += ";$env:USERPROFILE\.cargo\bin"
npm run tauri:build
```

---

## 🎯 Quick Install Command:

```powershell
# Install Build Tools via winget
winget install Microsoft.VisualStudio.2022.BuildTools --silent --override "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

# Wait for installation (10-15 minutes)
# Then restart PowerShell and run:
npm run tauri:build
```

---

## ⏱️ Time Estimate:

- Download: 10-15 minutes (7 GB)
- Installation: 10-15 minutes
- Build: 5-10 minutes
- **Total:** ~30-40 minutes

---

## 📝 Alternative: Use Electron Build

যদি Visual Studio install করতে না চান, তাহলে Electron build ব্যবহার করুন:

```powershell
npm run electron:build:win
```

Electron installer: `build-output\rose.dev-AI-IDE-Setup-2.0.27.exe` (150 MB)

---

## 🚀 Next Steps:

1. Install Visual Studio Build Tools (winget command উপরে দেওয়া আছে)
2. Restart PowerShell
3. Run: `npm run tauri:build`
4. Installer পাবেন: `src-tauri\target\release\bundle\nsis\rose.dev-AI-IDE_2.0.27_x64-setup.exe` (10-15 MB)

---

**Visual Studio Build Tools ছাড়া Tauri build করা সম্ভব না Windows এ।**

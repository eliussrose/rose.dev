# 🦀 Step 1: Rust Installation

## Install Rust

PowerShell **Administrator হিসেবে** চালান:

```powershell
# Method 1: Using winget (recommended)
winget install --id Rustlang.Rustup

# Method 2: Manual download
# Visit: https://rustup.rs/
# Download and run: rustup-init.exe
```

## After Installation

1. **PowerShell restart করুন** (গুরুত্বপূর্ণ!)
2. Verify installation:

```powershell
rustc --version
cargo --version
```

Expected output:
```
rustc 1.xx.x
cargo 1.xx.x
```

## Install Visual Studio Build Tools (Windows এর জন্য প্রয়োজন)

```powershell
# Download and install:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# অথবা Visual Studio Community install করুন
winget install --id Microsoft.VisualStudio.2022.Community
```

Installation এর সময় select করুন:
- ✅ Desktop development with C++
- ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
- ✅ Windows 10/11 SDK

## Verify Everything

```powershell
# Check Rust
rustc --version
cargo --version

# Check C++ compiler
cl.exe

# If cl.exe not found, add to PATH:
# C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.xx.xxxxx\bin\Hostx64\x64
```

## ⏱️ Installation Time

- Rust: 5-10 minutes
- Visual Studio Build Tools: 10-20 minutes
- Total: ~30 minutes

## 🎯 Next Step

After installation complete, run:
```powershell
npm install -D @tauri-apps/cli
npm install @tauri-apps/api
```

আমাকে জানান installation complete হলে! 🚀

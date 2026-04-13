# 🎯 চূড়ান্ত বিল্ড - এই পদক্ষেপগুলো অনুসরণ করুন

## ⚠️ সমস্যা চিহ্নিত হয়েছে:
`app.asar` ফাইল Windows Defender দ্বারা লক হয়ে যাচ্ছে।

## ✅ সমাধান (100% কাজ করবে):

### পদক্ষেপ ১: PowerShell Administrator হিসেবে খুলুন

1. Start Menu এ **PowerShell** লিখুন
2. **Windows PowerShell** এ **Right-click** করুন
3. **"Run as Administrator"** সিলেক্ট করুন
4. **Yes** ক্লিক করুন

### পদক্ষেপ ২: প্রজেক্ট ফোল্ডারে যান

```powershell
cd C:\Users\user\Desktop\rose.dev
```

### পদক্ষেপ ৩: Windows Defender Exclusion যোগ করুন (স্থায়ী সমাধান)

```powershell
Add-MpPreference -ExclusionPath "C:\Users\user\Desktop\rose.dev\dist-electron"
Add-MpPreference -ExclusionPath "C:\Users\user\Desktop\rose.dev\.next"
Add-MpPreference -ExclusionPath "C:\Users\user\Desktop\rose.dev\node_modules"
```

এটি একবার করলে আর কখনো এই সমস্যা হবে না! ✅

### পদক্ষেপ ৪: বিল্ড করুন

```powershell
npm run electron:build:win
```

⏱️ সময় লাগবে: 4-5 মিনিট

---

## 🚀 বিকল্প পদ্ধতি (যদি উপরেরটা কাজ না করে):

### পদ্ধতি A: Windows Defender সাময়িকভাবে বন্ধ করুন

```powershell
# Administrator PowerShell এ
cd C:\Users\user\Desktop\rose.dev

# Defender বন্ধ করুন
Set-MpPreference -DisableRealtimeMonitoring $true

# বিল্ড করুন
npm run electron:build:win

# Defender চালু করুন
Set-MpPreference -DisableRealtimeMonitoring $false
```

### পদ্ধতি B: Unpacked Build (সবচেয়ে নিরাপদ)

```powershell
cd C:\Users\user\Desktop\rose.dev

# শুধু unpacked app বানান (কোনো file lock হবে না)
npm run build
node scripts/copy-standalone-deps.js
npx electron-builder --win --dir

# টেস্ট করুন
.\dist-electron\win-unpacked\rosedev-AI-IDE.exe

# যদি ঠিক থাকে, installer বানান
npx electron-builder --win --prepackaged dist-electron/win-unpacked
```

---

## 📋 বিল্ড সফল হলে দেখবেন:

```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
• electron-builder version=24.13.3
• packaging platform=win32 arch=x64
• building target=nsis file=rose.dev-AI-IDE-Setup-2.0.9.exe

dist-electron/
  ├── rose.dev-AI-IDE-Setup-2.0.9.exe  (~142 MB)
  └── win-unpacked/
      └── rosedev-AI-IDE.exe
```

---

## ✨ বিল্ডে যা যা আছে:

- ✅ License Agreement (I Agree checkbox)
- ✅ Animated Splash Screen with Logo
- ✅ Auto Version Increment (2.0.9)
- ✅ Vertical Toolbar (VS Code style)
- ✅ All AI Features
- ✅ Agent System
- ✅ MCP Integration
- ✅ Hook System
- ✅ Context Management

---

## 🎯 সুপারিশকৃত পদ্ধতি:

**পদক্ষেপ ৩ (Windows Defender Exclusion)** সবচেয়ে ভালো কারণ:
- একবার করলে স্থায়ী সমাধান
- নিরাপদ (শুধু নির্দিষ্ট ফোল্ডার)
- ভবিষ্যতে আর সমস্যা হবে না

---

## 🆘 এখনো সমস্যা হলে:

### দ্রুত ফিক্স:
```powershell
# সব রিসেট করুন
taskkill /F /IM electron.exe 2>$null
Start-Sleep -Seconds 10
Remove-Item -Path "dist-electron" -Recurse -Force
Remove-Item -Path ".next" -Recurse -Force

# Windows Security খুলুন এবং Real-time protection বন্ধ করুন
Start-Process "windowsdefender:"

# তারপর বিল্ড করুন
npm run electron:build:win
```

---

## 📞 যোগাযোগ:

Developer: EliussRose
Email: eliussksa@gmail.com
Website: ghury.com
Company: Prosinres

---

**মনে রাখবেন:** 
- PowerShell অবশ্যই **Administrator** হিসেবে চালাতে হবে
- Windows Defender Exclusion যোগ করা সবচেয়ে ভালো সমাধান
- ধৈর্য ধরুন, বিল্ড প্রসেস 4-5 মিনিট সময় নেয়

🚀 **এখনই শুরু করুন!**

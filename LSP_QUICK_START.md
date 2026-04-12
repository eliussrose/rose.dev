# LSP Integration - Quick Start Guide

## 🚀 দ্রুত শুরু করুন (Quick Start)

### ধাপ ১: Node.js ইনস্টল করুন

1. https://nodejs.org/ থেকে LTS version ডাউনলোড করুন
2. Installer চালান এবং সব default options রাখুন
3. PowerShell রিস্টার্ট করুন

### ধাপ ২: Dependencies ইনস্টল করুন

```powershell
cd C:\Users\MHCL107\Desktop\rose.dev
npm install
```

### ধাপ ৩: Verification Test চালান

```powershell
node test-lsp-manager.js
```

এটি check করবে:
- ✅ Node.js version
- ✅ Dependencies installed
- ✅ Pyright available
- ✅ LSP files present
- ✅ Electron integration

### ধাপ ৪: Development Server চালান

```powershell
npm run dev
```

Browser-এ খুলুন: http://localhost:3000

### ধাপ ৫: LSP Test করুন (Browser Mode)

Console-এ paste করুন:

```javascript
// Start LSP server
const response = await fetch('/api/lsp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'start',
    workspaceRoot: 'C:\\Users\\MHCL107\\Desktop\\rose.dev',
  }),
});
const data = await response.json();
console.log('LSP Server:', data);
```

Expected output:
```javascript
{
  success: true,
  serverInfo: { pid: 12345, version: "1.1.350", ... },
  status: "connected"
}
```

### ধাপ ৬: Desktop App Test করুন (Optional)

```powershell
npm run electron:dev
```

Console-এ:

```javascript
// Check LSP API
console.log(window.electron.lsp);

// Start server
const result = await window.electron.lsp.start({
  workspaceRoot: 'C:\\Users\\MHCL107\\Desktop\\rose.dev',
});
console.log('Started:', result);
```

## 📚 Documentation

- **Full Verification Guide**: `app/lib/lsp/TASK3_VERIFICATION.md`
- **Task 2 Summary**: `app/lib/lsp/TASK2_COMPLETE.md`
- **LSP Library README**: `app/lib/lsp/README.md`
- **Design Document**: `.kiro/specs/lsp-integration/design.md`
- **Requirements**: `.kiro/specs/lsp-integration/requirements.md`
- **Tasks**: `.kiro/specs/lsp-integration/tasks.md`

## 🎯 Current Status

### ✅ Completed (Task 1 & 2)
- LSP Infrastructure setup
- Server Manager implementation
- API routes (browser mode)
- Electron IPC (desktop mode)
- Error handling & reconnection
- TypeScript types

### ⏳ Current (Task 3)
- Verification checkpoint
- Waiting for Node.js installation
- Ready to test

### ⏭️ Next (Task 4)
- LSP Client (Frontend)
- Monaco Editor integration
- Document synchronization
- Completion provider

## 🐛 Troubleshooting

### "npm is not recognized"
→ Node.js not installed. Install from https://nodejs.org/

### "pyright-langserver not found"
```powershell
npm install -g pyright
```

### "Port 3000 already in use"
```powershell
npx kill-port 3000
npm run dev
```

### "Module not found"
```powershell
npm install
```

## 📞 Need Help?

যদি কোন সমস্যা হয়:
1. `test-lsp-manager.js` চালান error দেখার জন্য
2. `TASK3_VERIFICATION.md` পড়ুন বিস্তারিত guide-এর জন্য
3. Console logs check করুন
4. আমাকে error message পাঠান

## 🎉 Success!

যদি সব test pass করে:
- ✅ Task 3 complete!
- ⏭️ Ready for Task 4: LSP Client implementation

---

**Current Step**: Node.js ইনস্টল করুন, তারপর `npm install` চালান! 🚀

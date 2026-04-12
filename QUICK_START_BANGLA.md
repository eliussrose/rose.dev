# 🚀 rose.dev - দ্রুত শুরু করার গাইড

## 📦 Installation (বর্তমানে চলছে...)

```bash
npm install  # চলছে... 5-10 মিনিট লাগতে পারে
```

**Warnings সম্পর্কে:** `deprecated` warnings দেখলে চিন্তা নেই, এগুলো electron-builder এর পুরনো dependencies। কাজ করবে।

---

## 🎯 Installation শেষ হলে:

### 1️⃣ Web Version চালান:
```bash
npm run dev
```
- Browser এ খুলুন: http://localhost:3000
- সব ফিচার কাজ করবে (Terminal ছাড়া কিছু সীমাবদ্ধতা)

### 2️⃣ Desktop Version চালান:
```bash
npm run electron:dev
```
- Native window খুলবে
- Better performance
- Full terminal support
- File system access

### 3️⃣ .exe File তৈরি করুন:
```bash
npm run electron:build:win
```
- Output: `dist-electron/KoraAI-Setup-2.0.0.exe`
- Portable version: `dist-electron/KoraAI-2.0.0.exe`
- Size: ~150-200 MB

---

## ⚙️ API Setup (প্রথম ব্যবহারের আগে)

### DeepSeek (সুপারিশকৃত - সস্তা ও ভালো):
1. যান: https://platform.deepseek.com/
2. Sign up করুন
3. API Keys → Create API Key
4. Key কপি করুন (sk-...)
5. rose.dev এ:
   - Sidebar → API Settings
   - Provider: DeepSeek
   - API Key: পেস্ট করুন
   - Model ID: `deepseek-chat`
   - Save

### অন্যান্য Options:
- **OpenAI**: GPT-4, GPT-3.5 (ব্যয়বহুল)
- **Anthropic**: Claude (ভালো কিন্তু দামি)
- **Gemini**: Google এর model (ফ্রি tier আছে)
- **Ollama**: Local/Offline (ফ্রি, কিন্তু ধীর)

---

## 🎨 মূল ফিচার সমূহ:

### 1. কোড এডিটিং:
- Monaco Editor (VS Code engine)
- 20+ languages support
- Multi-tab editing
- Syntax highlighting
- Auto-save

### 2. AI Assistant:
- Code generation
- Bug fixing
- Code review
- Refactoring
- Explanation

### 3. Project Analyzer:
- Automatic bug detection
- Django project detection
- Security scanning
- Code quality checks
- Suggestions

### 4. GitHub Integration:
- Clone repositories
- Commit & push changes
- Branch support
- Repository listing

### 5. Terminal:
- Python commands
- npm/yarn commands
- git commands
- Django management
- Real-time output

---

## 💡 ব্যবহারের উদাহরণ:

### Example 1: নতুন প্রজেক্ট তৈরি
```
AI Chat এ লিখুন:
"Create a Django blog app with Post, Comment models"

AI code generate করবে → Accept করুন → File save হবে
```

### Example 2: Bug Fix
```
1. Project Analyzer চালান
2. Issues দেখুন
3. AI Chat এ বলুন: "Fix all issues"
4. AI fixes suggest করবে
5. Accept/Reject করুন
```

### Example 3: GitHub থেকে Clone
```
1. Sidebar → GitHub tab
2. Token দিন
3. Repository name: "username/repo"
4. Clone করুন
5. Files load হবে
```

### Example 4: Terminal Commands
```
Terminal খুলুন (⌨️ button):
$ python --version
$ pip install django
$ python manage.py migrate
$ npm install
```

---

## 🔧 Troubleshooting:

### Problem: "API Key Invalid"
**Solution:**
- Key সঠিক আছে কিনা check করুন
- Provider সঠিক select করেছেন কিনা দেখুন
- DeepSeek key `sk-` দিয়ে শুরু হয়

### Problem: "Model Not Found"
**Solution:**
- DeepSeek এর জন্য: `deepseek-chat` বা `deepseek-coder`
- OpenAI এর জন্য: `gpt-4` বা `gpt-3.5-turbo`
- Gemini এর জন্য: `gemini-pro`

### Problem: Terminal কাজ করছে না
**Solution:**
- Desktop version ব্যবহার করুন (better support)
- Web version এ কিছু commands limited

### Problem: Build failed
**Solution:**
```bash
# Clean এবং rebuild
npm run build
npm run electron:build:win
```

---

## 📊 Performance Tips:

### 1. Desktop vs Web:
- **Desktop**: Fast, full features, offline capable
- **Web**: Slower, some limitations, online only

### 2. AI Model Selection:
- **Fast**: deepseek-chat, gpt-3.5-turbo
- **Smart**: gpt-4, claude-3
- **Free**: ollama (local)

### 3. Large Projects:
- শুধু প্রয়োজনীয় files upload করুন
- Analyzer ছোট projects এ ভালো কাজ করে
- Large repos এর জন্য GitHub clone ব্যবহার করুন

---

## 🎯 Next Steps:

### Installation শেষ হলে:
1. ✅ `npm run dev` চালান
2. ✅ API Settings configure করুন
3. ✅ একটি test project upload করুন
4. ✅ AI এর সাথে chat করুন
5. ✅ Desktop app build করুন

### আরো শিখুন:
- **FEATURES.md** - সব ফিচার বিস্তারিত
- **DEEPSEEK_SETUP.md** - DeepSeek setup guide
- **BUILD_DESKTOP.md** - Desktop app build guide
- **COMPLETE_GUIDE.md** - সম্পূর্ণ গাইড

---

## 🆘 সাহায্য প্রয়োজন?

### Documentation:
- README.md - Overview
- FEATURES.md - Feature list
- SETUP_BANGLA.md - বাংলা setup guide

### GitHub:
- Issues: Report bugs
- Discussions: Ask questions
- Pull Requests: Contribute

---

## 🎉 Ready to Code!

Installation complete হলে:
```bash
npm run dev
```

এবং coding শুরু করুন! 🚀

---

**Built with ❤️ by EliussRose**
**Developer: EliussRose | Email: eliussksa@gmail.com**

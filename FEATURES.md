# 🚀 Kora AI - নতুন ফিচার সমূহ (New Features)

## ✅ যা যোগ করা হয়েছে (What's Added)

### 1. 💻 Terminal Integration
- **ব্রাউজারে টার্মিনাল** - সরাসরি IDE তে কমান্ড রান করুন
- **Python কমান্ড সাপোর্ট** - `python manage.py runserver`, `pip install`, ইত্যাদি
- **Real-time Output** - কমান্ড এর আউটপুট সরাসরি দেখুন
- **Security** - বিপজ্জনক কমান্ড ব্লক করা হয়

**কিভাবে ব্যবহার করবেন:**
- Editor এর নিচে ডানদিকে ⌨️ বাটনে ক্লিক করুন
- Terminal খুলবে, কমান্ড টাইপ করুন এবং Enter চাপুন

**উদাহরণ কমান্ড:**
```bash
python --version
pip list
python manage.py migrate
npm install
git status
```

---

### 2. 🔍 Project Analyzer
- **স্বয়ংক্রিয় বাগ ডিটেকশন** - কোডে সমস্যা খুঁজে বের করে
- **Django প্রজেক্ট চিহ্নিতকরণ** - Django প্রজেক্ট স্বয়ংক্রিয়ভাবে চিহ্নিত করে
- **কোড কোয়ালিটি চেক** - Best practices অনুসরণ করছে কিনা দেখে
- **AI-Powered Analysis** - AI দিয়ে গভীর বিশ্লেষণ

**কিভাবে ব্যবহার করবেন:**
1. Sidebar এ "Analyzer" ট্যাবে ক্লিক করুন
2. "Analyze Project" বাটনে ক্লিক করুন
3. রিপোর্ট দেখুন - Issues, Suggestions, File Types

**যা চেক করে:**
- Python syntax errors
- Django settings (DEBUG, ALLOWED_HOSTS)
- Security vulnerabilities
- TODO comments
- Exception handling
- Code quality issues

---

### 3. 🐙 GitHub Integration
- **Repository Clone** - GitHub থেকে সরাসরি প্রজেক্ট ডাউনলোড করুন
- **Commit & Push** - পরিবর্তন GitHub এ আপলোড করুন
- **Repository List** - আপনার সব repository দেখুন
- **Branch Support** - বিভিন্ন branch এ কাজ করুন

**কিভাবে ব্যবহার করবেন:**

#### Setup:
1. GitHub Personal Access Token তৈরি করুন:
   - যান: https://github.com/settings/tokens
   - "Generate new token (classic)" ক্লিক করুন
   - Permissions: `repo` (সব) সিলেক্ট করুন
   - Token কপি করুন

2. Sidebar এ "GitHub" ট্যাবে যান
3. Token পেস্ট করুন

#### Clone Repository:
1. Repository name লিখুন (যেমন: `username/repo-name`)
2. অথবা "Load Repositories" বাটনে ক্লিক করে লিস্ট থেকে সিলেক্ট করুন
3. Branch name লিখুন (default: main)
4. "Clone Repository" ক্লিক করুন

#### Commit Changes:
1. ফাইল এডিট করুন
2. Commit message লিখুন
3. "Commit & Push" ক্লিক করুন

---

### 4. 🎨 Improved UI/UX
- **Tab Navigation** - Explorer, Analyzer, GitHub আলাদা ট্যাবে
- **Floating Action Buttons** - দ্রুত access এর জন্য
- **Mobile Responsive** - মোবাইলে সব ফিচার কাজ করে
- **Better Sidebar** - আরো organized এবং clean

---

## 🎯 Django প্রজেক্টের জন্য বিশেষ ফিচার

### Django Detection
যখন আপনি একটি Django প্রজেক্ট আপলোড করবেন, Analyzer স্বয়ংক্রিয়ভাবে:
- `manage.py` খুঁজে বের করবে
- `settings.py` চেক করবে
- Django-specific সমস্যা দেখাবে

### Django Warnings:
- ✅ DEBUG = True (Production এ বিপজ্জনক)
- ✅ SECRET_KEY exposed
- ✅ ALLOWED_HOSTS not configured
- ✅ Missing migrations

### Suggested Commands:
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
python manage.py collectstatic
```

---

## 📱 কিভাবে ব্যবহার করবেন (How to Use)

### Desktop:
1. **Sidebar (বাম)** - Files, Analyzer, GitHub
2. **Editor (মাঝে)** - কোড লিখুন
3. **Chat (ডান)** - AI এর সাথে কথা বলুন
4. **Terminal (নিচে)** - কমান্ড রান করুন

### Mobile:
1. **Floating Buttons** - ⌨️ Terminal, 🔍 Analyzer, 🐙 GitHub, 💬 Chat
2. **Swipe** - Chat এবং Editor এর মধ্যে switch করুন

---

## 🔐 Security Features

### Terminal Security:
নিচের কমান্ডগুলো ব্লক করা:
- `rm -rf` (ফাইল ডিলিট)
- `del /f` (Windows ফাইল ডিলিট)
- `format` (ডিস্ক ফরম্যাট)
- `mkfs` (ফাইল সিস্টেম তৈরি)

### GitHub Security:
- Token encrypted storage
- HTTPS only
- Personal Access Token (PAT) ব্যবহার

---

## 🚀 পরবর্তী ধাপ (Next Steps)

### আসছে শীঘ্রই:
1. **LSP Integration** - Smart autocomplete
2. **Debugger** - Breakpoints এবং debugging
3. **Git Diff Viewer** - Changes দেখুন
4. **Multi-user Collaboration** - একসাথে কোড করুন
5. **Desktop App (.exe)** - Electron/Tauri দিয়ে

---

## 💡 Tips & Tricks

### 1. দ্রুত Analysis:
- প্রথমে ছোট প্রজেক্ট দিয়ে টেস্ট করুন
- AI analysis এর জন্য API token সেট করুন

### 2. GitHub Workflow:
```
Clone → Edit → Analyze → Fix Issues → Commit → Push
```

### 3. Terminal Shortcuts:
- `python -m venv venv` - Virtual environment তৈরি
- `pip freeze > requirements.txt` - Dependencies save
- `python manage.py shell` - Django shell

### 4. AI Chat Tips:
- ফাইল drag করে chat এ যোগ করুন
- "Fix all issues" বলুন analyzer এর পরে
- "Create Django app" বলুন নতুন app এর জন্য

---

## 🐛 Known Issues & Limitations

### Terminal:
- Long-running commands (dev server) block করতে পারে
- Windows এ কিছু commands ভিন্নভাবে কাজ করে

### GitHub:
- Large repositories clone করতে সময় লাগে
- Binary files সাপোর্ট limited

### Analyzer:
- শুধু Python এবং Django এর জন্য optimized
- AI analysis API token প্রয়োজন

---

## 📞 Support

সমস্যা হলে:
1. Browser console চেক করুন (F12)
2. API Settings verify করুন
3. GitHub issue তৈরি করুন

---

**Built with ❤️ by Taskkora Team**

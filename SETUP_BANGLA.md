# 🚀 Kora AI - সেটআপ গাইড (বাংলা)

## 📋 প্রয়োজনীয় জিনিস

- Node.js 18+ ইনস্টল থাকতে হবে
- একটি AI API Token (Hugging Face, OpenAI, বা Ollama)
- GitHub Personal Access Token (optional, GitHub features এর জন্য)

---

## ⚡ দ্রুত শুরু (Quick Start)

### 1. প্রজেক্ট ডাউনলোড এবং ইনস্টল

```bash
# Repository clone করুন
git clone https://github.com/alornishan014/KoraGPT_IDE.git
cd KoraGPT_IDE

# Dependencies ইনস্টল করুন
npm install

# Development server চালু করুন
npm run dev
```

### 2. ব্রাউজার খুলুন
```
http://localhost:3000
```

---

## 🔑 API Setup (প্রথম বার)

### Option 1: Hugging Face (Free, Recommended)

1. যান: https://huggingface.co/settings/tokens
2. "New token" ক্লিক করুন
3. Token কপি করুন (hf_...)
4. Kora AI তে:
   - Sidebar → API Settings খুলুন
   - Provider: "Hugging Face" সিলেক্ট করুন
   - Token পেস্ট করুন
   - Model ID: `meta-llama/Llama-3.2-3B-Instruct`
   - Save ক্লিক করুন

### Option 2: Ollama (Local, Free, No Internet)

1. Ollama ইনস্টল করুন: https://ollama.ai/download
2. Terminal এ:
   ```bash
   ollama pull llama3
   ollama serve
   ```
3. Kora AI তে:
   - Provider: "Ollama (Local)" সিলেক্ট করুন
   - Model ID: `llama3`
   - Base URL: `http://localhost:11434` (optional)
   - Save ক্লিক করুন

### Option 3: OpenAI (Paid)

1. যান: https://platform.openai.com/api-keys
2. API Key তৈরি করুন
3. Kora AI তে:
   - Provider: "OpenAI (ChatGPT)"
   - Token: আপনার API key
   - Model ID: `gpt-4o` বা `gpt-3.5-turbo`
   - Save

---

## 🐙 GitHub Setup (Optional)

### Personal Access Token তৈরি:

1. যান: https://github.com/settings/tokens
2. "Generate new token (classic)" ক্লিক করুন
3. Token name দিন: `Kora AI`
4. Expiration: 90 days (বা আপনার পছন্দ)
5. Permissions সিলেক্ট করুন:
   - ✅ `repo` (সব চেকবক্স)
   - ✅ `workflow` (optional)
6. "Generate token" ক্লিক করুন
7. Token কপি করুন (এটি আর দেখাবে না!)

### Kora AI তে ব্যবহার:

1. Sidebar → "GitHub" ট্যাব
2. Token পেস্ট করুন
3. "Load Repositories" ক্লিক করুন
4. আপনার repos দেখতে পাবেন!

---

## 📁 প্রথম প্রজেক্ট আপলোড

### Method 1: File Upload

1. Sidebar → "Explorer" ট্যাব
2. ➕ আইকনে ক্লিক করুন
3. ফাইল সিলেক্ট করুন
4. Upload!

### Method 2: Folder Upload

1. 📁 আইকনে ক্লিক করুন
2. পুরো ফোল্ডার সিলেক্ট করুন
3. সব ফাইল একসাথে আপলোড হবে

### Method 3: GitHub Clone

1. GitHub ট্যাবে যান
2. Repository name: `username/repo-name`
3. "Clone Repository" ক্লিক করুন

---

## 🔍 প্রথম Analysis

1. প্রজেক্ট আপলোড করুন
2. Sidebar → "Analyzer" ট্যাব
3. "Analyze Project" ক্লিক করুন
4. রিপোর্ট দেখুন:
   - ✅ File types
   - ⚠️ Issues found
   - 💡 Suggestions

---

## 💬 AI এর সাথে কথা বলুন

### Basic Commands:

```
"Explain this code"
"Fix the bugs in main.py"
"Create a new Django app called 'blog'"
"Add authentication to my project"
"Optimize this function"
```

### File Reference:

1. Explorer থেকে ফাইল drag করুন chat এ
2. অথবা ফাইলে right-click → "Add to Context"
3. এখন AI সেই ফাইল সম্পর্কে জানে

---

## ⌨️ Terminal ব্যবহার

### খোলা:
- Editor এর নিচে ডানদিকে ⌨️ বাটন ক্লিক করুন

### Common Commands:

```bash
# Python version চেক
python --version

# Virtual environment তৈরি
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Django commands
python manage.py migrate
python manage.py runserver
python manage.py createsuperuser

# Package install
pip install django
pip install -r requirements.txt

# Git commands
git status
git add .
git commit -m "Update"
```

---

## 🎨 Django প্রজেক্ট Setup

### নতুন Django প্রজেক্ট:

1. Terminal খুলুন
2. Commands:
   ```bash
   pip install django
   django-admin startproject myproject
   cd myproject
   python manage.py migrate
   python manage.py createsuperuser
   ```

3. Folder আপলোড করুন Kora AI তে
4. Analyzer চালান
5. AI কে বলুন: "Review my Django project"

### Existing Django প্রজেক্ট:

1. GitHub থেকে clone করুন
2. Terminal এ:
   ```bash
   pip install -r requirements.txt
   python manage.py migrate
   ```
3. Analyzer চালান
4. Issues fix করুন

---

## 🚀 Production এর জন্য Build

```bash
# Build করুন
npm run build

# Production server চালু
npm start
```

---

## 🐛 Common Problems & Solutions

### Problem 1: "API token required"
**Solution:** API Settings এ token সেট করুন

### Problem 2: Terminal commands not working
**Solution:** 
- Windows: PowerShell বা CMD ব্যবহার করুন
- Mac/Linux: Terminal permissions চেক করুন

### Problem 3: GitHub clone failed
**Solution:**
- Token permissions চেক করুন
- Repository name সঠিক আছে কিনা দেখুন
- Internet connection চেক করুন

### Problem 4: Analyzer not finding issues
**Solution:**
- Python files আপলোড করেছেন কিনা চেক করুন
- AI token সেট করুন better analysis এর জন্য

### Problem 5: "Module not found" error
**Solution:**
```bash
npm install
# অথবা
npm ci
```

---

## 📱 Mobile এ ব্যবহার

1. **Chat View:** Default view
2. **Editor View:** 💬 বাটনে ক্লিক করুন
3. **Terminal:** ⌨️ floating button
4. **Analyzer:** 🔍 floating button
5. **GitHub:** 🐙 floating button

---

## 💡 Pro Tips

### 1. Keyboard Shortcuts:
- `Ctrl + S` - Save file
- `Ctrl + F` - Find in file
- `Ctrl + /` - Comment/Uncomment

### 2. AI Chat Tips:
- Specific প্রশ্ন করুন
- File context যোগ করুন
- "Step by step" বলুন detailed explanation এর জন্য

### 3. GitHub Workflow:
```
Clone → Edit → Test → Analyze → Fix → Commit → Push
```

### 4. Django Development:
```
Create Project → Analyze → Fix Settings → Create Apps → Test
```

---

## 🎯 Next Steps

এখন আপনি ready! শুরু করুন:

1. ✅ একটি প্রজেক্ট আপলোড করুন
2. ✅ Analyzer চালান
3. ✅ AI এর সাথে কথা বলুন
4. ✅ Terminal এ commands চালান
5. ✅ GitHub এ push করুন

---

## 📞 Help & Support

- **Documentation:** FEATURES.md পড়ুন
- **Issues:** GitHub এ issue তৈরি করুন
- **Community:** Discord/Telegram group join করুন

---

**Happy Coding! 🚀**

*Made with ❤️ by Taskkora Team*

# 🚀 Kora AI - সম্পূর্ণ গাইড (Complete Guide)

## 📖 সূচিপত্র (Table of Contents)

1. [প্রজেক্ট ওভারভিউ](#প্রজেক্ট-ওভারভিউ)
2. [ইনস্টলেশন](#ইনস্টলেশন)
3. [ফিচার সমূহ](#ফিচার-সমূহ)
4. [ব্যবহার নির্দেশনা](#ব্যবহার-নির্দেশনা)
5. [Desktop App তৈরি](#desktop-app-তৈরি)
6. [API Integration](#api-integration)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 প্রজেক্ট ওভারভিউ

**Kora AI** হলো একটি সম্পূর্ণ AI-powered Code Editor যা:
- ব্রাউজারে এবং Desktop উভয়ে চলে
- Python/Django প্রজেক্টের জন্য বিশেষভাবে তৈরি
- Kiro.dev এর মতো সব ফিচার আছে

### 🏗️ Technology Stack:
- **Frontend:** Next.js 16.2, React 19, TypeScript
- **Editor:** Monaco Editor (VS Code engine)
- **AI:** Hugging Face, OpenAI, Anthropic, Gemini, Ollama
- **Desktop:** Electron
- **Styling:** Tailwind CSS 4

---

## 💻 ইনস্টলেশন

### Prerequisites:
```bash
Node.js 18+ 
npm or yarn
Git
```

### Step 1: Clone Repository
```bash
git clone https://github.com/alornishan014/KoraGPT_IDE.git
cd KoraGPT_IDE
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Development Server
```bash
npm run dev
```

### Step 4: Open Browser
```
http://localhost:3000
```

---

## ✨ ফিচার সমূহ

### 1. 💬 AI Chat
- Multiple AI providers support
- Context-aware responses
- File reference support
- Voice input (Bengali/English)
- Image generation

### 2. 📝 Code Editor
- Monaco Editor (VS Code)
- Syntax highlighting
- Multi-tab support
- Diff view
- Auto-save

### 3. ⌨️ Terminal
- Browser-based terminal
- Native execution in Desktop mode
- Command history
- Real-time output
- Security features

### 4. 🔍 Project Analyzer
- Automatic bug detection
- Django project recognition
- Code quality analysis
- Security vulnerability scanning
- AI-powered deep analysis

### 5. 🐙 GitHub Integration
- Clone repositories
- Commit & push changes
- Branch management
- Repository browser

### 6. 📁 File Management
- Upload files/folders
- Create/delete files
- Folder structure
- Drag & drop

---

## 📚 ব্যবহার নির্দেশনা

### 🔑 API Setup

#### Hugging Face (Free):
1. যান: https://huggingface.co/settings/tokens
2. "New token" → Token কপি করুন
3. Kora AI → Sidebar → API Settings
4. Provider: "Hugging Face"
5. Token: পেস্ট করুন
6. Model: `meta-llama/Llama-3.2-3B-Instruct`
7. Save

#### Ollama (Local, Free):
```bash
# Install Ollama
# Windows: Download from ollama.ai
# Mac: brew install ollama
# Linux: curl https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama3

# Start server
ollama serve
```

Kora AI:
- Provider: "Ollama (Local)"
- Model: `llama3`
- Base URL: `http://localhost:11434`
- Save

#### OpenAI (Paid):
1. যান: https://platform.openai.com/api-keys
2. Create API key
3. Kora AI → API Settings
4. Provider: "OpenAI"
5. Token: Your API key
6. Model: `gpt-4o` or `gpt-3.5-turbo`
7. Save

#### DeepSeek (Paid, Cheap, Fast):
1. যান: https://platform.deepseek.com/
2. Sign up → Create API key
3. Kora AI → API Settings
4. Provider: "DeepSeek"
5. Token: Your API key (sk-...)
6. Model: `deepseek-chat` or `deepseek-coder`
7. Base URL: `https://api.deepseek.com` (optional)
8. Save

**বিস্তারিত:** [DEEPSEEK_SETUP.md](./DEEPSEEK_SETUP.md)

---

### 📁 প্রজেক্ট আপলোড

#### Method 1: File Upload
1. Sidebar → Explorer tab
2. ➕ icon → Select files
3. Upload

#### Method 2: Folder Upload
1. 📁 icon → Select folder
2. All files uploaded

#### Method 3: GitHub Clone
1. Sidebar → GitHub tab
2. Add Personal Access Token
3. Repository: `username/repo-name`
4. Clone Repository

---

### 🔍 Code Analysis

1. Upload project
2. Sidebar → Analyzer tab
3. "Analyze Project" button
4. View report:
   - File statistics
   - Issues found
   - Suggestions
   - Django detection

---

### ⌨️ Terminal Usage

#### Open Terminal:
- Click ⌨️ button (bottom-right)

#### Common Commands:

**Python:**
```bash
python --version
python script.py
pip install package
pip freeze > requirements.txt
```

**Django:**
```bash
python manage.py runserver
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser
python manage.py shell
```

**Git:**
```bash
git status
git add .
git commit -m "message"
git push
```

**npm:**
```bash
npm install
npm run dev
npm run build
```

---

### 💬 AI Chat Tips

#### Basic Commands:
```
"Explain this code"
"Fix bugs in main.py"
"Create Django app called 'blog'"
"Add authentication"
"Optimize this function"
"Review my code"
```

#### With File Context:
1. Drag file from Explorer to Chat
2. Or right-click → "Add to Context"
3. Ask questions about that file

#### Advanced:
```
"Analyze entire project and suggest improvements"
"Convert this to use async/await"
"Add error handling to all functions"
"Create unit tests for this module"
"Refactor using design patterns"
```

---

### 🐙 GitHub Workflow

#### Setup:
1. Create Personal Access Token:
   - https://github.com/settings/tokens
   - "Generate new token (classic)"
   - Select: `repo` (all)
   - Copy token

2. Kora AI → GitHub tab
3. Paste token
4. Save

#### Clone:
1. Repository: `username/repo-name`
2. Branch: `main` (or other)
3. "Clone Repository"

#### Commit & Push:
1. Edit files
2. Commit message: "Your message"
3. "Commit & Push"

---

## 🖥️ Desktop App তৈরি

### Quick Build:

#### Windows:
```bash
npm install
npm run electron:build:win
```
Output: `dist-electron/KoraAI-Setup-2.0.0.exe`

#### Mac:
```bash
npm run electron:build:mac
```
Output: `dist-electron/KoraAI-2.0.0.dmg`

#### Linux:
```bash
npm run electron:build:linux
```
Output: `dist-electron/KoraAI-2.0.0.AppImage`

### Development Mode:
```bash
# Run in Electron with hot reload
npm run electron:dev
```

### Features in Desktop App:
- ✅ Native window
- ✅ Better performance
- ✅ Direct file system access
- ✅ Native terminal execution
- ✅ Offline mode
- ✅ System tray integration

### Distribution:
1. Build app for target platform
2. Upload to GitHub Releases
3. Users download and install

**বিস্তারিত:** [BUILD_DESKTOP.md](./BUILD_DESKTOP.md)

---

## 🔧 API Integration

### Supported Providers:

| Provider | Type | Cost | Best For |
|----------|------|------|----------|
| Hugging Face | Cloud | Free | General use |
| Ollama | Local | Free | Privacy, Offline |
| OpenAI | Cloud | Paid | Best quality |
| Anthropic | Cloud | Paid | Long context |
| Gemini | Cloud | Free/Paid | Multimodal |
| DeepSeek | Cloud | Paid (Cheap) | Coding, Fast |
| GLM | Cloud | Paid | Chinese models |

### Custom Provider:
```typescript
// API Settings
Provider: "Custom (OpenAI Compatible)"
Base URL: "https://your-api.com/v1"
Token: "your-token"
Model: "your-model"
```

---

## 🐍 Django Development

### New Project:
```bash
# Terminal
pip install django
django-admin startproject myproject
cd myproject
python manage.py migrate
python manage.py createsuperuser
```

### Existing Project:
```bash
# Clone from GitHub
# Then in Terminal:
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Analyzer Checks:
- ✅ DEBUG mode warning
- ✅ SECRET_KEY exposure
- ✅ ALLOWED_HOSTS configuration
- ✅ Missing migrations
- ✅ Security issues

### AI Commands:
```
"Create Django app called 'users'"
"Add authentication to my project"
"Create models for blog posts"
"Generate admin interface"
"Add REST API endpoints"
```

---

## 🐛 Troubleshooting

### Problem: "API token required"
**Solution:**
```
Sidebar → API Settings → Add token → Save
```

### Problem: Terminal not working
**Solution:**
- Check if command is blocked (security)
- Try simpler command first: `python --version`
- Check terminal output for errors

### Problem: GitHub clone failed
**Solution:**
- Verify token has `repo` permissions
- Check repository name format: `username/repo`
- Ensure internet connection

### Problem: Analyzer not finding issues
**Solution:**
- Upload Python files first
- Set AI token for deep analysis
- Check file extensions (.py)

### Problem: Desktop app won't build
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
npm run electron:build:win
```

### Problem: "Module not found"
**Solution:**
```bash
npm install
# or
npm ci
```

### Problem: Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use different port:
PORT=3001 npm run dev
```

---

## 📱 Mobile Usage

### Navigation:
- **Chat View:** Default
- **Editor View:** Click 💬 button
- **Terminal:** Click ⌨️ floating button
- **Analyzer:** Click 🔍 floating button
- **GitHub:** Click 🐙 floating button

### Tips:
- Use landscape mode for better experience
- Floating buttons for quick access
- Swipe between views

---

## 🎯 Best Practices

### 1. Project Organization:
```
my-project/
├── src/
│   ├── components/
│   ├── utils/
│   └── main.py
├── tests/
├── requirements.txt
└── README.md
```

### 2. Git Workflow:
```
Clone → Edit → Analyze → Fix → Test → Commit → Push
```

### 3. AI Usage:
- Be specific in questions
- Add file context
- Ask for step-by-step explanations
- Request code reviews

### 4. Terminal:
- Use virtual environments
- Keep dependencies updated
- Test commands before running

### 5. Security:
- Never commit tokens
- Use environment variables
- Review AI suggestions before applying

---

## 🚀 Advanced Features

### 1. Custom AI Prompts:
Edit `app/constants.ts`:
```typescript
export const SYSTEM_PROMPT = `Your custom prompt here...`;
```

### 2. Custom Themes:
Edit `app/globals.css` for custom styling

### 3. Keyboard Shortcuts:
- `Ctrl + S` - Save file
- `Ctrl + F` - Find
- `Ctrl + /` - Comment
- `Ctrl + Shift + P` - Command palette (coming soon)

### 4. Extensions (Coming Soon):
- Plugin system
- Custom language support
- Theme marketplace

---

## 📊 Performance Tips

### 1. Reduce Bundle Size:
```bash
npm run build -- --analyze
```

### 2. Optimize Images:
- Use WebP format
- Compress before upload

### 3. Code Splitting:
- Already implemented in Next.js
- Lazy load heavy components

### 4. Desktop App:
- Use Electron IPC instead of fetch
- Enable asar compression
- Minimize dependencies

---

## 🔄 Updates

### Check for Updates:
```bash
git pull origin main
npm install
```

### Version History:
- **v2.0.0** - Terminal, Analyzer, GitHub, Desktop app
- **v1.0.0** - Initial release

---

## 📞 Support & Community

### Documentation:
- [FEATURES.md](./FEATURES.md) - Feature details
- [SETUP_BANGLA.md](./SETUP_BANGLA.md) - Bengali setup
- [BUILD_DESKTOP.md](./BUILD_DESKTOP.md) - Desktop build
- [CHANGELOG.md](./CHANGELOG.md) - Version history

### Get Help:
- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- Discord: Join community (coming soon)

### Contributing:
- Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- Fork repository
- Create feature branch
- Submit pull request

---

## 🎓 Learning Resources

### Next.js:
- https://nextjs.org/docs

### Electron:
- https://www.electronjs.org/docs

### Monaco Editor:
- https://microsoft.github.io/monaco-editor/

### AI APIs:
- Hugging Face: https://huggingface.co/docs
- OpenAI: https://platform.openai.com/docs
- Ollama: https://ollama.ai/docs

---

## 🎉 Quick Start Checklist

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Run dev server (`npm run dev`)
- [ ] Setup API token (Sidebar → API Settings)
- [ ] Upload a project
- [ ] Run analyzer
- [ ] Try terminal commands
- [ ] Chat with AI
- [ ] (Optional) Build desktop app

---

## 💡 Pro Tips

### 1. Workflow Automation:
```bash
# Create alias for common tasks
alias kora-dev="cd ~/KoraGPT_IDE && npm run dev"
alias kora-build="cd ~/KoraGPT_IDE && npm run electron:build:win"
```

### 2. Multiple Projects:
- Use GitHub integration to switch between projects
- Keep separate folders for different projects

### 3. AI Efficiency:
- Save common prompts
- Use file context for better results
- Review and learn from AI suggestions

### 4. Terminal Power:
```bash
# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install from requirements
pip install -r requirements.txt
```

---

## 🌟 What's Next?

### Coming Soon:
- [ ] LSP Integration (Smart autocomplete)
- [ ] Debugger support
- [ ] Git diff viewer
- [ ] Multi-user collaboration
- [ ] Plugin system
- [ ] Custom themes
- [ ] Cloud sync

### Your Ideas:
- Open GitHub issue with feature request
- Join discussions
- Contribute code

---

**🚀 Ready to code? Start now!**

```bash
npm run dev
```

**Made with ❤️ by Taskkora Team**

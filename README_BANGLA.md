# 🚀 rose.dev AI IDE - Desktop App

একটি সম্পূর্ণ AI-powered Code Editor যা Electron এবং Next.js 16 দিয়ে তৈরি।

## ✅ Status: Production Ready

Desktop .exe file সম্পূর্ণভাবে কাজ করছে। Browser dependency নেই।

## 🎯 Features

- 🎨 **Monaco Editor** - VS Code এর মতো editing experience
- 🤖 **AI Chat** - Multiple AI providers (HuggingFace, OpenAI, Anthropic, Ollama, DeepSeek)
- 🖼️ **Image Generation** - AI-powered image creation
- 💻 **Terminal** - Integrated terminal
- 📁 **File System** - Full file system access
- 🔗 **GitHub Integration** - Repository management
- 🔍 **LSP Support** - Python language server
- 📊 **Project Analyzer** - Code analysis tools
- ⚡ **Advanced Features**
  - Agent System (Autonomous task execution)
  - MCP Integration (External tools)
  - Hook System (Automation)
  - Context Management

## 🚀 Quick Start

### Development Mode (Hot Reload)
```bash
npm install
npm run electron:dev
```

### Production Build
```bash
npm run electron:build:win
```

Output: `dist-electron/rose.dev-AI-IDE-Setup-2.0.0.exe`

## 📦 Installation

1. Download করুন: `rose.dev-AI-IDE-Setup-2.0.0.exe`
2. Installer চালান
3. Install করুন
4. Desktop shortcut থেকে চালান

## 🛠️ Development

### Prerequisites
- Node.js 18+ (recommended: 24.14.1)
- npm 9+ (recommended: 11.11.0)

### Setup
```bash
# Dependencies install করুন
npm install

# Dev mode চালান
npm run electron:dev

# Production build করুন
npm run electron:build:win
```

### Project Structure
```
rose.dev/
├── app/                    # Next.js app
│   ├── components/        # React components
│   ├── lib/              # Libraries
│   │   ├── agent/        # Agent system
│   │   ├── mcp/          # MCP integration
│   │   ├── hooks/        # Hook system
│   │   └── context/      # Context management
│   └── api/              # API routes
├── electron.js           # Electron main process
├── preload.js           # Preload script
└── public/              # Static files
```

## 🔧 Configuration

### AI Providers
`app/constants.ts` file এ AI provider configuration আছে:
- HuggingFace API
- OpenAI API
- Anthropic API
- Ollama (Local)
- DeepSeek API

### LSP Configuration
Python LSP server automatically configured হয়।

## 📝 Documentation

- [BUILD_SUCCESS.md](BUILD_SUCCESS.md) - Build details
- [CURRENT_STATUS.md](CURRENT_STATUS.md) - Current status
- [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md) - Advanced features guide
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical details

## 🐛 Troubleshooting

### Black Screen
- Port 3000 available আছে কিনা check করুন
- Antivirus block করছে কিনা verify করুন

### Server Not Starting
- App reinstall করুন
- `%APPDATA%/rose.dev-AI-IDE` folder delete করুন

### Multiple Processes
- Single instance lock implemented
- শুধু একটা instance চলবে

## 🎨 Screenshots

Desktop app চালু হলে:
- Left sidebar: File tree, GitHub, Settings
- Center: Monaco Editor
- Right sidebar: AI Chat, Terminal, Advanced Features

## 🔐 Security

- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication
- File system access controlled

## 📊 Build Info

- **Size**: ~650 MB (includes Node.js runtime)
- **Platform**: Windows x64
- **Electron**: 28.3.3
- **Next.js**: 16.2.1
- **Node.js**: 24.14.1

## 🚀 Future Improvements

### Size Optimization
- Tauri migration (650 MB → 3-5 MB)
- External dependencies cleanup

### Features
- Code signing
- Auto-updater
- Multi-language support
- Theme customization

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 👨‍💻 Developer

**EliussRose**
- Email: eliussksa@gmail.com
- Website: [ghury.com](https://ghury.com)
- GitHub: [@eliussrose](https://github.com/eliussrose)
- Company: Prosinres

## 🏢 Company

**Prosinres**
- Website: [ghury.com](https://ghury.com)

## 📄 License

MIT License - See [LICENSE](LICENSE) file

© 2026 Prosinres. All rights reserved.


## 🙏 Acknowledgments

- Next.js team
- Electron team
- Monaco Editor team
- All open source contributors

---

**Version**: 2.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2026-04-12

**Developer:** EliussRose (eliussksa@gmail.com)  
**Company:** Prosinres  
**Website:** [ghury.com](https://ghury.com)

🎉 Enjoy coding with rose.dev AI IDE!

# 🚀 Quick Start: Advanced Features

## ✅ সম্পন্ন হয়েছে

আপনার rose.dev IDE এ এখন Kiro.dev-এর মতো advanced features যোগ করা হয়েছে!

---

## 🎯 কিভাবে ব্যবহার করবেন

### 1. App চালান

```bash
# Development mode
npm run dev
npm run electron

# অথবা built .exe চালান
.\dist-electron\rose.dev-AI-IDE-Setup-2.0.0.exe
```

### 2. Advanced Features খুলুন

- Editor এর ডান দিকে নিচে **🚀 বাটন** দেখবেন
- এটিতে ক্লিক করুন
- Advanced Features Panel খুলবে

---

## 🤖 Agent System

### Interactive Mode (নিরাপদ)
1. Advanced Features → Agent tab
2. Mode: "Interactive" সিলেক্ট করুন
3. Goal লিখুন: "Create a hello.txt file with greeting"
4. "Start Agent" ক্লিক করুন
5. প্রতিটি action এ confirmation চাইবে

### Autonomous Mode (স্বয়ংক্রিয়)
1. Mode: "Autonomous" সিলেক্ট করুন
2. Goal লিখুন: "Build a login page with form validation"
3. "Start Agent" ক্লিক করুন
4. Agent automatically সব কাজ করবে

### উদাহরণ Goals:
```
- Create a user profile component
- Fix all TypeScript errors
- Add authentication to the app
- Create a REST API with Express
- Build a todo list with React
```

---

## 🔌 MCP Integration

### Server যোগ করুন

1. Advanced Features → MCP tab
2. "+ Add Server" ক্লিক করুন
3. Configuration:
```json
{
  "id": "filesystem",
  "name": "File System",
  "command": "node",
  "args": ["path/to/mcp-server.js"],
  "enabled": true
}
```

### Built-in Tools (Coming Soon)
- File operations
- Git commands
- Web search
- Database queries

---

## 🪝 Hook System

### Auto-format on Save

1. Advanced Features → Hooks tab
2. "+ Create Hook" ক্লিক করুন
3. Configuration:
```
Name: Format on Save
Event: File Saved
Condition: *.ts, *.tsx
Action: Run Command
Command: prettier --write {{path}}
```

### Run Tests After Changes

```
Name: Test After Agent
Event: Agent Stop
Action: Run Command
Command: npm test
```

### Common Hooks:
- Auto-format code
- Run linter
- Execute tests
- Build project
- Deploy changes
- Send notifications

---

## 🧠 Context Management

### Optimize Token Usage

1. Advanced Features → Context tab
2. দেখুন কত tokens ব্যবহার হচ্ছে
3. "Optimize Context" ক্লিক করুন
4. Automatically relevant files select হবে

### Manual Control

- Files manually add/remove করুন
- Relevance score adjust করুন
- Token limits set করুন

---

## 📊 Features Overview

| Feature | Status | Description |
|---------|--------|-------------|
| Agent System | ✅ Ready | Autonomous task execution |
| MCP Integration | ✅ Ready | External tool connectivity |
| Hook System | ✅ Ready | Event-driven automation |
| Context Management | ✅ Ready | Smart context optimization |
| UI Panel | ✅ Ready | Tabbed interface |

---

## 🔧 Configuration Files

### MCP Config (`mcp.json`)

Create in project root:
```json
{
  "servers": [
    {
      "id": "my-server",
      "name": "My MCP Server",
      "description": "Custom tools",
      "command": "node",
      "args": ["server.js"],
      "enabled": true,
      "autoApprove": ["safe_tool"]
    }
  ],
  "globalAutoApprove": false,
  "timeout": 30000
}
```

### Hook Config (`hooks.json`)

```json
{
  "hooks": [
    {
      "id": "format-save",
      "name": "Format on Save",
      "enabled": true,
      "eventType": "file:saved",
      "actionType": "run_command",
      "actionConfig": {
        "command": "prettier --write {{path}}"
      }
    }
  ]
}
```

---

## 🎓 Learning Path

### Day 1: Context Management
- Add files to context
- Check token usage
- Optimize context

### Day 2: Simple Hooks
- Create format-on-save hook
- Test with file edits
- Monitor execution

### Day 3: Agent (Interactive)
- Simple file creation
- Review each action
- Understand agent behavior

### Day 4: Agent (Autonomous)
- Complex multi-file tasks
- Let agent work freely
- Review results

### Day 5: MCP Integration
- Add MCP server
- Discover tools
- Execute tools

---

## 💡 Pro Tips

### Agent System
- Start with small, clear goals
- Use Interactive mode first
- Review agent logs
- Gradually increase complexity

### MCP Integration
- Test servers manually first
- Use auto-approve for safe tools
- Monitor server logs
- Keep configs in version control

### Hook System
- Use descriptive names
- Test individually
- Add debouncing for frequent events
- Monitor execution time

### Context Management
- Set realistic token limits
- Boost important files
- Use query-based selection
- Clear context when switching tasks

---

## 🐛 Troubleshooting

### Agent not working?
- Check AI API credentials in Settings
- Verify workspace permissions
- Look at browser console (F12)

### MCP tools not available?
- Check server is running
- Verify configuration
- Test server manually

### Hooks not triggering?
- Verify hook is enabled
- Check event conditions
- Review debounce settings

### Context not optimizing?
- Check token limits
- Verify file sizes
- Clear and rebuild

---

## 📚 Documentation

- **Full Guide:** `ADVANCED_FEATURES.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`
- **Requirements:** `.kiro/specs/advanced-features/requirements.md`

---

## 🎉 Next Steps

1. ✅ Open Advanced Features panel
2. ✅ Try Agent with simple task
3. ✅ Create your first hook
4. ✅ Optimize context
5. ✅ Add MCP server (optional)

---

## 🆘 Need Help?

- Check documentation files
- Review code comments
- Open GitHub issue
- Join community

---

**Happy Coding! 🚀**

Built with ❤️ for rose.dev

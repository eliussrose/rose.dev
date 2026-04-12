# 🚀 Quick Reference - rose.dev AI IDE

## 📦 Installation & Running

```bash
# Install (one-time)
dist-electron\rose.dev-AI-IDE-Setup-2.0.0.exe

# Development Mode (with hot reload)
npm run electron:dev

# Build New Version
npm run electron:build:win
```

---

## 🤖 Agent System - Quick Commands

### Start Agent (UI)
1. Open "Advanced Features" panel (right sidebar)
2. Select "Agent System"
3. Choose mode: Autonomous or Interactive
4. Enter goal
5. Click "Start Agent"

### Common Goals

```
Create Features:
"Create a todo list with CRUD operations"
"Add user authentication with JWT"
"Create a responsive navbar component"
"Build a REST API for blog posts"

Fix Issues:
"Fix all TypeScript errors"
"Fix all ESLint warnings"
"Debug the login functionality"
"Fix memory leaks in useEffect"

Refactor:
"Refactor to use TypeScript strict mode"
"Split large components into smaller ones"
"Remove code duplication"
"Improve error handling"

Optimize:
"Optimize bundle size"
"Improve performance"
"Add code splitting"
"Optimize images"

Setup:
"Setup testing with Jest"
"Add Tailwind CSS"
"Configure ESLint and Prettier"
"Setup GitHub Actions CI/CD"

Documentation:
"Generate API documentation"
"Add JSDoc comments"
"Create README"
"Document all components"
```

---

## 🔧 Agent Actions Reference

| Action | Description | Example |
|--------|-------------|---------|
| `read_file` | Read file content | Read src/index.ts |
| `write_file` | Create/overwrite file | Create new component |
| `edit_file` | Modify specific parts | Update function |
| `delete_file` | Remove file | Delete old file |
| `create_directory` | Create folder | Create components/ |
| `execute_command` | Run terminal command | npm install |
| `search_files` | Find files | Search *.tsx |
| `analyze_code` | Check code quality | Analyze src/ |

---

## 🪝 Hook System - Quick Setup

### Auto-format on Save
```typescript
{
  eventType: 'file_saved',
  actionType: 'run_command',
  actionConfig: {
    command: 'prettier --write {{path}}'
  },
  conditions: [
    { type: 'extension', value: 'ts' },
    { type: 'extension', value: 'tsx' }
  ]
}
```

### Auto-test After Changes
```typescript
{
  eventType: 'agent_stop',
  actionType: 'run_command',
  actionConfig: {
    command: 'npm test'
  }
}
```

### Auto-fix on Error
```typescript
{
  eventType: 'build_error',
  actionType: 'call_agent',
  actionConfig: {
    prompt: 'Fix the build errors',
    mode: 'autonomous'
  }
}
```

---

## 🔌 MCP Integration - Quick Setup

### Configuration (mcp.json)
```json
{
  "servers": [
    {
      "id": "filesystem",
      "name": "File System",
      "command": "node",
      "args": ["mcp-servers/filesystem.js"],
      "enabled": true,
      "autoApprove": ["read_file", "list_directory"]
    }
  ]
}
```

### Available Tools
- File operations (read, write, delete)
- Git commands (status, commit, push)
- Database queries
- Web search
- Custom tools

---

## 🧠 Context Management - Quick Tips

### Optimize Context
```typescript
// Add important files
context.addFile('src/index.ts', content, 0.9); // High relevance

// Mark as accessed (boosts relevance)
context.markAccessed('src/index.ts');

// Get relevant files for query
const files = await context.selectRelevantFiles(
  'How to implement auth?',
  10 // max files
);
```

### Token Limits
- Default: 8000 tokens
- Adjust based on AI model
- Monitor usage in stats

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save file |
| `Ctrl+O` | Open folder |
| `Ctrl+F` | Find in file |
| `Ctrl+Shift+F` | Find in files |
| `Ctrl+/` | Toggle comment |
| `Ctrl+Space` | Trigger autocomplete |
| `F5` | Run/Debug |
| `Ctrl+`` | Toggle terminal |

---

## 🎯 Best Practices

### Agent Usage
✅ Start with Interactive mode for new tasks
✅ Use Autonomous mode for repetitive tasks
✅ Be specific in goals
✅ Monitor progress regularly
✅ Review changes before committing

### Performance
✅ Use code splitting
✅ Lazy load components
✅ Optimize images
✅ Cache API responses
✅ Monitor bundle size

### Code Quality
✅ Enable TypeScript strict mode
✅ Use ESLint and Prettier
✅ Write tests
✅ Add proper types
✅ Document code

---

## 🐛 Troubleshooting

### App Won't Start
```bash
# Check if port is available
netstat -ano | findstr :3000

# Kill process using port
taskkill /PID <process_id> /F

# Restart app
npm run electron:dev
```

### Agent Not Working
1. Check AI API key
2. Verify internet connection
3. Check console logs
4. Try Interactive mode first

### Build Fails
```bash
# Clean build
Remove-Item -Path "dist-electron" -Recurse -Force
Remove-Item -Path ".next" -Recurse -Force

# Rebuild
npm run electron:build:win
```

### Performance Issues
1. Clear context
2. Reduce maxActions
3. Use smaller AI model
4. Optimize file operations

---

## 📊 Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 Idle | Agent ready |
| 🟡 Planning | Creating plan |
| 🔵 Executing | Running actions |
| ⏸️ Paused | Execution paused |
| ✅ Completed | Task finished |
| ❌ Error | Task failed |

---

## 🔗 Quick Links

### Documentation
- [BUILD_SUCCESS.md](BUILD_SUCCESS.md) - Build details
- [AUTONOMOUS_FEATURES_BANGLA.md](AUTONOMOUS_FEATURES_BANGLA.md) - Features guide (Bengali)
- [DEMO_SCENARIOS.md](DEMO_SCENARIOS.md) - Usage examples
- [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md) - Complete documentation

### Code
- Agent: `app/lib/agent/AgentExecutor.ts`
- MCP: `app/lib/mcp/MCPManager.ts`
- Hooks: `app/lib/hooks/HookManager.ts`
- Context: `app/lib/context/ContextManager.ts`

---

## 💡 Pro Tips

1. **Use Templates**: Save common goals as templates
2. **Chain Tasks**: Use hooks to chain multiple tasks
3. **Monitor Logs**: Always check logs for issues
4. **Backup First**: Commit changes before big operations
5. **Test Incrementally**: Test after each major change
6. **Use Context**: Provide relevant files for better results
7. **Set Limits**: Use maxActions to prevent runaway tasks
8. **Review Plans**: Check agent's plan before execution
9. **Use Retries**: Enable autoRetry for network operations
10. **Stay Updated**: Check for new features regularly

---

## 📞 Support

### Get Help
1. Check documentation
2. Review error logs
3. Test in dev mode
4. Check console output

### Report Issues
- Include error messages
- Provide steps to reproduce
- Share relevant logs
- Mention OS and version

---

**Version**: 2.0.0  
**Last Updated**: 2026-04-12

**Happy Coding! 🚀**

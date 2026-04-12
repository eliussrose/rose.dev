# 🚀 Advanced Features Guide

## Overview

rose.dev now includes Kiro.dev-inspired advanced features:
- **Agent System**: Autonomous task execution
- **MCP Integration**: External tool connectivity
- **Hook System**: Event-driven automation
- **Context Management**: Intelligent context optimization

---

## 🤖 Agent System

### What is it?
An autonomous AI agent that can plan and execute complex multi-step tasks without constant user intervention.

### Features
- **Two Modes**:
  - **Interactive**: Ask before each action
  - **Autonomous**: Execute automatically
- **Smart Planning**: AI breaks down goals into actionable steps
- **File Operations**: Read, write, edit, delete files
- **Command Execution**: Run terminal commands
- **Error Handling**: Auto-retry failed actions
- **Progress Tracking**: Real-time status updates

### Usage

```typescript
import { AgentExecutor } from '@/app/lib/agent/AgentExecutor';
import { AgentMode } from '@/app/lib/agent/types';

// Create agent
const agent = new AgentExecutor(
  {
    mode: AgentMode.Autonomous,
    maxActions: 50,
    timeout: 300000, // 5 minutes
    autoRetry: true,
    maxRetries: 3,
  },
  {
    workspaceRoot: '/path/to/project',
    openFiles: ['src/index.ts'],
    recentFiles: ['src/utils.ts'],
    projectStructure: {},
  }
);

// Listen to events
agent.on('taskStart', (task) => {
  console.log('Task started:', task.goal);
});

agent.on('actionComplete', (action) => {
  console.log('Action completed:', action.description);
});

// Execute task
await agent.executeTask(
  'Create a login system with authentication',
  'openai',
  'your-api-key',
  'gpt-4'
);
```

### Examples

**Example 1: Create a Feature**
```
Goal: "Create a user profile page with avatar upload"

Agent will:
1. Create components/UserProfile.tsx
2. Create api/upload/route.ts
3. Update app/page.tsx to include the profile
4. Add necessary types
5. Test the implementation
```

**Example 2: Fix Bugs**
```
Goal: "Fix all TypeScript errors in the project"

Agent will:
1. Scan all .ts/.tsx files
2. Identify type errors
3. Fix each error
4. Verify fixes compile
```

---

## 🔌 MCP Integration

### What is it?
Model Context Protocol (MCP) allows connecting external tools and services to the AI.

### Features
- **Server Management**: Start/stop MCP servers
- **Tool Discovery**: Automatically find available tools
- **Tool Execution**: Call tools with parameters
- **Approval System**: Control which tools auto-execute
- **Built-in Servers**: File system, Git, Database, Web search

### Configuration

Create `mcp.json`:
```json
{
  "servers": [
    {
      "id": "filesystem",
      "name": "File System",
      "description": "File operations",
      "command": "node",
      "args": ["mcp-servers/filesystem.js"],
      "enabled": true,
      "autoApprove": ["read_file", "list_directory"]
    },
    {
      "id": "git",
      "name": "Git Operations",
      "description": "Git commands",
      "command": "node",
      "args": ["mcp-servers/git.js"],
      "enabled": true,
      "autoApprove": ["git_status", "git_log"]
    }
  ],
  "globalAutoApprove": false,
  "timeout": 30000
}
```

### Usage

```typescript
import { MCPManager } from '@/app/lib/mcp/MCPManager';

// Create manager
const mcp = new MCPManager(config);

// Initialize servers
await mcp.initialize();

// Get available tools
const tools = mcp.getTools();
console.log('Available tools:', tools);

// Execute a tool
const result = await mcp.executeTool('read_file', {
  path: 'src/index.ts'
});

console.log('File content:', result);
```

### Creating Custom MCP Servers

```javascript
// mcp-servers/custom.js
const { MCPServer } = require('mcp-sdk');

const server = new MCPServer({
  name: 'Custom Tools',
  version: '1.0.0',
});

// Register a tool
server.registerTool({
  name: 'my_tool',
  description: 'Does something useful',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  handler: async (args) => {
    // Tool logic here
    return { result: 'Success' };
  }
});

server.start();
```

---

## 🪝 Hook System

### What is it?
Event-driven automation that triggers actions based on IDE events.

### Features
- **Event Types**:
  - File events (created, edited, deleted, saved)
  - Agent events (start, stop, error)
  - Tool events (before/after execution)
  - Build events (start, complete, error)
  - Custom events
- **Action Types**:
  - Run command
  - Call AI agent
  - Execute script
  - Send notification
  - Call API
- **Conditions**: Pattern matching, file extensions, paths
- **Debouncing**: Prevent excessive executions
- **Priority**: Control execution order

### Configuration

```typescript
import { HookManager } from '@/app/lib/hooks/HookManager';
import { HookEventType, HookActionType } from '@/app/lib/hooks/types';

const hookManager = new HookManager();

// Register a hook
hookManager.registerHook({
  id: 'format-on-save',
  name: 'Format on Save',
  description: 'Auto-format code when saving',
  enabled: true,
  eventType: HookEventType.FileSaved,
  conditions: [
    { type: 'extension', value: 'ts' },
    { type: 'extension', value: 'tsx' }
  ],
  actionType: HookActionType.RunCommand,
  actionConfig: {
    command: 'npm run format {{path}}'
  },
  debounce: 1000,
  priority: 80
});

// Trigger an event
await hookManager.triggerEvent({
  type: HookEventType.FileSaved,
  data: { path: 'src/index.ts' },
  timestamp: Date.now()
});
```

### Hook Examples

**Auto-format on save:**
```typescript
{
  eventType: HookEventType.FileSaved,
  actionType: HookActionType.RunCommand,
  actionConfig: { command: 'prettier --write {{path}}' }
}
```

**Run tests after agent changes:**
```typescript
{
  eventType: HookEventType.AgentStop,
  actionType: HookActionType.RunCommand,
  actionConfig: { command: 'npm test' }
}
```

**Notify on build errors:**
```typescript
{
  eventType: HookEventType.BuildError,
  actionType: HookActionType.SendNotification,
  actionConfig: {
    title: 'Build Failed',
    message: 'Check console for errors',
    type: 'error'
  }
}
```

**Call agent to fix errors:**
```typescript
{
  eventType: HookEventType.BuildError,
  actionType: HookActionType.CallAgent,
  actionConfig: {
    prompt: 'Fix the build errors in {{path}}',
    mode: 'autonomous'
  }
}
```

---

## 🧠 Context Management

### What is it?
Intelligent system to manage what files and content are sent to the AI, optimizing token usage.

### Features
- **Smart Selection**: Automatically choose relevant files
- **Token Optimization**: Stay within limits
- **Relevance Scoring**: Prioritize important files
- **Auto-pruning**: Remove less relevant content
- **Query-based Selection**: Find files matching user intent
- **Statistics**: Track token usage

### Usage

```typescript
import { ContextManager } from '@/app/lib/context/ContextManager';

// Create manager
const context = new ContextManager(8000); // 8K token limit

// Add files
context.addFile('src/index.ts', fileContent, 0.9); // High relevance
context.addFile('src/utils.ts', utilsContent, 0.5); // Medium relevance

// Mark file as accessed (boosts relevance)
context.markAccessed('src/index.ts');

// Get files in context
const contextFiles = context.getContextFiles();

// Build context string for AI
const contextString = context.buildContextString();

// Get statistics
const stats = context.getStats();
console.log('Token usage:', stats.totalTokens, '/', stats.maxTokens);
console.log('Utilization:', stats.utilizationPercent.toFixed(1), '%');

// Smart file selection based on query
const relevantFiles = await context.selectRelevantFiles(
  'How do I implement authentication?',
  10 // max files
);
```

### Auto-optimization

Context automatically optimizes when:
- Files are added/removed
- Relevance scores change
- Token limits are updated
- Files are accessed

### Relevance Scoring

Files get higher relevance when:
- Recently accessed
- Mentioned in user queries
- Matching file extensions in query
- Containing query keywords
- Manually boosted

---

## 🎯 Integration Example

Complete example using all features together:

```typescript
import { AgentExecutor } from '@/app/lib/agent/AgentExecutor';
import { MCPManager } from '@/app/lib/mcp/MCPManager';
import { HookManager } from '@/app/lib/hooks/HookManager';
import { ContextManager } from '@/app/lib/context/ContextManager';

// Initialize all systems
const context = new ContextManager(8000);
const mcp = new MCPManager(mcpConfig);
const hooks = new HookManager();
const agent = new AgentExecutor(agentConfig, agentContext);

// Setup hooks
hooks.registerHook({
  id: 'agent-complete-test',
  name: 'Test After Agent',
  eventType: HookEventType.AgentStop,
  actionType: HookActionType.RunCommand,
  actionConfig: { command: 'npm test' }
});

// Setup MCP
await mcp.initialize();

// Add project files to context
for (const file of projectFiles) {
  context.addFile(file.path, file.content);
}

// Execute agent task
agent.on('actionComplete', (action) => {
  // Update context when files change
  if (action.type === 'write_file') {
    context.addFile(action.params.path, action.result, 0.9);
  }
});

await agent.executeTask(
  'Build a REST API with authentication',
  'openai',
  apiKey,
  'gpt-4'
);

// Trigger hooks
await hooks.triggerEvent({
  type: HookEventType.AgentStop,
  data: {},
  timestamp: Date.now()
});
```

---

## 📊 Performance Tips

### Agent System
- Use Interactive mode for critical operations
- Set reasonable maxActions limit
- Enable autoRetry for network operations
- Monitor execution time

### MCP Integration
- Only enable needed servers
- Use autoApprove for safe tools
- Set appropriate timeouts
- Cache tool results when possible

### Hook System
- Use debouncing for frequent events
- Set maxExecutions to prevent loops
- Use conditions to filter events
- Monitor hook execution time

### Context Management
- Set appropriate token limits
- Use relevance scoring effectively
- Decay relevance periodically
- Clear context when switching tasks

---

## 🔒 Security Considerations

### Agent System
- Review autonomous actions in logs
- Use Interactive mode for sensitive operations
- Validate file paths
- Sandbox command execution

### MCP Integration
- Only install trusted MCP servers
- Review tool permissions
- Use approval system for dangerous tools
- Validate tool parameters

### Hook System
- Limit hook execution frequency
- Validate hook scripts
- Use secure credential storage
- Monitor hook activity

---

## 🐛 Troubleshooting

### Agent not executing
- Check AI API credentials
- Verify workspace permissions
- Check agent status
- Review error logs

### MCP tools not available
- Verify server is running
- Check server configuration
- Review server logs
- Test server manually

### Hooks not triggering
- Verify hook is enabled
- Check event conditions
- Review hook priority
- Check debounce settings

### Context not optimizing
- Check token limits
- Verify relevance scores
- Review file sizes
- Clear and rebuild context

---

## 📚 API Reference

See individual files for detailed API documentation:
- `app/lib/agent/types.ts` - Agent types
- `app/lib/mcp/types.ts` - MCP types
- `app/lib/hooks/types.ts` - Hook types
- `app/lib/context/ContextManager.ts` - Context API

---

## 🎓 Learning Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [Agent Design Patterns](./docs/agent-patterns.md)
- [Hook Recipes](./docs/hook-recipes.md)
- [Context Optimization Guide](./docs/context-optimization.md)

---

**Built with ❤️ for rose.dev**

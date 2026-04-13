# rose.dev AI IDE - Architecture Guide

**Developer:** EliussRose | **Company:** Prosinres | **Email:** eliussksa@gmail.com

## 📁 Project Structure (Modern & Modular)

```
rose.dev/
├── app/                          # Next.js 16 App Directory
│   ├── components/               # React Components (Modular)
│   │   ├── ui/                  # Reusable UI Components
│   │   ├── editor/              # Editor-related Components
│   │   ├── chat/                # Chat-related Components
│   │   └── panels/              # Side Panels
│   ├── lib/                     # Core Libraries
│   │   ├── agent/               # AI Agent System
│   │   ├── mcp/                 # Model Context Protocol
│   │   ├── hooks/               # Hook System
│   │   ├── context/             # Context Management
│   │   ├── lsp/                 # Language Server Protocol
│   │   └── utils/               # Utility Functions
│   ├── api/                     # API Routes
│   ├── types.ts                 # TypeScript Types
│   └── constants.ts             # App Constants
├── scripts/                     # Build & Automation Scripts
│   ├── version-bump.js          # Auto Version Increment
│   └── copy-standalone-deps.js  # Dependency Management
├── public/                      # Static Assets
├── electron.js                  # Electron Main Process
└── preload.js                   # Electron Preload Script
```

## 🎯 Core Principles

### 1. Modularity
- Each feature is self-contained
- Easy to add/remove features
- Clear separation of concerns

### 2. Scalability
- Component-based architecture
- Lazy loading for performance
- Efficient state management

### 3. Maintainability
- TypeScript for type safety
- Clear naming conventions
- Comprehensive documentation

## 🔧 Adding New Features

### Step 1: Create Feature Module

```typescript
// app/lib/features/my-feature/index.ts
export class MyFeature {
  constructor(private config: MyFeatureConfig) {}
  
  async initialize() {
    // Setup code
  }
  
  async execute() {
    // Feature logic
  }
}

// app/lib/features/my-feature/types.ts
export interface MyFeatureConfig {
  enabled: boolean;
  options: Record<string, any>;
}
```

### Step 2: Create UI Component

```typescript
// app/components/panels/MyFeaturePanel.tsx
"use client";

import React from "react";

interface MyFeaturePanelProps {
  onClose: () => void;
}

export const MyFeaturePanel = ({ onClose }: MyFeaturePanelProps) => {
  return (
    <div className="p-4">
      <h2>My Feature</h2>
      {/* Feature UI */}
    </div>
  );
};
```

### Step 3: Register in Toolbar

```typescript
// app/components/VerticalToolbar.tsx
const tools = [
  // ... existing tools
  { 
    id: "my-feature" as const, 
    icon: MyIcon, 
    label: "My Feature", 
    color: "text-blue-400" 
  },
];
```

### Step 4: Add to Main App

```typescript
// app/page.tsx
const [showMyFeature, setShowMyFeature] = useState(false);

// In toolbar handler
if (view === "my-feature") {
  setShowMyFeature(true);
}

// In render
{showMyFeature && (
  <MyFeaturePanel onClose={() => setShowMyFeature(false)} />
)}
```

## 🚀 Version Management

### Auto Version Bump
Every build automatically increments the patch version:
```bash
npm run build              # 2.0.0 → 2.0.1
npm run electron:build:win # 2.0.1 → 2.0.2
```

### Manual Version Control
```bash
npm run version:bump       # Increment version manually
npm run version:reset      # Reset to specific version
```

## 📦 Feature Modules

### Current Features

1. **Agent System** (`app/lib/agent/`)
   - Autonomous code execution
   - Interactive/Autonomous modes
   - Tool integration

2. **MCP Integration** (`app/lib/mcp/`)
   - External tool support
   - Server management
   - Protocol handling

3. **Hook System** (`app/lib/hooks/`)
   - Event-driven automation
   - Custom triggers
   - Action execution

4. **Context Management** (`app/lib/context/`)
   - Smart context optimization
   - Token management
   - File tracking

5. **LSP Support** (`app/lib/lsp/`)
   - Language server integration
   - Code intelligence
   - Auto-completion

## 🎨 UI Components Structure

### Atomic Design Pattern

```
components/
├── atoms/           # Basic building blocks
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Icon.tsx
├── molecules/       # Simple component groups
│   ├── FileItem.tsx
│   ├── ChatMessage.tsx
│   └── ToolbarButton.tsx
├── organisms/       # Complex components
│   ├── ProjectTree.tsx
│   ├── EditorSection.tsx
│   └── ChatSection.tsx
└── templates/       # Page layouts
    └── MainLayout.tsx
```

## 🔌 Plugin System (Future)

### Plugin Structure
```typescript
// plugins/my-plugin/index.ts
export default {
  name: "my-plugin",
  version: "1.0.0",
  
  activate(context: PluginContext) {
    // Plugin initialization
  },
  
  deactivate() {
    // Cleanup
  }
};
```

## 📊 State Management

### Current Approach
- React useState for local state
- Props drilling for shared state
- Context API for global state (future)

### Future: Zustand/Redux
```typescript
// app/store/useAppStore.ts
import create from 'zustand';

export const useAppStore = create((set) => ({
  files: [],
  addFile: (file) => set((state) => ({ 
    files: [...state.files, file] 
  })),
}));
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/lib/agent/AgentExecutor.test.ts
import { AgentExecutor } from '@/lib/agent/AgentExecutor';

describe('AgentExecutor', () => {
  it('should execute tasks', async () => {
    const agent = new AgentExecutor({});
    const result = await agent.execute('test');
    expect(result).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/editor.test.tsx
import { render, screen } from '@testing-library/react';
import { EditorSection } from '@/components/EditorSection';

test('renders editor', () => {
  render(<EditorSection />);
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});
```

## 🔐 Security Best Practices

1. **Input Validation**
   - Sanitize user input
   - Validate file paths
   - Check API responses

2. **API Security**
   - Store tokens securely
   - Use environment variables
   - Implement rate limiting

3. **Electron Security**
   - Context isolation enabled
   - Node integration disabled
   - Secure IPC communication

## 📈 Performance Optimization

1. **Code Splitting**
   - Dynamic imports
   - Lazy loading components
   - Route-based splitting

2. **Memoization**
   - React.memo for components
   - useMemo for expensive calculations
   - useCallback for functions

3. **Asset Optimization**
   - Image compression
   - Font subsetting
   - CSS minification

## 🛠️ Development Workflow

### 1. Development
```bash
npm run dev              # Start dev server
npm run electron:dev     # Start Electron in dev mode
```

### 2. Building
```bash
npm run build            # Build Next.js app (version bump)
npm run electron:build:win  # Build Windows installer
```

### 3. Testing
```bash
npm run lint             # Check code quality
npm test                 # Run tests (when added)
```

## 📝 Code Style Guide

### TypeScript
```typescript
// Use interfaces for objects
interface User {
  id: string;
  name: string;
}

// Use type for unions/intersections
type Status = "active" | "inactive";

// Use const for immutable values
const MAX_FILES = 100;
```

### React Components
```typescript
// Functional components with TypeScript
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
};

// Use descriptive names
const handleFileUpload = () => {};
const isFileOpen = true;
```

### CSS/Tailwind
```typescript
// Use Tailwind utility classes
<div className="flex items-center gap-2 p-4 bg-gray-800 rounded-lg">

// Use cn() for conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  "hover:bg-gray-700"
)}>
```

## 🌐 Internationalization (Future)

```typescript
// app/i18n/en.json
{
  "editor.save": "Save",
  "editor.open": "Open"
}

// Usage
import { useTranslation } from 'next-i18next';

const { t } = useTranslation();
<button>{t('editor.save')}</button>
```

## 📚 Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Electron Documentation](https://www.electronjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Maintained by:** EliussRose @ Prosinres
**Last Updated:** 2026

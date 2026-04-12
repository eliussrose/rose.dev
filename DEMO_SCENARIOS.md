# 🎬 Demo Scenarios - rose.dev Autonomous Features

## Scenario 1: Create a Complete Feature (5 minutes)

### Goal
"Create a todo list application with add, delete, and mark complete functionality"

### What Agent Will Do

**Step 1: Planning (10 seconds)**
```
Agent analyzes the goal and creates a plan:
1. Create TodoList component
2. Create TodoItem component
3. Add state management
4. Create API routes
5. Add styling
6. Test functionality
```

**Step 2: Execution (4 minutes)**

```typescript
// Action 1: Create components/TodoList.tsx
✓ Created file with:
  - useState for todos
  - Add todo function
  - Delete todo function
  - Toggle complete function
  - Render todo items

// Action 2: Create components/TodoItem.tsx
✓ Created file with:
  - Todo item display
  - Delete button
  - Complete checkbox
  - Styling

// Action 3: Create app/api/todos/route.ts
✓ Created API endpoints:
  - GET /api/todos
  - POST /api/todos
  - DELETE /api/todos/[id]
  - PATCH /api/todos/[id]

// Action 4: Update app/page.tsx
✓ Integrated TodoList component

// Action 5: Add types
✓ Created types/todo.ts with Todo interface

// Action 6: Test
✓ Verified all functionality works
```

**Result:**
- 5 files created
- Fully functional todo app
- TypeScript types included
- API routes working
- UI responsive

---

## Scenario 2: Fix All Errors (2 minutes)

### Goal
"Fix all TypeScript errors in the project"

### What Agent Will Do

**Step 1: Scan Project**
```
Scanning files...
Found 15 TypeScript errors in 8 files
```

**Step 2: Fix Each Error**
```typescript
// Error 1: src/utils/helper.ts
❌ Parameter 'data' implicitly has an 'any' type
✓ Fixed: Added type annotation
  function processData(data: UserData) { ... }

// Error 2: src/components/Card.tsx
❌ Property 'title' does not exist on type '{}'
✓ Fixed: Added interface
  interface CardProps { title: string; content: string; }

// Error 3: src/api/users.ts
❌ Object is possibly 'undefined'
✓ Fixed: Added null check
  if (user) { return user.name; }

... (continues for all 15 errors)
```

**Result:**
- All 15 errors fixed
- Project compiles successfully
- Type safety improved

---

## Scenario 3: Add Authentication (10 minutes)

### Goal
"Add complete authentication system with JWT tokens"

### What Agent Will Do

**Step 1: Planning**
```
Creating authentication system:
1. Install dependencies
2. Create auth utilities
3. Create login page
4. Create signup page
5. Create middleware
6. Protect routes
7. Add user context
8. Test authentication flow
```

**Step 2: Execution**

```bash
# Action 1: Install dependencies
✓ npm install jsonwebtoken bcrypt
✓ npm install @types/jsonwebtoken @types/bcrypt --save-dev
```

```typescript
// Action 2: Create lib/auth.ts
✓ Created JWT utilities:
  - generateToken()
  - verifyToken()
  - hashPassword()
  - comparePassword()

// Action 3: Create app/login/page.tsx
✓ Created login form with:
  - Email/password inputs
  - Form validation
  - Error handling
  - Redirect on success

// Action 4: Create app/signup/page.tsx
✓ Created signup form with:
  - User registration
  - Password confirmation
  - Email validation

// Action 5: Create app/api/auth/login/route.ts
✓ Created login endpoint:
  - Validate credentials
  - Generate JWT token
  - Return user data

// Action 6: Create app/api/auth/signup/route.ts
✓ Created signup endpoint:
  - Validate input
  - Hash password
  - Create user
  - Return token

// Action 7: Create middleware.ts
✓ Created auth middleware:
  - Verify JWT token
  - Protect routes
  - Redirect unauthorized

// Action 8: Create contexts/AuthContext.tsx
✓ Created auth context:
  - User state
  - Login function
  - Logout function
  - Token management

// Action 9: Update app/layout.tsx
✓ Wrapped app with AuthProvider

// Action 10: Test
✓ Tested complete auth flow
✓ Verified protected routes
✓ Verified token refresh
```

**Result:**
- Complete authentication system
- JWT token handling
- Protected routes
- User context
- Login/Signup pages
- Secure password hashing

---

## Scenario 4: Code Review & Refactoring (5 minutes)

### Goal
"Review the codebase and refactor for better performance and maintainability"

### What Agent Will Do

**Step 1: Analysis**
```
Analyzing codebase...

Found Issues:
1. 5 components with unnecessary re-renders
2. 3 large components that should be split
3. 8 functions without proper error handling
4. 12 magic numbers that should be constants
5. 4 API calls without caching
6. 2 memory leaks in useEffect
```

**Step 2: Refactoring**

```typescript
// Issue 1: Unnecessary re-renders in UserList.tsx
❌ Before:
  const UserList = ({ users }) => {
    return users.map(user => <UserCard user={user} />);
  }

✓ After:
  const UserList = memo(({ users }) => {
    return users.map(user => <UserCard key={user.id} user={user} />);
  });

// Issue 2: Large Dashboard component
❌ Before: 500 lines in one file

✓ After: Split into:
  - DashboardHeader.tsx
  - DashboardStats.tsx
  - DashboardCharts.tsx
  - DashboardActivity.tsx

// Issue 3: Missing error handling
❌ Before:
  const data = await fetch('/api/users');
  return data.json();

✓ After:
  try {
    const data = await fetch('/api/users');
    if (!data.ok) throw new Error('Failed to fetch');
    return data.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }

// Issue 4: Magic numbers
❌ Before:
  if (users.length > 100) { ... }
  setTimeout(() => { ... }, 5000);

✓ After:
  const MAX_USERS = 100;
  const DEBOUNCE_DELAY = 5000;
  if (users.length > MAX_USERS) { ... }
  setTimeout(() => { ... }, DEBOUNCE_DELAY);

// Issue 5: API caching
✓ Added React Query for API caching
✓ Reduced API calls by 70%

// Issue 6: Memory leaks
❌ Before:
  useEffect(() => {
    const interval = setInterval(() => { ... }, 1000);
  }, []);

✓ After:
  useEffect(() => {
    const interval = setInterval(() => { ... }, 1000);
    return () => clearInterval(interval);
  }, []);
```

**Result:**
- Performance improved by 40%
- Code maintainability increased
- All issues fixed
- Best practices applied

---

## Scenario 5: Setup Complete Testing (8 minutes)

### Goal
"Setup complete testing infrastructure with unit tests, integration tests, and E2E tests"

### What Agent Will Do

**Step 1: Install Dependencies**
```bash
✓ npm install --save-dev jest @testing-library/react @testing-library/jest-dom
✓ npm install --save-dev @playwright/test
✓ npm install --save-dev @testing-library/user-event
```

**Step 2: Configuration**
```typescript
// jest.config.js
✓ Created Jest configuration
✓ Setup test environment
✓ Configure coverage

// playwright.config.ts
✓ Created Playwright configuration
✓ Setup browsers
✓ Configure test directory
```

**Step 3: Create Test Utilities**
```typescript
// tests/utils/test-utils.tsx
✓ Created custom render function
✓ Added mock providers
✓ Created test helpers

// tests/mocks/handlers.ts
✓ Created MSW handlers
✓ Mocked API endpoints
```

**Step 4: Write Tests**
```typescript
// Unit Tests
✓ components/Button.test.tsx
✓ components/Input.test.tsx
✓ lib/auth.test.ts
✓ lib/utils.test.ts

// Integration Tests
✓ app/login/page.test.tsx
✓ app/dashboard/page.test.tsx

// E2E Tests
✓ e2e/auth.spec.ts
✓ e2e/user-flow.spec.ts
```

**Step 5: Setup CI/CD**
```yaml
# .github/workflows/test.yml
✓ Created GitHub Actions workflow
✓ Run tests on push
✓ Generate coverage report
✓ Upload to Codecov
```

**Result:**
- Complete testing setup
- 25+ tests written
- 80%+ code coverage
- CI/CD pipeline configured

---

## Scenario 6: Performance Optimization (7 minutes)

### Goal
"Optimize the application for better performance"

### What Agent Will Do

**Step 1: Analysis**
```
Running performance audit...

Issues Found:
1. Bundle size: 2.5 MB (too large)
2. Initial load time: 4.2s (slow)
3. Largest Contentful Paint: 3.8s
4. Time to Interactive: 5.1s
5. 15 unnecessary re-renders
6. 8 unoptimized images
7. No code splitting
```

**Step 2: Optimizations**

```typescript
// 1. Code Splitting
✓ Added dynamic imports
✓ Lazy load heavy components
✓ Route-based splitting

// Before:
import Dashboard from './Dashboard';

// After:
const Dashboard = lazy(() => import('./Dashboard'));

// 2. Image Optimization
✓ Converted to WebP format
✓ Added responsive images
✓ Implemented lazy loading

// 3. Bundle Optimization
✓ Removed unused dependencies
✓ Tree-shaking enabled
✓ Minification improved

// 4. Caching Strategy
✓ Added service worker
✓ Cache API responses
✓ Cache static assets

// 5. Component Optimization
✓ Added React.memo
✓ Used useMemo for expensive calculations
✓ Used useCallback for functions

// 6. Database Optimization
✓ Added indexes
✓ Optimized queries
✓ Implemented pagination
```

**Results:**
- Bundle size: 2.5 MB → 800 KB (68% reduction)
- Initial load: 4.2s → 1.5s (64% faster)
- LCP: 3.8s → 1.2s
- TTI: 5.1s → 2.1s
- Lighthouse score: 65 → 95

---

## Scenario 7: Migration to TypeScript (15 minutes)

### Goal
"Migrate entire JavaScript codebase to TypeScript with strict mode"

### What Agent Will Do

**Step 1: Setup**
```bash
✓ npm install --save-dev typescript @types/react @types/node
✓ Created tsconfig.json with strict mode
✓ Updated package.json scripts
```

**Step 2: File Conversion**
```
Converting files...
Progress: [████████████████████] 100%

Converted:
- 45 .js files → .ts
- 32 .jsx files → .tsx
- Total: 77 files
```

**Step 3: Add Types**
```typescript
// Before (JavaScript):
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After (TypeScript):
interface Item {
  id: string;
  name: string;
  price: number;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Before (JavaScript):
const UserCard = ({ user }) => {
  return <div>{user.name}</div>;
};

// After (TypeScript):
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return <div>{user.name}</div>;
};
```

**Step 4: Fix Type Errors**
```
Fixing type errors...
Fixed: 127 type errors

Common fixes:
- Added proper interfaces
- Removed 'any' types
- Added null checks
- Fixed function signatures
- Added generic types
```

**Result:**
- 100% TypeScript codebase
- Strict mode enabled
- All type errors fixed
- Type safety improved
- Better IDE support

---

## Scenario 8: API Documentation (3 minutes)

### Goal
"Generate complete API documentation for all endpoints"

### What Agent Will Do

**Step 1: Scan API Routes**
```
Scanning API routes...
Found 24 endpoints in 12 files
```

**Step 2: Generate Documentation**
```markdown
# API Documentation

## Authentication

### POST /api/auth/login
Login with email and password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- 400: Invalid credentials
- 500: Server error

... (continues for all 24 endpoints)
```

**Step 3: Generate OpenAPI Spec**
```yaml
# openapi.yaml
✓ Created OpenAPI 3.0 specification
✓ All endpoints documented
✓ Request/response schemas
✓ Error codes
✓ Authentication details
```

**Step 4: Create Interactive Docs**
```
✓ Setup Swagger UI
✓ Accessible at /api-docs
✓ Try-it-out functionality
```

**Result:**
- Complete API documentation
- OpenAPI specification
- Interactive Swagger UI
- Example requests/responses

---

## 🎯 Summary

rose.dev Agent System can:
- ✅ Create complete features
- ✅ Fix all errors automatically
- ✅ Add authentication systems
- ✅ Review and refactor code
- ✅ Setup testing infrastructure
- ✅ Optimize performance
- ✅ Migrate codebases
- ✅ Generate documentation

**All autonomously, just like Kiro.dev!** 🚀

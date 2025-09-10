# Fleet Frontend Development Guide

This guide provides essential information for developers working on the Fleet Frontend application.

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.0 or higher
- **npm/yarn/pnpm**: Latest stable version
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions

### Required VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Initial Setup

1. **Clone and Install**:
```bash
git clone <repository-url>
cd fleet_frontend
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Descope Authentication
NEXT_PUBLIC_DESCOPE_PROJECT_ID=P2abc123xyz

# API Endpoints
NEXT_PUBLIC_SANDBOX_ORCHESTRATOR_URL=http://localhost:8000

# Development Settings
NEXT_PUBLIC_DEBUG_MODE=true
```

3. **Start Development Server**:
```bash
npm run dev
```

## Project Structure Deep Dive

### Directory Organization

```
fleet_frontend/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Route groups
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface pages
│   ├── create/            # Tool creation pages
│   ├── marketplace/       # MCP marketplace
│   ├── membership/        # User role management
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── providers.js       # Context providers
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   │   ├── button.jsx
│   │   ├── input.jsx
│   │   ├── dialog.jsx
│   │   └── ...
│   ├── chat/             # Chat-specific components
│   │   ├── ChatMessages.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatHeader.jsx
│   │   └── ...
│   ├── marketplace/      # Marketplace components
│   │   ├── MCPCard.jsx
│   │   └── MCPDetailsDialog.jsx
│   ├── Auth.js           # Authentication component
│   ├── ChatInterface.js  # Main chat interface
│   ├── MCPManager.js     # Tool management
│   └── Navbar.js         # Navigation
├── hooks/                # Custom React hooks
│   ├── useChat.js
│   ├── useSandbox.js
│   ├── useDeviceId.js
│   └── ...
├── services/             # API service layers
│   ├── apiClient.js
│   ├── chatService.js
│   ├── mcpService.js
│   └── authService.js
├── utils/                # Utility functions
│   ├── constants.js
│   ├── helpers.js
│   └── ...
├── lib/                  # Library configurations
│   └── utils.js          # shadcn/ui utilities
└── public/               # Static assets
    ├── icons/
    └── images/
```

### File Naming Conventions

- **Pages**: `page.js` (Next.js convention)
- **Layouts**: `layout.js` (Next.js convention)
- **Components**: PascalCase (e.g., `ChatInterface.js`)
- **Hooks**: camelCase with `use` prefix (e.g., `useChat.js`)
- **Services**: camelCase with service suffix (e.g., `chatService.js`)
- **Utils**: camelCase (e.g., `constants.js`)

## Development Workflow

### 1. Component Development

**Creating New Components**:

```jsx
// components/example/ExampleComponent.jsx
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function ExampleComponent({ title, onAction }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onAction()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <Button 
        onClick={handleClick} 
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Processing...' : 'Execute Action'}
      </Button>
    </div>
  )
}
```

**Component Guidelines**:
- Use functional components with hooks
- Include PropTypes or TypeScript types
- Follow single responsibility principle
- Implement proper error boundaries
- Use semantic HTML elements

### 2. Hook Development

**Custom Hook Pattern**:

```javascript
// hooks/useExample.js
import { useState, useEffect, useCallback } from 'react'

export function useExample(initialValue) {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await someApiCall()
      setValue(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    value,
    setValue,
    loading,
    error,
    refresh
  }
}
```

### 3. Service Layer Development

**Service Pattern**:

```javascript
// services/exampleService.js
import { apiClient } from './apiClient'

class ExampleService {
  constructor() {
    this.apiClient = apiClient
  }

  async getData(params = {}) {
    try {
      const response = await this.apiClient.request('/example', {
        method: 'GET',
        params
      })
      return response
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error.message}`)
    }
  }

  async createItem(data) {
    try {
      const response = await this.apiClient.request('/example', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response
    } catch (error) {
      throw new Error(`Failed to create item: ${error.message}`)
    }
  }
}

export const exampleService = new ExampleService()
```

## Code Style and Standards

### 1. ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 2. Prettier Configuration

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### 3. Coding Standards

**JavaScript/JSX**:
- Use modern ES6+ features
- Prefer arrow functions for inline callbacks
- Use destructuring for props and state
- Avoid deep nesting (max 3 levels)
- Use meaningful variable and function names

**React Best Practices**:
- Use `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- Implement proper key props for lists
- Clean up effects and subscriptions
- Handle loading and error states

**Styling Standards**:
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing (4px increments)
- Use CSS custom properties for theme values
- Implement dark mode support

## Testing Strategy

### 1. Unit Testing Setup

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

**Test Configuration**:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

### 2. Component Testing

```javascript
// __tests__/components/ExampleComponent.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ExampleComponent } from '@/components/ExampleComponent'

describe('ExampleComponent', () => {
  it('renders with title', () => {
    render(<ExampleComponent title="Test Title" onAction={() => {}} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn()
    render(<ExampleComponent title="Test" onAction={mockAction} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockAction).toHaveBeenCalled()
  })
})
```

### 3. Hook Testing

```javascript
// __tests__/hooks/useExample.test.js
import { renderHook, act } from '@testing-library/react'
import { useExample } from '@/hooks/useExample'

describe('useExample', () => {
  it('initializes with correct value', () => {
    const { result } = renderHook(() => useExample('initial'))
    expect(result.current.value).toBe('initial')
  })

  it('updates value correctly', () => {
    const { result } = renderHook(() => useExample('initial'))
    
    act(() => {
      result.current.setValue('updated')
    })
    
    expect(result.current.value).toBe('updated')
  })
})
```

## Performance Optimization

### 1. Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze
```

### 2. Code Splitting

```javascript
// Dynamic imports for large components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
})
```

### 3. Image Optimization

```jsx
import Image from 'next/image'

function OptimizedImage() {
  return (
    <Image
      src="/example.jpg"
      alt="Description"
      width={300}
      height={200}
      priority={false}
      placeholder="blur"
    />
  )
}
```

## Debugging and Development Tools

### 1. React Developer Tools

Install the React DevTools browser extension for component inspection and profiling.

### 2. Debug Configuration

```javascript
// utils/debug.js
export const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

export function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data)
  }
}

export function debugError(message, error) {
  if (DEBUG_MODE) {
    console.error(`[DEBUG ERROR] ${message}`, error)
  }
}
```

### 3. API Debugging

```javascript
// services/apiClient.js
class APIClient {
  async request(endpoint, options = {}) {
    if (DEBUG_MODE) {
      console.log(`API Request: ${endpoint}`, options)
    }

    const response = await fetch(...)
    
    if (DEBUG_MODE) {
      console.log(`API Response: ${endpoint}`, await response.clone().json())
    }

    return response
  }
}
```

## Deployment and Build

### 1. Build Process

```bash
# Development build
npm run dev

# Production build
npm run build

# Production preview
npm run start

# Lint and format
npm run lint
npm run format
```

### 2. Environment-Specific Builds

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  images: {
    domains: ['example.com'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

### 3. Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Security Best Practices

### 1. Environment Variables

- Never expose sensitive data in client-side code
- Use `NEXT_PUBLIC_` prefix only for client-safe variables
- Validate environment variables at startup

### 2. Input Validation

```javascript
// utils/validation.js
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '')
}
```

### 3. API Security

- Always include authentication headers
- Validate API responses
- Implement proper error handling
- Use HTTPS in production

## Contributing Guidelines

### 1. Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 2. Commit Message Format

```
type(scope): description

feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

### 3. Pull Request Process

1. Ensure tests pass
2. Update documentation
3. Follow code review feedback
4. Squash commits before merge
5. Delete feature branch after merge

This development guide provides a comprehensive foundation for building and maintaining the Fleet Frontend application with modern best practices and tools.
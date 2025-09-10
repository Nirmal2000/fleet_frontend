# Fleet Frontend Components Documentation

This document provides detailed documentation for all major components in the Fleet Frontend application.

## Component Hierarchy

```
App (layout.js)
├── Providers (providers.js)
├── Auth (Auth.js)
└── ChatInterface (ChatInterface.js)
    ├── SidebarProvider
    │   └── ChatSessionList (ChatSessionList.js)
    ├── SidebarInset
    │   ├── ChatHeader (chat/ChatHeader.jsx)
    │   ├── ChatMessages (chat/ChatMessages.jsx)
    │   ├── SandboxStatus (chat/SandboxStatus.jsx)
    │   ├── WelcomeScreen (chat/WelcomeScreen.jsx)
    │   └── ChatInput (chat/ChatInput.jsx)
    ├── MCPManager (MCPManager.js)
    └── Navbar (Navbar.js)
```

## Core Components

### 1. Auth (Auth.js)

**Purpose**: Handles user authentication and login flows using Descope.

**Key Features**:
- Descope SDK integration
- Login/signup forms
- Social authentication support
- Error handling for auth failures

**Props**: None (standalone component)

**State**:
- Form validation state
- Authentication loading state
- Error messages

**Usage**:
```jsx
import Auth from '@/components/Auth'

// Renders when user is not authenticated
<Auth />
```

### 2. ChatInterface (ChatInterface.js)

**Purpose**: Main orchestration component for the chat experience.

**Key Features**:
- Chat session management
- Sandbox lifecycle coordination
- Real-time message streaming
- MCP tool integration
- Responsive layout with sidebar

**Key Hooks Used**:
- `useChat` - Message handling and streaming
- `useSandbox` - Sandbox status monitoring  
- `useDeviceId` - Device identification
- `useDescope` - Authentication state

**State Management**:
```javascript
const [chatId, setChatId] = useState(null)
const [enabledMcps, setEnabledMcps] = useState([])
const [loading, setLoading] = useState(false)
const [isTabVisible, setIsTabVisible] = useState(true)
```

**Key Methods**:
- `handleChatSelect(chatId, isNewChat)` - Switch between chats
- `connectToChat(chatId)` - Establish chat session
- `handleReconnect()` - Recover from connection failures

### 3. ChatSessionList (ChatSessionList.js)

**Purpose**: Sidebar component for managing multiple chat sessions.

**Key Features**:
- List all user chat sessions
- Create new chat sessions
- Switch between existing chats
- Session metadata display

**Props**:
```javascript
{
  onChatSelect: (chatId, isNewChat) => void,
  currentChatId: string,
  loading: boolean
}
```

**API Integration**:
- Fetches user sessions via `GET /user/sessions`
- Creates new sessions via chat selection

### 4. MCPManager (MCPManager.js)

**Purpose**: Manages MCP tool configuration and lifecycle.

**Key Features**:
- Tool discovery and listing
- Environment variable configuration
- OAuth integration setup
- Tool enabling/disabling per chat
- Role-based access control

**Key Components**:
- Tool card display
- Configuration dialogs
- OAuth callback handling
- Permission validation

**Props**:
```javascript
{
  chatId: string,
  enabledMcps: Array,
  onMcpToggle: (mcpId, enabled) => void,
  userRole: string
}
```

### 5. Navbar (Navbar.js)

**Purpose**: Top navigation bar with user controls.

**Key Features**:
- User profile display
- Logout functionality
- Navigation links
- Role indicator (free/premium)

**Integration**:
- Descope user management
- Role-based UI elements
- Responsive design

## Chat Components

### 1. ChatHeader (chat/ChatHeader.jsx)

**Purpose**: Header section showing chat session info and controls.

**Key Features**:
- Chat session title
- Sandbox status indicator
- Connection controls
- Action buttons

**Props**:
```javascript
{
  chatId: string,
  sandboxStatus: 'ready' | 'creating' | 'error',
  onReconnect: () => void,
  loading: boolean
}
```

### 2. ChatMessages (chat/ChatMessages.jsx)

**Purpose**: Renders chat message history with streaming support.

**Key Features**:
- Message rendering (user/assistant/tool)
- Real-time streaming display
- Markdown rendering with syntax highlighting
- Tool execution visualization
- Auto-scroll management

**Message Types Handled**:
- User messages
- Assistant responses (streaming)
- Tool calls and results
- System messages
- Error messages

**Props**:
```javascript
{
  messages: Array<Message>,
  loading: boolean,
  isProcessing: boolean,
  messagesEndRef: RefObject
}
```

**Streaming Integration**:
- Handles SSE stream chunks
- Displays typing indicators
- Shows tool execution states

### 3. ChatInput (chat/ChatInput.jsx)

**Purpose**: Message composition and sending interface.

**Key Features**:
- Multi-line text input
- Send button with loading state
- Keyboard shortcuts (Ctrl+Enter)
- Character count (if applicable)
- File attachment support (future)

**Props**:
```javascript
{
  value: string,
  onChange: (value) => void,
  onSend: (message) => void,
  disabled: boolean,
  loading: boolean
}
```

**Keyboard Handling**:
- Enter: Send message (single line)
- Shift+Enter: New line
- Ctrl+Enter: Send message (multi-line)

### 4. SandboxStatus (chat/SandboxStatus.jsx)

**Purpose**: Displays current sandbox connection status.

**Key Features**:
- Visual status indicators
- Error message display
- Reconnection controls
- Status transitions

**Status States**:
- `creating` - Sandbox being initialized
- `ready` - Connected and operational
- `error` - Connection failed
- `reconnecting` - Attempting to reconnect

**Props**:
```javascript
{
  status: 'creating' | 'ready' | 'error' | 'reconnecting',
  error: string | null,
  onReconnect: () => void
}
```

### 5. WelcomeScreen (chat/WelcomeScreen.jsx)

**Purpose**: Initial screen shown when no chat is active.

**Key Features**:
- Welcome message
- Quick start instructions
- Feature highlights
- Call-to-action buttons

**Integration**:
- Links to marketplace
- Sample conversation starters
- Feature explanations

## UI Components (shadcn/ui)

### Base Components

**Button** (`ui/button.jsx`):
- Multiple variants (default, primary, secondary, ghost)
- Size variants (sm, md, lg)
- Loading states
- Icon support

**Input** (`ui/input.jsx`):
- Form input with validation states
- Consistent styling
- Accessibility support

**Card** (`ui/card.jsx`):
- Container component for content sections
- Header, content, footer sections
- Hover and focus states

**Dialog** (`ui/dialog.jsx`):
- Modal dialog implementation
- Backdrop dismissal
- Accessibility compliance
- Animation support

### Advanced Components

**Sidebar** (`ui/sidebar.jsx`):
- Collapsible navigation sidebar
- Responsive behavior
- State persistence
- Custom content support

**Tabs** (`ui/tabs.jsx`):
- Tab navigation component
- Keyboard navigation
- Active state management
- Content switching

**Dropdown Menu** (`ui/dropdown-menu.jsx`):
- Context menus and dropdowns
- Keyboard navigation
- Position auto-adjustment
- Nested menu support

## Marketplace Components

### MCPCard (marketplace/MCPCard.jsx)

**Purpose**: Individual tool display card in marketplace.

**Key Features**:
- Tool metadata display
- Installation status
- Quick actions (install/configure)
- Rating and reviews (future)

**Props**:
```javascript
{
  mcp: {
    id: string,
    name: string,
    title: string,
    description: string,
    config: object
  },
  onInstall: (mcpId) => void,
  onConfigure: (mcpId) => void,
  installed: boolean,
  userRole: string
}
```

### MCPDetailsDialog (marketplace/MCPDetailsDialog.jsx)

**Purpose**: Detailed view and configuration for MCP tools.

**Key Features**:
- Complete tool documentation
- Environment variable configuration
- OAuth setup wizard
- Installation progress
- Error handling

**Configuration Sections**:
- Basic information
- Environment variables
- OAuth settings
- Permissions and scopes
- Usage examples

## Hooks Integration

### useChat Hook

Components that use `useChat`:
- `ChatInterface` - Main coordination
- `ChatMessages` - Message rendering
- `ChatInput` - Message sending

**Provided State**:
```javascript
{
  messages: Array,
  setMessages: Function,
  inputMessage: string,
  setInputMessage: Function,
  loading: boolean,
  isProcessing: boolean,
  messagesEndRef: RefObject,
  sendMessage: Function,
  resetChat: Function,
  streamController: AbortController
}
```

### useSandbox Hook

Components that use `useSandbox`:
- `ChatInterface` - Status monitoring
- `SandboxStatus` - Status display
- `ChatHeader` - Connection controls

**Provided State**:
```javascript
{
  sandboxCreated: boolean,
  sandboxError: string | null,
  setSandboxCreated: Function,
  setSandboxError: Function,
  pollForSandboxReady: Function,
  resetSandbox: Function
}
```

## Component Communication

### Props Down, Events Up
- Parent components pass data via props
- Child components emit events via callbacks
- Consistent event naming conventions

### Context Usage
- Theme context for dark/light mode
- Auth context via Descope provider
- Minimal context usage to avoid over-coupling

### Service Layer Integration
- Components call service methods
- Services handle API communication
- Error handling at service level

## Styling Patterns

### Tailwind CSS Classes
- Consistent spacing scale (4px increments)
- Color scheme based on CSS custom properties
- Responsive breakpoints (sm, md, lg, xl)
- Dark mode support throughout

### Component Styling
- shadcn/ui base styles
- Custom variant classes
- Conditional styling based on state
- Accessibility-first design

### Animation
- Smooth transitions for state changes
- Loading animations and skeletons
- Hover and focus effects
- Reduced motion support

This component architecture provides a maintainable, reusable foundation that supports the complex requirements of real-time AI chat with dynamic tool integration.
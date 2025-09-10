# Fleet Frontend

A modern React/Next.js web application that provides an intuitive interface for AI-powered sandbox chat sessions with Model Context Protocol (MCP) tool integration.

## Overview

Fleet Frontend is the user-facing web application of the Fleet platform, enabling users to:

- **Chat with AI assistants** in secure, isolated sandbox environments
- **Manage MCP tools** with dynamic configuration and access control
- **Execute complex workflows** through natural language interactions
- **Browse and install tools** from the MCP marketplace
- **Manage authentication** via Descope integration

## Architecture

The frontend is built with a modern React/Next.js stack:

- **Framework**: Next.js 14 with App Router
- **UI Components**: Custom components built with shadcn/ui
- **Authentication**: Descope React SDK
- **Real-time Communication**: Server-Sent Events (SSE) for chat streaming
- **State Management**: React hooks with local state
- **Styling**: Tailwind CSS with dark theme support

## Key Features

### 🤖 AI Chat Interface
- Real-time streaming conversations with AI assistants
- Markdown rendering with syntax highlighting
- Tool execution visualization
- Message history persistence
- Multi-turn conversation support

### 🛠️ MCP Tool Management
- Browse available tools in the marketplace
- Configure tool settings and environment variables
- Toggle tools on/off per chat session
- Role-based access control for premium tools
- OAuth integration for third-party services

### 🔐 Authentication & Authorization
- Descope-powered authentication
- JWT token management
- Role-based UI elements (free/premium)
- Secure session handling

### 📱 Responsive Design
- Mobile-first responsive layout
- Dark theme optimized interface
- Sidebar navigation with collapsible panels
- Touch-friendly interactions

## Project Structure

```
fleet_frontend/
├── app/                     # Next.js App Router pages
│   ├── auth/               # Authentication pages
│   ├── chat/               # Main chat interface
│   ├── create/             # Tool creation pages
│   ├── marketplace/        # MCP marketplace
│   ├── membership/         # User role management
│   ├── layout.js           # Root layout with providers
│   └── page.js             # Home page with auth redirect
├── components/             # Reusable React components
│   ├── ui/                 # Base UI components (shadcn/ui)
│   ├── chat/               # Chat-specific components
│   ├── marketplace/        # Marketplace components
│   ├── Auth.js             # Authentication component
│   ├── ChatInterface.js    # Main chat interface
│   ├── MCPManager.js       # Tool management
│   └── Navbar.js           # Navigation component
├── hooks/                  # Custom React hooks
├── services/               # API service layers
├── utils/                  # Utility functions
└── public/                 # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Descope project configuration

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Environment Configuration

```env
# Descope Configuration
NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_project_id

# API Endpoints
NEXT_PUBLIC_SANDBOX_ORCHESTRATOR_URL=http://localhost:8000

# Optional: Analytics, monitoring, etc.
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

## Core Components

### ChatInterface
The main chat interface component handling:
- Real-time message streaming
- Tool execution visualization
- Sandbox status monitoring
- MCP tool management

### MCPManager
Manages MCP tool configurations:
- Tool discovery and installation
- Environment variable configuration
- OAuth authentication flows
- Permission management

### Auth
Handles user authentication:
- Descope login/logout flows
- Session token management
- Role-based redirects

## API Integration

The frontend communicates with two main backend services:

### Sandbox Orchestrator API
- Chat session management
- Sandbox lifecycle operations
- MCP tool configuration
- User authentication validation

### FastAPI Chatbot (in sandboxes)
- Real-time chat streaming
- Tool execution
- File operations
- Browser automation

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for new components when possible
3. Ensure responsive design principles
4. Test authentication flows thoroughly
5. Update documentation for new features

## Security Considerations

- All API calls include authentication headers
- Environment variables for sensitive configuration
- CORS properly configured for backend communication
- Input validation on all user inputs
- Secure token storage and refresh handling

## Performance Optimization

- Next.js automatic code splitting
- Image optimization with next/image
- SSE connection management
- Component lazy loading
- Efficient re-rendering with React hooks

---

For detailed component documentation, see the individual component files. For backend integration details, refer to the [Sandbox Orchestrator documentation](../docs/sandbox_orchestrator/).
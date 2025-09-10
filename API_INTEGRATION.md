# Fleet Frontend API Integration Guide

This document details how the Fleet Frontend integrates with backend APIs and external services.

## API Architecture Overview

The frontend communicates with multiple backend services:

```
Fleet Frontend
     │
     ├── Sandbox Orchestrator API (Primary)
     │   ├── Chat session management
     │   ├── MCP tool configuration  
     │   ├── User authentication
     │   └── Sandbox lifecycle
     │
     ├── E2B Sandbox (FastAPI Chatbot)
     │   ├── Real-time chat streaming
     │   ├── Tool execution
     │   └── File operations
     │
     └── Descope Authentication
         ├── User authentication
         ├── JWT token management
         └── Role management
```

## Service Layer Architecture

### 1. Service Organization

**File Structure**:
```
services/
├── chatService.js      # Chat and messaging operations
├── mcpService.js       # MCP tool management
├── authService.js      # Authentication helpers
└── apiClient.js        # Base HTTP client configuration
```

### 2. Base API Client (apiClient.js)

**Purpose**: Centralized HTTP client with authentication and error handling.

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    }

    // Add authentication header if available
    const token = await this.getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new APIError(response.status, await response.text())
      }

      return await response.json()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getAuthToken() {
    // Integration with Descope to get current session token
    return await getSessionToken()
  }

  handleError(error) {
    // Standardized error handling and transformation
    return new APIError(error.status || 500, error.message)
  }
}
```

## Chat Service Integration

### 1. Chat Service (chatService.js)

**Purpose**: Handles all chat-related API operations.

#### Core Methods

**Connect to Chat**:
```javascript
async connectToChat(chatId, userId, deviceId, getTokenFn) {
  const token = await getTokenFn()
  
  const response = await this.apiClient.request('/connect-chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Device-ID': deviceId
    },
    body: JSON.stringify({ chat_id: chatId })
  })

  return response
}
```

**Stream Chat Messages**:
```javascript
async *streamChat(chatId, message, deviceId, getTokenFn) {
  const token = await getTokenFn()
  const sandboxUrl = await this.getSandboxUrl(chatId)
  
  const response = await fetch(`${sandboxUrl}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Device-ID': deviceId
    },
    body: JSON.stringify({ message })
  })

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.statusText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          
          try {
            yield JSON.parse(data)
          } catch (e) {
            console.warn('Failed to parse SSE data:', data)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
```

**Save Session Data**:
```javascript
async saveSessionData(chatId, sessionData, getTokenFn) {
  const token = await getTokenFn()
  
  return await this.apiClient.request(`/session-data/${chatId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  })
}
```

### 2. Real-time Streaming Implementation

**SSE Stream Processing**:
```javascript
class StreamProcessor {
  constructor(onMessage, onError, onComplete) {
    this.onMessage = onMessage
    this.onError = onError
    this.onComplete = onComplete
    this.buffer = ''
  }

  processChunk(chunk) {
    this.buffer += chunk
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      this.processLine(line.trim())
    }
  }

  processLine(line) {
    if (!line || !line.startsWith('data: ')) return

    const data = line.slice(6)
    if (data === '[DONE]') {
      this.onComplete()
      return
    }

    try {
      const parsed = JSON.parse(data)
      this.onMessage(parsed)
    } catch (error) {
      this.onError(new Error(`Failed to parse SSE data: ${error.message}`))
    }
  }
}
```

**Stream Message Types**:
```javascript
// Content streaming
{
  "type": "content",
  "content": "Hello, I can help you with..."
}

// Tool execution start
{
  "type": "tool",
  "tool_name": "run_command",
  "tool_call_id": "call_123",
  "state": "input-streaming",
  "input": {"command": "ls -la"}
}

// Tool execution result
{
  "type": "tool", 
  "tool_name": "run_command",
  "tool_call_id": "call_123",
  "state": "output-available",
  "output": {"result": "total 8\ndrwxr-xr-x..."}
}

// Final assistant message
{
  "type": "assistant_message",
  "message": {
    "role": "assistant",
    "content": "I've executed the command...",
    "tool_calls": [...]
  }
}
```

## MCP Service Integration

### 1. MCP Service (mcpService.js)

**Purpose**: Manages MCP tool discovery, configuration, and lifecycle.

#### Core Methods

**Get Available MCPs**:
```javascript
async getAvailableMCPs() {
  return await this.apiClient.request('/mcps', {
    method: 'GET'
  })
}
```

**Toggle MCP for Chat**:
```javascript
async toggleMCPForChat(chatId, mcpId, enabled, getTokenFn) {
  const token = await getTokenFn()
  
  return await this.apiClient.request(`/chat/${chatId}/toggle-mcp`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mcp_id: mcpId,
      enabled: enabled
    })
  })
}
```

**Create New MCP**:
```javascript
async createMCP(mcpData, getTokenFn) {
  const token = await getTokenFn()
  
  return await this.apiClient.request('/mcps', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(mcpData)
  })
}
```

**Update MCP Environment Variables**:
```javascript
async updateMCPEnvironment(mcpId, envVars, getTokenFn) {
  const token = await getTokenFn()
  
  return await this.apiClient.request(`/mcps/${mcpId}/env`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ env: envVars })
  })
}
```

### 2. OAuth Integration

**Get OAuth Configuration**:
```javascript
async getMCPOAuthConfig(mcpId, getTokenFn) {
  const token = await getTokenFn()
  
  return await this.apiClient.request(`/mcps/${mcpId}/inbound-config`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}
```

**Handle OAuth Callback**:
```javascript
async handleOAuthCallback(code, codeVerifier, redirectUri, clientId, mcpId) {
  return await this.apiClient.request('/inbound/callback', {
    method: 'POST',
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      client_id: clientId,
      mcp_id: mcpId
    })
  })
}
```

## Authentication Integration

### 1. Descope Integration

**Setup and Configuration**:
```javascript
import { AuthProvider } from '@descope/react-sdk'

// In providers.js
export function Providers({ children }) {
  return (
    <AuthProvider projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID}>
      {children}
    </AuthProvider>
  )
}
```

**Authentication Hooks Usage**:
```javascript
import { useSession, useUser, useDescope } from '@descope/react-sdk'

function ChatInterface() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const { getSessionToken, logout } = useDescope()

  // Use authentication state for API calls
  const handleAPICall = async () => {
    const token = await getSessionToken()
    // Pass token to service methods
  }
}
```

### 2. Token Management

**Automatic Token Refresh**:
```javascript
class TokenManager {
  constructor() {
    this.refreshPromise = null
  }

  async getValidToken() {
    try {
      const token = await getSessionToken()
      if (this.isTokenExpired(token)) {
        return await this.refreshToken()
      }
      return token
    } catch (error) {
      throw new Error('Authentication required')
    }
  }

  async refreshToken() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh()
    }
    return await this.refreshPromise
  }

  async performRefresh() {
    try {
      // Descope handles refresh automatically
      const newToken = await getSessionToken()
      this.refreshPromise = null
      return newToken
    } catch (error) {
      this.refreshPromise = null
      throw new Error('Token refresh failed')
    }
  }

  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }
}
```

## Error Handling

### 1. API Error Classes

```javascript
class APIError extends Error {
  constructor(status, message, data = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }

  isAuthError() {
    return this.status === 401
  }

  isPermissionError() {
    return this.status === 403
  }

  isNetworkError() {
    return this.status >= 500
  }
}

class StreamError extends Error {
  constructor(message, recoverable = false) {
    super(message)
    this.name = 'StreamError'
    this.recoverable = recoverable
  }
}
```

### 2. Error Recovery Strategies

**Automatic Retry Logic**:
```javascript
class RetryableRequest {
  constructor(maxRetries = 3, backoffMs = 1000) {
    this.maxRetries = maxRetries
    this.backoffMs = backoffMs
  }

  async executeWithRetry(requestFn) {
    let lastError
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error
        
        if (!this.shouldRetry(error, attempt)) {
          break
        }

        await this.delay(this.backoffMs * Math.pow(2, attempt))
      }
    }

    throw lastError
  }

  shouldRetry(error, attempt) {
    if (attempt >= this.maxRetries) return false
    if (error.isAuthError?.()) return false
    if (error.isPermissionError?.()) return false
    return error.isNetworkError?.() || error.name === 'StreamError'
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

**Connection Recovery**:
```javascript
class ConnectionManager {
  constructor(onReconnect) {
    this.onReconnect = onReconnect
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  async handleConnectionLoss() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('Max reconnection attempts reached')
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      await this.onReconnect()
      this.reconnectAttempts = 0
    } catch (error) {
      await this.handleConnectionLoss()
    }
  }
}
```

## Performance Optimization

### 1. Request Optimization

**Request Deduplication**:
```javascript
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map()
  }

  async deduplicate(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return await this.pendingRequests.get(key)
    }

    const promise = requestFn()
    this.pendingRequests.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.pendingRequests.delete(key)
    }
  }
}
```

**Response Caching**:
```javascript
class ResponseCache {
  constructor(ttlMs = 300000) { // 5 minutes default
    this.cache = new Map()
    this.ttlMs = ttlMs
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }
}
```

### 2. Stream Optimization

**Stream Buffering**:
```javascript
class StreamBuffer {
  constructor(flushInterval = 100) {
    this.buffer = []
    this.flushInterval = flushInterval
    this.flushTimer = null
    this.onFlush = null
  }

  add(item) {
    this.buffer.push(item)
    this.scheduleFlush()
  }

  scheduleFlush() {
    if (this.flushTimer) return

    this.flushTimer = setTimeout(() => {
      this.flush()
    }, this.flushInterval)
  }

  flush() {
    if (this.buffer.length === 0) return

    const items = [...this.buffer]
    this.buffer = []
    this.flushTimer = null

    if (this.onFlush) {
      this.onFlush(items)
    }
  }
}
```

This comprehensive API integration guide provides the foundation for robust, performant communication between the frontend and backend services in the Fleet platform.
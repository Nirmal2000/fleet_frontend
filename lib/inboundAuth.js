// Minimal PKCE + Inbound App OAuth helpers

function b64urlFromBytes(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function sha256(str) {
  const data = new TextEncoder().encode(str)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(digest)
}

export async function makePkce() {
  const rnd = crypto.getRandomValues(new Uint8Array(32))
  const verifier = b64urlFromBytes(rnd)
  const challenge = b64urlFromBytes(await sha256(verifier))
  return { verifier, challenge }
}

export function getInboundConfig() {
  return {
    descopeBase: process.env.NEXT_PUBLIC_DESCOPE_BASE || 'https://api.descope.com',
    clientId: process.env.NEXT_PUBLIC_DESCOPE_INBOUND_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/inbound/callback`,
    orchestratorBase: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL,
  }
}

export async function beginInboundLogin({ mcpId, chatId, scopes = [], clientId: clientIdParam } = {}) {
  const { descopeBase, clientId, redirectUri } = getInboundConfig()
  const useClientId = clientIdParam || clientId
  if (!useClientId) throw new Error('Inbound clientId is not available')

  const state = crypto.randomUUID()
  const { verifier, challenge } = await makePkce()
  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('pkce_verifier', verifier)
  // Persist identifiers across the redirect so we can post them on callback
  sessionStorage.setItem('inbound_clientId', useClientId)
  if (mcpId) sessionStorage.setItem('inbound_mcpId', mcpId)
  if (mcpId && chatId) {
    sessionStorage.setItem('post_inbound_toggle', JSON.stringify({ mcpId, chatId }))
  }

  const url = new URL(`${descopeBase}/oauth2/v1/apps/authorize`)
  url.search = new URLSearchParams({
    client_id: useClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  console.log('Redirecting to inbound login', url.toString())
  window.location.assign(url.toString())
}

export async function handleInboundCallback({ authToken, userId } = {}) {
  const { orchestratorBase } = getInboundConfig()
  const qp = new URLSearchParams(window.location.search)

  const code = qp.get('code')
  const state = qp.get('state')
  const stored = sessionStorage.getItem('oauth_state')
  const verifier = sessionStorage.getItem('pkce_verifier')
  const redirectUri = `${window.location.origin}/auth/inbound/callback`
  if (!code || !state || !verifier || stored !== state) {
    throw new Error('Invalid OAuth callback parameters')
  }
  const clientId = sessionStorage.getItem('inbound_clientId') || undefined
  const mcpId = sessionStorage.getItem('inbound_mcpId') || undefined
  sessionStorage.removeItem('oauth_state')
  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('inbound_clientId')
  sessionStorage.removeItem('inbound_mcpId')
  console.log('Inbound callback', { code, state, clientId, mcpId, userId })
  const headers = { 'content-type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`
  const resp = await fetch(`${orchestratorBase}/inbound/callback`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: redirectUri, client_id: clientId, mcp_id: mcpId }),
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Inbound exchange failed: ${resp.status} ${text}`)
  }
  const post = sessionStorage.getItem('post_inbound_toggle')
  let action = null
  try { action = post ? JSON.parse(post) : null } catch {}
  if (post) sessionStorage.removeItem('post_inbound_toggle')
  return action
}

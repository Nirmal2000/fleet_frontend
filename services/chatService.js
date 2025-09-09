export const chatService = {
  async connectToChat(chatId, userId, deviceId, getSessionToken) {
    try {
      const sessionToken = getSessionToken()

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/connect-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId,
          device_id: deviceId
        })
      })
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error connecting to chat:', error)
      throw new Error('Failed to connect to chat: ' + error.message)
    }
  },

  async getSandboxStatus(chatId, userId, getSessionToken) {
    try {
      const sessionToken = getSessionToken()

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/sandbox-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId
        })
      })
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error getting sandbox status:', error)
      throw error
    }
  },

  async signOut(logout) {
    logout()
  }
}
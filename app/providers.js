'use client'

import { AuthProvider } from '@descope/react-sdk'

export const Providers = ({ children }) => {
  return (
    <AuthProvider
      projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID || 'YOUR_PROJECT_ID'}
      debug={true}
    >
      {children}
    </AuthProvider>
  )
}
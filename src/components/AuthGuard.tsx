import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSupabase } from './providers/context'

interface AuthGuardProps {
  children: ReactNode
}

/**
 * Authentication Guard Component
 * 
 * Features:
 * 1. Checks if user is logged in
 * 2. If logged in, displays protected content
 * 3. If not logged in, redirects to login page
 */
export default function AuthGuard({ children }: AuthGuardProps): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()
  const connector = useSupabase()

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      if (!connector) return
      
      const { data } = await connector.client.auth.getSession()
      setIsAuthenticated(!!data.session)
      setIsLoading(false)
    }

    checkAuth()
  }, [connector])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    // Save the current path in location state to return after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
} 
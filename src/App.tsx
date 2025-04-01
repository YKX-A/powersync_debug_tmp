import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MainPanel from './components/MainPanel'
import Login from './components/Login'
import Register from './components/Register'
import AuthGuard from './components/AuthGuard'
import { useSupabase } from './components/providers/context'
import './App.css'

/**
 * Main Application Component
 *
 * Routes:
 * 1. / - Home page, redirects to main panel if logged in, or login page if not
 * 2. /login - Login page
 * 3. /register - Registration page
 * 4. /main - Main panel page, requires authentication
 */
function App(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const connector = useSupabase()

  // Check authentication status
  useEffect(() => {
    if (!connector) return

    const checkAuth = async () => {
      setIsLoading(true)
      const { data } = await connector.client.auth.getSession()
      setIsAuthenticated(!!data.session)
      setIsLoading(false)

      // Listen for authentication state changes
      const { data: authListener } = connector.client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, !!session)
        setIsAuthenticated(!!session)
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }

    checkAuth()
  }, [connector])

  if (!connector) {
    return <div className="flex justify-center items-center h-screen">Connecting...</div>
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  // Home redirect - logged in users go to main panel, others to login page
  const HomeRedirect = () => {
    return isAuthenticated ? <Navigate to="/main" replace /> : <Navigate to="/login" replace />
  }

  return (
    <Routes>
      {/* Home redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Authentication routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/main"
        element={
          <AuthGuard>
            <MainPanel />
          </AuthGuard>
        }
      />

      {/* 404 route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

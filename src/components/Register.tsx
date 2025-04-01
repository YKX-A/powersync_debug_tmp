import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSupabase } from './providers/context'

/**
 * Register Component
 *
 * Features:
 * 1. Provides email and password registration form
 * 2. Handles form submission
 * 3. Shows loading state during registration
 * 4. Handles and displays registration errors
 * 5. Redirects to login page after successful registration
 */
export default function Register(): React.ReactElement {
  // State management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Get navigation
  const navigate = useNavigate()
  const connector = useSupabase()

  if (!connector) {
    return <div>Connecting to database...</div>
  }

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    // Password validation
    if (password !== confirmPassword) {
      setIsError(true)
      setErrorMessage('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    setIsError(false)
    setErrorMessage(null)
    setSuccess(false)

    try {
      const { error } = await connector.client.auth.signUp({
        email,
        password
      })

      if (error) throw error
      
      setSuccess(true)
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error: any) {
      setIsError(true)
      setErrorMessage(error.message || 'Registration failed, please try again later')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Register</h1>
          <p className="mt-2 text-gray-600">Create a new account to use the application</p>
        </div>

        {/* Error alert */}
        {isError && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {errorMessage || 'Registration failed, please try again later'}
          </div>
        )}

        {/* Success alert */}
        {success && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
            Registration successful! Please check your email to verify your account. Redirecting to login page...
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="your@email.com"
              disabled={isLoading || success}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading || success}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading || success}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Login now
          </Link>
        </p>
      </div>
    </div>
  )
} 
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import logger from '../utils/logger'

const UserContext = createContext()

// The auth token lives only in an httpOnly cookie, so page scripts never see
// it. The signed-in user is loaded from the server instead of decoding a JWT.
const fetchCurrentUser = async () => {
  try {
    const { data } = await axios.get('/api/auth/me', { withCredentials: true })
    return data?.user || null
  } catch (error) {
    if (error?.response?.status !== 401) logger.error('Failed to load current user:', error)
    return null
  }
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchCurrentUser().then(current => {
      if (cancelled) return
      setUser(current)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Clears local auth state only; the sign-out request is made by useAuth
  const signOutUser = useCallback(() => setUser(null), [])

  const value = useMemo(() => ({ user, setUser, signOutUser, loading }), [user, signOutUser, loading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUserContext = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}

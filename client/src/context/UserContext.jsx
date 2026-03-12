import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import logger from '../utils/logger'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const readUserFromToken = async () => {
    try {
      // In Electron, retrieve the persisted token from the main-process store;
      // otherwise fall back to localStorage (standard web behaviour).
      const token = window.electronAPI?.isElectron
        ? await window.electronAPI.getToken()
        : localStorage.getItem('token')

      if (token) {
        // Sync to localStorage so any code that reads it directly keeps working.
        localStorage.setItem('token', token)
        const payload = jwtDecode(token)
        if (Date.now() < payload.exp * 1000) {
          setUser(payload.user)
        }
      }
    } catch (error) {
      logger.error('Failed to read user from token:', error)
      localStorage.clear()
      setUser(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    readUserFromToken()
  }, [])

  const signOutUser = () => {
    localStorage.clear()
    setUser(null)
    // In Electron, also clear the persisted token so the next launch shows login.
    window.electronAPI?.clearToken()
  }

  const setToken = (token) => {
    localStorage.setItem('token', token)
    // In Electron, persist the token so subsequent launches skip sign-in.
    window.electronAPI?.setToken(token)
    readUserFromToken()
  }

  return (
    <UserContext.Provider
      value={{ user, setUser, signOutUser, setToken, loading }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}

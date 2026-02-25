import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const readUserFromToken = () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = jwtDecode(token)
        if (Date.now() < payload.exp * 1000) {
          setUser(payload.user)
        }
      }
    } catch (error) {
      console.log(error)
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
  }

  const setToken = (token) => {
    localStorage.setItem('token', token)
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

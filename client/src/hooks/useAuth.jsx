import { useMemo } from 'react'
// Context
import { useUserContext } from '../context/UserContext'
// Custom hooks
import { useApi } from './useApi'

export const useAuth = () => {
  const { setUser, signOutUser } = useUserContext()
  const { post } = useApi()

  return useMemo(() => {
    // Sign-in and sign-up set the auth cookie and return the user
    const authenticate = async (url, formData) => {
      const data = await post(url, formData)
      if (data?.user) setUser(data.user)
      return data
    }

    return {
      signIn: formData => authenticate('/auth/sign-in', formData),
      signUp: formData => authenticate('/auth/sign-up', formData),
      signOut: async () => {
        try {
          return await post('/auth/sign-out')
        } finally {
          // Always sign out locally regardless of API response
          signOutUser()
        }
      },
      forgotPassword: formData => post('/auth/forgot-password', formData),
      resetPassword: formData => post('/auth/reset-password', formData),
    }
  }, [post, setUser, signOutUser])
}

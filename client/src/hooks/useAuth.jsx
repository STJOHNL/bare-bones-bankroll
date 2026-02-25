// Context
import { useUserContext } from '../context/UserContext'
// Custom hooks
import { useApi } from './useApi'

export const useAuth = () => {
  const { signOutUser } = useUserContext()
  const { post } = useApi(signOutUser)

  const signIn = async (formData) => {
    const data = await post('/auth/sign-in', formData)
    if (data) {
      // Handle successful sign in
      return data
    }
  }

  const signUp = async (formData) => {
    const data = await post('/auth/sign-up', formData)
    if (data) {
      // Handle successful sign up
      return data
    }
  }

  const signOut = async () => {
    const data = await post('/auth/sign-out')
    // Always sign out locally regardless of API response
    signOutUser()
    return data
  }

  const forgotPassword = async (formData) => {
    const data = await post('/auth/forgot-password', formData)
    if (data) {
      return data
    }
  }

  const resetPassword = async (formData) => {
    const data = await post('/auth/reset-password', formData)
    if (data) {
      return data
    }
  }

  return {
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
  }
}

import { useMemo } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
// Context
import { useUserContext } from '../context/UserContext'

// One shared instance; Vite proxies /api to the backend in development and the
// server hosts the client in production/Electron, so the path is always relative.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

const errorMessage = error => error?.response?.data?.message || 'An unexpected error occurred'

/**
 * Thin request helpers. Errors are shown as a toast and resolve to null so
 * callers can simply check the result — loading states always settle.
 */
export const useApi = () => {
  const { signOutUser } = useUserContext()

  return useMemo(() => {
    const handleError = error => {
      const url = error?.config?.url || ''
      // A 401 outside the auth endpoints means the session expired
      if (error?.response?.status === 401 && !url.startsWith('/auth/')) {
        toast.error('Your session has expired. Please sign in again.', { id: 'session-expired' })
        signOutUser()
        return null
      }
      toast.error(errorMessage(error))
      return null
    }

    const request = method => async (url, body) => {
      try {
        const { data } = await api.request({ method, url, data: body })
        return data
      } catch (error) {
        return handleError(error)
      }
    }

    return {
      get: request('get'),
      post: request('post'),
      put: request('put'),
      del: request('delete'),
    }
  }, [signOutUser])
}

import axios from 'axios'
import toast from 'react-hot-toast'

export const useApi = onUnauthorized => {
  const api = axios.create({
    // baseURL: 'http://localhost:5000/api', // Development
    baseURL: '/api', // Production
    withCredentials: true
  })

  const handleError = error => {
    if (error.response?.status === 401) {
      onUnauthorized?.()
      throw error // Throw to handle loading states in components
    }

    // Show toast for non-auth errors
    if (error?.response?.data?.message) {
      toast.error(error.response.data.message)
    } else {
      toast.error('An unexpected error occurred')
    }

    throw error // Throw to handle loading states in components
  }

  const get = async url => {
    try {
      const { data } = await api.get(url)
      return data
    } catch (error) {
      handleError(error)
    }
  }

  const post = async (url, body) => {
    try {
      const { data } = await api.post(url, body)
      return data
    } catch (error) {
      handleError(error)
    }
  }

  const put = async (url, body) => {
    try {
      const { data } = await api.put(url, body)
      return data
    } catch (error) {
      handleError(error)
      // Don't throw after showing toast
      return null
    }
  }

  const del = async url => {
    try {
      const { data } = await api.delete(url)
      return data
    } catch (error) {
      handleError(error)
      // Don't throw after showing toast
      return null
    }
  }

  return {
    get,
    post,
    put,
    del
  }
}

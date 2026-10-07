import { useMemo } from 'react'
import { useApi } from './useApi'

export const useUser = () => {
  const { get, put, del } = useApi()

  return useMemo(
    () => ({
      getUsers: () => get('/user'),
      getUser: id => get(`/user/${id}`),
      updateUser: formData => put('/user', formData),
      deleteUser: id => del(`/user/${id}`),
    }),
    [get, put, del]
  )
}

import { useApi } from './useApi'

export const useUser = () => {
  const { post, get, put, del } = useApi()

  const getUsers = async () => {
    const data = await get('/user')
    return data
  }

  const getUser = async (id) => {
    const data = await get(`/user/${id}`)
    return data
  }

  const createUser = async (formData) => {
    const data = await post('/user', formData)
    return data
  }

  const updateUser = async (formData) => {
    const data = await put('/user', formData)
    return data
  }

  const deleteUser = async (id) => {
    const data = await del(`/user/${id}`)
    return data
  }

  return {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
  }
}

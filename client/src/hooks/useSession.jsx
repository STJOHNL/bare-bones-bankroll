import { useApi } from './useApi'

export const useSession = () => {
  const { post, get, put, del } = useApi()

  const getSessions = async () => {
    const data = await get('/session')
    return data
  }

  const getSessionById = async id => {
    const data = await get(`/session/${id}`)
    return data
  }

  const createSession = async formData => {
    const data = await post('/session', formData)
    return data
  }

  const updateSession = async formData => {
    const data = await put('/session', formData)
    return data
  }

  const deleteSession = async id => {
    const data = await del(`/session/${id}`)
    return data
  }

  const importSessions = async sessions => {
    const data = await post('/session/import', sessions)
    return data
  }

  return {
    getSessions,
    getSessionById,
    createSession,
    updateSession,
    deleteSession,
    importSessions
  }
}

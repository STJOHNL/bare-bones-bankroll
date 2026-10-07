import { useMemo } from 'react'
import { useApi } from './useApi'

export const useSession = () => {
  const { get, post, put, del } = useApi()

  return useMemo(
    () => ({
      getSessions: () => get('/session'),
      getSessionById: id => get(`/session/${id}`),
      // The server also writes the session's Buy-in/Cash-out transactions
      createSession: formData => post('/session', formData),
      // Partial update: send { id, ...changedFields }
      updateSession: formData => put('/session', formData),
      deleteSession: id => del(`/session/${id}`),
      importSessions: sessions => post('/session/import', sessions),
    }),
    [get, post, put, del]
  )
}

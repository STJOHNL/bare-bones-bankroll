import { useMemo } from 'react'
import { useApi } from './useApi'

export const usePlayerNote = () => {
  const { get, post, put, del } = useApi()

  return useMemo(
    () => ({
      getPlayerNotes: () => get('/player-notes'),
      createPlayerNote: data => post('/player-notes', data),
      updatePlayerNote: (id, data) => put(`/player-notes/${id}`, data),
      deletePlayerNote: id => del(`/player-notes/${id}`),
    }),
    [get, post, put, del]
  )
}

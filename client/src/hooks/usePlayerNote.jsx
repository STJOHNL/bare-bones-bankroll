import { useApi } from './useApi'

export const usePlayerNote = () => {
  const { get, post, put, del } = useApi()

  const getPlayerNotes = async () => get('/player-notes')
  const createPlayerNote = async data => post('/player-notes', data)
  const updatePlayerNote = async (id, data) => put(`/player-notes/${id}`, data)
  const deletePlayerNote = async id => del(`/player-notes/${id}`)

  return { getPlayerNotes, createPlayerNote, updatePlayerNote, deletePlayerNote }
}

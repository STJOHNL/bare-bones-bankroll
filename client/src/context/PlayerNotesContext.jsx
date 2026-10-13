import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { usePlayerNote } from '../hooks/usePlayerNote'
import { useUserContext } from './UserContext'
import { sortPlayerNotes } from '../utils/playerCategories'

const PlayerNotesContext = createContext()

// Player notes live here so the notes page and the pinned-players dock stay in sync
export const PlayerNotesProvider = ({ children }) => {
  const { user } = useUserContext()
  const { getPlayerNotes, createPlayerNote, updatePlayerNote, deletePlayerNote } = usePlayerNote()
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotes([])
      return
    }
    let cancelled = false
    const fetchNotes = async () => {
      setIsLoading(true)
      const data = await getPlayerNotes()
      if (cancelled) return
      if (data) setNotes(data)
      setIsLoading(false)
    }
    fetchNotes()
    return () => {
      cancelled = true
    }
  }, [user, getPlayerNotes])

  const replace = useCallback(updated => setNotes(prev => prev.map(n => (n._id === updated._id ? updated : n))), [])

  const createNote = useCallback(
    async data => {
      const created = await createPlayerNote(data)
      if (created) setNotes(prev => [created, ...prev])
      return created
    },
    [createPlayerNote]
  )

  const updateNote = useCallback(
    async (id, patch) => {
      const updated = await updatePlayerNote(id, patch)
      if (updated) replace(updated)
      return updated
    },
    [updatePlayerNote, replace]
  )

  const deleteNote = useCallback(
    async id => {
      const res = await deletePlayerNote(id)
      if (res) setNotes(prev => prev.filter(n => n._id !== id))
      return res
    },
    [deletePlayerNote]
  )

  // Flip the pin immediately so it feels instant at the tables; roll back on failure
  const togglePin = useCallback(
    async note => {
      const pinned = !note.pinned
      replace({ ...note, pinned })
      const updated = await updatePlayerNote(note._id, { pinned })
      if (updated) {
        replace(updated)
        toast.success(pinned ? `Pinned ${note.name}` : `Unpinned ${note.name}`)
      } else {
        replace(note)
      }
    },
    [updatePlayerNote, replace]
  )

  const sorted = useMemo(() => sortPlayerNotes(notes), [notes])
  const pinned = useMemo(() => sorted.filter(n => n.pinned), [sorted])

  const value = useMemo(
    () => ({ notes: sorted, pinned, isLoading, createNote, updateNote, deleteNote, togglePin }),
    [sorted, pinned, isLoading, createNote, updateNote, deleteNote, togglePin]
  )

  return <PlayerNotesContext.Provider value={value}>{children}</PlayerNotesContext.Provider>
}

export const usePlayerNotesContext = () => {
  const context = useContext(PlayerNotesContext)
  if (!context) throw new Error('usePlayerNotesContext must be used within a PlayerNotesProvider')
  return context
}

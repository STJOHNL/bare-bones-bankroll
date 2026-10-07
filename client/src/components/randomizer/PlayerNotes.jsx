import { useState, useEffect } from 'react'
import { FaPlus, FaPencilAlt, FaTrashAlt, FaSearch } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import ConfirmModal from '../ConfirmModal'
import Loader from '../Loader'
import { usePlayerNote } from '../../hooks/usePlayerNote'

const PlayerNotes = () => {
  const { getPlayerNotes, createPlayerNote, updatePlayerNote, deletePlayerNote } = usePlayerNote()

  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNote, setNewNote] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true)
      setNotes((await getPlayerNotes()) || [])
      setIsLoading(false)
    }
    fetchNotes()
  }, [getPlayerNotes])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const created = await createPlayerNote({ name: newName.trim(), notes: newNote.trim() })
    setSaving(false)
    if (created) {
      setNotes(prev => [created, ...prev])
      setNewName('')
      setNewNote('')
      setAddOpen(false)
      toast.success('Note saved!')
    }
  }

  const handleEdit = note => {
    setEditId(note._id)
    setEditName(note.name)
    setEditNote(note.notes)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    setSaving(true)
    const updated = await updatePlayerNote(editId, { name: editName.trim(), notes: editNote.trim() })
    setSaving(false)
    if (updated) {
      setNotes(prev => prev.map(n => (n._id === editId ? updated : n)))
      setEditId(null)
      toast.success('Note updated!')
    }
  }

  const handleDelete = async id => {
    const res = await deletePlayerNote(id)
    if (res) {
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success('Note deleted.')
    }
    setDeleteTarget(null)
  }

  const query = search.trim().toLowerCase()
  const filtered = query ? notes.filter(n => n.name.toLowerCase().includes(query)) : notes

  return (
    <div className='player-notes'>
      <div className='player-notes__header'>
        <h2>Player Notes</h2>
        <button
          className='btn btn--primary'
          onClick={() => {
            setAddOpen(o => !o)
            setNewName('')
            setNewNote('')
          }}>
          <FaPlus /> Add
        </button>
      </div>

      {addOpen && (
        <div className='player-note player-note--form'>
          <input
            type='text'
            placeholder='Player name or screen name'
            aria-label='Player name'
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            maxLength={100}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <textarea
            placeholder='Notes about this player...'
            aria-label='Notes about this player'
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            rows={3}
          />
          <div className='player-note__actions'>
            <button className='btn btn--primary' onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className='btn btn--subtle' onClick={() => setAddOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {notes.length > 1 && (
        <div className='player-notes__search'>
          <FaSearch className='player-notes__search-icon' aria-hidden='true' />
          <input
            type='text'
            placeholder='Search players…'
            aria-label='Search players'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 && !addOpen ? (
        <p className='player-notes__empty'>{notes.length === 0 ? 'No player notes yet.' : 'No results.'}</p>
      ) : (
        <div className='player-notes__list'>
          {filtered.map(n => (
            <div className='player-note' key={n._id}>
              {editId === n._id ? (
                <>
                  <input
                    type='text'
                    aria-label='Player name'
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    maxLength={100}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  />
                  <textarea
                    aria-label='Notes about this player'
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    rows={4}
                  />
                  <div className='player-note__actions'>
                    <button className='btn btn--primary' onClick={handleSaveEdit} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button className='btn btn--subtle' onClick={() => setEditId(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className='player-note__top'>
                    <span className='player-note__name'>{n.name}</span>
                    <div className='player-note__manage'>
                      <button className='btn btn--subtle' onClick={() => handleEdit(n)} aria-label={`Edit notes for ${n.name}`}>
                        <FaPencilAlt className='btn--icon' />
                      </button>
                      <button
                        className='btn btn--subtle'
                        onClick={() => setDeleteTarget(n._id)}
                        aria-label={`Delete notes for ${n.name}`}>
                        <FaTrashAlt className='btn--icon--danger' />
                      </button>
                    </div>
                  </div>
                  {n.notes && <p className='player-note__text'>{n.notes}</p>}
                  <span className='player-note__date'>{format(new Date(n.updatedAt), 'MMM d, yyyy · h:mm a')}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message='Delete this player note?'
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default PlayerNotes

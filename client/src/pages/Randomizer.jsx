import { useState, useEffect, useCallback } from 'react'
import { FaPlus, FaPencilAlt, FaTrashAlt, FaSearch } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'
import Loader from '../components/Loader'
import { usePlayerNote } from '../hooks/usePlayerNote'

const yesGifs = Object.values(import.meta.glob('../assets/NumGenGifs/yes*.gif', { eager: true, query: '?url', import: 'default' }))
const noGifs = Object.values(import.meta.glob('../assets/NumGenGifs/no*.gif', { eager: true, query: '?url', import: 'default' }))

const Randomizer = () => {
  const { getPlayerNotes, createPlayerNote, updatePlayerNote, deletePlayerNote } = usePlayerNote()

  // ── RNG ──────────────────────────────────────────────────────────────────
  const [rngResult, setRngResult] = useState(null)
  const [rngGif, setRngGif] = useState(null)
  const [rolling, setRolling] = useState(false)

  const roll = useCallback(() => {
    setRolling(true)
    setRngResult(null)
    setRngGif(null)
    setTimeout(() => {
      const n = Math.floor(Math.random() * 100) + 1
      const pool = n >= 50 ? yesGifs : noGifs
      setRngResult(n)
      setRngGif(pool[Math.floor(Math.random() * pool.length)])
      setRolling(false)
    }, 350)
  }, [])

  // ── Player notes ─────────────────────────────────────────────────────────
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
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
    const fetch = async () => {
      setIsLoading(true)
      const data = await getPlayerNotes()
      setNotes(data || [])
      setIsLoading(false)
    }
    fetch()
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const created = await createPlayerNote({ name: newName.trim(), notes: newNote.trim() })
    if (created) {
      setNotes(prev => [created, ...prev])
      setNewName('')
      setNewNote('')
      setAddOpen(false)
      toast.success('Note saved!')
    }
    setSaving(false)
  }

  const handleEdit = note => {
    setEditId(note._id)
    setEditName(note.name)
    setEditNote(note.notes)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    const updated = await updatePlayerNote(editId, { name: editName.trim(), notes: editNote.trim() })
    if (updated) {
      setNotes(prev => prev.map(n => (n._id === editId ? updated : n)))
      setEditId(null)
      toast.success('Note updated!')
    }
    setSaving(false)
  }

  const handleDelete = async id => {
    const res = await deletePlayerNote(id)
    if (res) {
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success('Note deleted.')
    }
    setDeleteTarget(null)
  }

  const filtered = search.trim()
    ? notes.filter(n => n.name.toLowerCase().includes(search.trim().toLowerCase()))
    : notes

  const isAggressive = rngResult !== null && rngResult >= 50

  return (
    <>
      <PageTitle title='Randomizer' />

      {/* ── RNG ─────────────────────────────────────────────────── */}
      <div className='rng-panel'>
        <div className='rng-panel__left'>
          <p className='rng-panel__label'>Play Decision</p>
          <button
            className={`rng-panel__roll-btn${rolling ? ' rng-panel__roll-btn--rolling' : ''}`}
            onClick={roll}
            disabled={rolling}>
            Roll
          </button>
          {rngResult !== null && (
            <div className='rng-panel__verdict' style={{ color: isAggressive ? 'var(--green)' : 'var(--red)' }}>
              <span className='rng-panel__number'>{rngResult}</span>
              <span className='rng-panel__tag'>{isAggressive ? 'Aggressive' : 'Passive'}</span>
            </div>
          )}
        </div>

        <div className='rng-panel__right'>
          {rngGif
            ? <img src={rngGif} alt='' className='rng-panel__gif' />
            : <div className='rng-panel__placeholder'>?</div>
          }
        </div>
      </div>

      {/* ── Player Notes ─────────────────────────────────────────── */}
      <div className='player-notes'>
        <div className='player-notes__header'>
          <h2>Player Notes</h2>
          <button
            className='btn btn--primary'
            onClick={() => { setAddOpen(o => !o); setNewName(''); setNewNote('') }}>
            <FaPlus /> Add
          </button>
        </div>

        {addOpen && (
          <div className='player-note player-note--form'>
            <input
              type='text'
              placeholder='Player name or screen name'
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <textarea
              placeholder='Notes about this player...'
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={3}
            />
            <div className='player-note__actions'>
              <button className='btn btn--primary' onClick={handleAdd} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className='btn btn--subtle' onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {notes.length > 1 && (
          <div className='player-notes__search'>
            <FaSearch className='player-notes__search-icon' />
            <input
              type='text'
              placeholder='Search players…'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 && !addOpen ? (
          <p className='player-notes__empty'>
            {notes.length === 0 ? 'No player notes yet.' : 'No results.'}
          </p>
        ) : (
          <div className='player-notes__list'>
            {filtered.map(n => (
              <div className='player-note' key={n._id}>
                {editId === n._id ? (
                  <>
                    <input
                      type='text'
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                    />
                    <textarea
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      rows={4}
                    />
                    <div className='player-note__actions'>
                      <button className='btn btn--primary' onClick={handleSaveEdit} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button className='btn btn--subtle' onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='player-note__top'>
                      <span className='player-note__name'>{n.name}</span>
                      <div className='player-note__manage'>
                        <button className='btn btn--subtle' onClick={() => handleEdit(n)} aria-label='Edit'>
                          <FaPencilAlt className='btn--icon' />
                        </button>
                        <button className='btn btn--subtle' onClick={() => setDeleteTarget(n._id)} aria-label='Delete'>
                          <FaTrashAlt className='btn--icon--danger' />
                        </button>
                      </div>
                    </div>
                    {n.notes && <p className='player-note__text'>{n.notes}</p>}
                    <span className='player-note__date'>
                      {format(new Date(n.updatedAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message='Delete this player note?'
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default Randomizer

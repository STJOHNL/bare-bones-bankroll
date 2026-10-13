import { useState, useMemo } from 'react'
import { FaPlus, FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'
import ConfirmModal from '../ConfirmModal'
import Loader from '../Loader'
import PlayerNoteCard from '../players/PlayerNoteCard'
import PlayerNoteForm from '../players/PlayerNoteForm'
import { usePlayerNotesContext } from '../../context/PlayerNotesContext'
import { PLAYER_CATEGORIES } from '../../utils/playerCategories'

const PlayerNotes = () => {
  const { notes, isLoading, createNote, updateNote, deleteNote, togglePin } = usePlayerNotesContext()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const counts = useMemo(() => {
    const byCategory = {}
    for (const n of notes) byCategory[n.category || 'unknown'] = (byCategory[n.category || 'unknown'] || 0) + 1
    return byCategory
  }, [notes])

  const query = search.trim().toLowerCase()
  const filtered = notes.filter(
    n =>
      (categoryFilter === 'all' || (n.category || 'unknown') === categoryFilter) &&
      (!query || n.name.toLowerCase().includes(query) || n.notes?.toLowerCase().includes(query))
  )

  const handleAdd = async data => {
    const created = await createNote(data)
    if (created) {
      setAddOpen(false)
      toast.success('Player saved!')
    }
  }

  const handleSaveEdit = async data => {
    const updated = await updateNote(editId, data)
    if (updated) {
      setEditId(null)
      toast.success('Player updated!')
    }
  }

  const handleDelete = async id => {
    if (await deleteNote(id)) toast.success('Player deleted.')
    setDeleteTarget(null)
  }

  return (
    <div className='player-notes' id='player-notes'>
      <div className='player-notes__header'>
        <h2>Player Notes</h2>
        <button
          className='btn btn--primary'
          onClick={() => {
            setAddOpen(o => !o)
            setEditId(null)
          }}>
          <FaPlus /> Add
        </button>
      </div>

      {addOpen && (
        <PlayerNoteForm idPrefix='new-player' submitLabel='Save' onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      )}

      {notes.length > 0 && (
        <>
          <div className='category-filter' role='group' aria-label='Filter by player type'>
            <button
              type='button'
              className={`category-filter__chip${categoryFilter === 'all' ? ' category-filter__chip--active' : ''}`}
              aria-pressed={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}>
              All <span className='category-filter__count'>{notes.length}</span>
            </button>
            {/* Only types in use, plus the active one so it never vanishes mid-filter */}
            {PLAYER_CATEGORIES.filter(c => counts[c.key] || categoryFilter === c.key).map(c => (
              <button
                key={c.key}
                type='button'
                className={`category-filter__chip${categoryFilter === c.key ? ' category-filter__chip--active' : ''}`}
                style={{ '--category-color': c.color }}
                aria-pressed={categoryFilter === c.key}
                onClick={() => setCategoryFilter(c.key)}>
                <span className='category-picker__dot' aria-hidden='true' />
                {c.label} <span className='category-filter__count'>{counts[c.key] || 0}</span>
              </button>
            ))}
          </div>

          <div className='player-notes__search'>
            <FaSearch className='player-notes__search-icon' aria-hidden='true' />
            <input
              type='text'
              placeholder='Search players or notes…'
              aria-label='Search players'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </>
      )}

      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        !addOpen && (
          <p className='player-notes__empty'>
            {notes.length === 0 ? 'No player notes yet. Add a player to start colour-coding the table.' : 'No results.'}
          </p>
        )
      ) : (
        <div className='player-notes__list'>
          {filtered.map(n =>
            editId === n._id ? (
              <PlayerNoteForm
                key={n._id}
                idPrefix={`edit-${n._id}`}
                initial={n}
                submitLabel='Save'
                onSubmit={handleSaveEdit}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <PlayerNoteCard
                key={n._id}
                note={n}
                onEdit={note => {
                  setEditId(note._id)
                  setAddOpen(false)
                }}
                onDelete={setDeleteTarget}
                onTogglePin={togglePin}
              />
            )
          )}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete notes for ${deleteTarget.name}?`}
          onConfirm={() => handleDelete(deleteTarget._id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default PlayerNotes

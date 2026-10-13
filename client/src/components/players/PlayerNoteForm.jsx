import { useState } from 'react'
import { CategoryPicker } from './PlayerBadges'
import { playerCategory } from '../../utils/playerCategories'

// Add / edit form for a player note
const PlayerNoteForm = ({ initial = {}, submitLabel, onSubmit, onCancel, idPrefix }) => {
  const [name, setName] = useState(initial.name || '')
  const [category, setCategory] = useState(initial.category || 'unknown')
  const [notes, setNotes] = useState(initial.notes || '')
  const [pinned, setPinned] = useState(!!initial.pinned)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSaving(true)
    await onSubmit({ name: name.trim(), category, notes: notes.trim(), pinned })
    setIsSaving(false)
  }

  return (
    <form
      className='player-note player-note--form'
      style={{ '--category-color': playerCategory(category).color }}
      onSubmit={handleSubmit}>
      <label htmlFor={`${idPrefix}-name`}>Player name</label>
      <input
        id={`${idPrefix}-name`}
        type='text'
        placeholder='Screen name'
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={100}
        required
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />

      <CategoryPicker value={category} onChange={setCategory} idPrefix={`${idPrefix}-category`} />

      <label htmlFor={`${idPrefix}-notes`}>Notes</label>
      <textarea
        id={`${idPrefix}-notes`}
        placeholder='Tendencies, sizings, reads…'
        value={notes}
        onChange={e => setNotes(e.target.value)}
        maxLength={5000}
        rows={4}
      />

      <label className='checkbox-row' htmlFor={`${idPrefix}-pinned`}>
        <input id={`${idPrefix}-pinned`} type='checkbox' checked={pinned} onChange={e => setPinned(e.target.checked)} />
        Pin so it stays in view while playing
      </label>

      <div className='player-note__actions'>
        <button type='submit' className='btn btn--primary' disabled={isSaving}>
          {isSaving ? 'Saving…' : submitLabel}
        </button>
        <button type='button' className='btn btn--subtle' onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default PlayerNoteForm

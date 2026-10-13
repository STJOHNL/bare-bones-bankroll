import { FaPencilAlt, FaTrashAlt, FaThumbtack } from 'react-icons/fa'
import { format } from 'date-fns'
import { CategoryBadge, PlayerAvatar } from './PlayerBadges'
import { playerCategory } from '../../utils/playerCategories'

const PlayerNoteCard = ({ note, onEdit, onDelete, onTogglePin }) => (
  <div
    className={`player-note${note.pinned ? ' player-note--pinned' : ''}`}
    style={{ '--category-color': playerCategory(note.category).color }}>
    <div className='player-note__top'>
      <div className='player-note__identity'>
        <PlayerAvatar name={note.name} category={note.category} />
        <div>
          <span className='player-note__name'>{note.name}</span>
          <CategoryBadge category={note.category} />
        </div>
      </div>
      <div className='player-note__manage'>
        <button
          className={`btn btn--subtle player-note__pin${note.pinned ? ' player-note__pin--active' : ''}`}
          onClick={() => onTogglePin(note)}
          aria-pressed={!!note.pinned}
          aria-label={note.pinned ? `Unpin ${note.name}` : `Pin ${note.name}`}
          title={note.pinned ? 'Unpin' : 'Pin to keep in view'}>
          <FaThumbtack className='btn--icon' />
        </button>
        <button className='btn btn--subtle' onClick={() => onEdit(note)} aria-label={`Edit notes for ${note.name}`}>
          <FaPencilAlt className='btn--icon' />
        </button>
        <button className='btn btn--subtle' onClick={() => onDelete(note)} aria-label={`Delete notes for ${note.name}`}>
          <FaTrashAlt className='btn--icon--danger' />
        </button>
      </div>
    </div>
    {note.notes && <p className='player-note__text'>{note.notes}</p>}
    <span className='player-note__date'>Updated {format(new Date(note.updatedAt), 'MMM d, yyyy · h:mm a')}</span>
  </div>
)

export default PlayerNoteCard

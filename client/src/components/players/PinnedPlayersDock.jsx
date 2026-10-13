import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaThumbtack, FaChevronDown, FaTimes } from 'react-icons/fa'
import { CategoryBadge, PlayerAvatar } from './PlayerBadges'
import { usePlayerNotesContext } from '../../context/PlayerNotesContext'
import { playerCategory } from '../../utils/playerCategories'

const STORAGE_KEY = 'pinnedDockOpen'

const readOpen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

// Floating panel on every signed-in page showing pinned players, so reads are
// in view while playing. Collapses to a small pill.
const PinnedPlayersDock = () => {
  const { pinned, togglePin } = usePlayerNotesContext()
  const [open, setOpen] = useState(readOpen)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(open))
    } catch {
      // Storage unavailable (private mode) — the dock still works for this visit
    }
  }, [open])

  if (!pinned.length) return null

  if (!open) {
    return (
      <button
        type='button'
        className='pinned-dock__pill'
        onClick={() => setOpen(true)}
        aria-expanded='false'
        aria-controls='pinned-dock'>
        <FaThumbtack aria-hidden='true' />
        <span className='pinned-dock__dots' aria-hidden='true'>
          {pinned.slice(0, 5).map(n => (
            <span key={n._id} style={{ backgroundColor: playerCategory(n.category).color }} />
          ))}
        </span>
        Pinned ({pinned.length})
      </button>
    )
  }

  return (
    <aside className='pinned-dock' id='pinned-dock' aria-label='Pinned players'>
      <div className='pinned-dock__header'>
        <span className='pinned-dock__title'>
          <FaThumbtack aria-hidden='true' /> Pinned players
        </span>
        <div className='pinned-dock__header-actions'>
          <Link to='/randomizer' className='pinned-dock__manage'>
            Manage
          </Link>
          <button
            type='button'
            className='btn btn--subtle'
            onClick={() => setOpen(false)}
            aria-expanded='true'
            aria-controls='pinned-dock'
            aria-label='Collapse pinned players'>
            <FaChevronDown className='btn--icon' />
          </button>
        </div>
      </div>
      <ul className='pinned-dock__list'>
        {pinned.map(n => {
          const expanded = expandedId === n._id
          return (
            <li key={n._id} className='pinned-dock__item' style={{ '--category-color': playerCategory(n.category).color }}>
              <PlayerAvatar name={n.name} category={n.category} size='sm' />
              <div className='pinned-dock__body'>
                <div className='pinned-dock__row'>
                  <span className='pinned-dock__name'>{n.name}</span>
                  <CategoryBadge category={n.category} />
                </div>
                {n.notes && (
                  <button
                    type='button'
                    className={`pinned-dock__notes${expanded ? ' pinned-dock__notes--expanded' : ''}`}
                    onClick={() => setExpandedId(expanded ? null : n._id)}
                    aria-expanded={expanded}
                    title={expanded ? 'Show less' : 'Show full notes'}>
                    {n.notes}
                  </button>
                )}
              </div>
              <button
                type='button'
                className='btn btn--subtle pinned-dock__unpin'
                onClick={() => togglePin(n)}
                aria-label={`Unpin ${n.name}`}
                title='Unpin'>
                <FaTimes className='btn--icon' />
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default PinnedPlayersDock

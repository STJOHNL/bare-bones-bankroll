import { useMemo, useState } from 'react'
import { FaTrashAlt } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useHandLog } from '../hooks/useHandLog'
import ConfirmModal from './ConfirmModal'
import { formatHands, handsAsOf, totalHands } from '../utils/hands'

const RECENT_COUNT = 5

const MODES = [
  { value: 'add', label: 'Hands played' },
  { value: 'total', label: 'New lifetime total' },
]

// Lifetime hand count and the log behind it — the page owns `logs` so reports can use them
const HandLog = ({ logs, setLogs }) => {
  const { createHandLog, deleteHandLog } = useHandLog()

  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [mode, setMode] = useState('add')
  const [hands, setHands] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const total = useMemo(() => totalHands(logs), [logs])

  // Newest first, each with the lifetime total after it
  const rows = useMemo(() => {
    let running = 0
    return [...logs]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(l => ({ ...l, running: (running += l.hands) }))
      .reverse()
  }, [logs])

  const handleSubmit = async e => {
    e.preventDefault()
    const value = Number(hands)
    const when = date ? new Date(date) : new Date()
    if (!Number.isInteger(value) || value <= 0) {
      toast.error('Enter a whole number of hands greater than 0')
      return
    }

    // A new lifetime total is stored as the hands played since the earlier entries
    const prior = handsAsOf(logs, when)
    const delta = mode === 'total' ? value - prior : value
    if (delta <= 0) {
      toast.error(`Your new total must be more than the ${formatHands(prior)} hands already logged`)
      return
    }

    setIsSubmitting(true)
    const res = await createHandLog({ hands: delta, date: when.toISOString(), note: note.trim() })
    setIsSubmitting(false)

    if (res) {
      setLogs(prev => [...prev, res])
      toast.success(`Logged ${formatHands(delta)} hands`)
      setHands('')
      setDate('')
      setNote('')
    }
  }

  const handleDelete = async id => {
    const res = await deleteHandLog(id)
    if (res) setLogs(prev => prev.filter(l => l._id !== id))
    setDeleteTarget(null)
  }

  const visibleRows = showAll ? rows : rows.slice(0, RECENT_COUNT)

  return (
    <div className='card hand-log'>
      <div className='hand-log__header'>
        <div>
          <h2>Hands Played</h2>
          <span className='hand-log__total'>{formatHands(total)}</span>
        </div>
        <button
          type='button'
          className={`btn ${isOpen ? 'btn--subtle' : 'btn--primary'}`}
          onClick={() => setIsOpen(o => !o)}
          aria-expanded={isOpen}>
          {isOpen ? 'Close' : '+ Log Hands'}
        </button>
      </div>

      {isOpen && (
        <>
          <form onSubmit={handleSubmit}>
            <div role='group' aria-label='Entry type'>
              <div className='type-toggle'>
                {MODES.map(m => (
                  <button
                    key={m.value}
                    type='button'
                    className={`type-toggle__btn${mode === m.value ? ' type-toggle__btn--active' : ''}`}
                    onClick={() => setMode(m.value)}
                    aria-pressed={mode === m.value}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p className='form-hint'>
              {mode === 'add'
                ? 'Hands played since your last entry. Log them after you play: reports by hand range use each entry as a checkpoint.'
                : 'The lifetime count from your tracker or site. The difference from your logged total is recorded.'}
            </p>

            <div className='form-row'>
              <div>
                <label htmlFor='hands'>{mode === 'add' ? 'Hands' : 'Lifetime hands'}</label>
                <input
                  type='number'
                  id='hands'
                  value={hands}
                  onChange={e => setHands(e.target.value)}
                  placeholder={mode === 'add' ? 'e.g. 1500' : formatHands(total)}
                  min='1'
                  step='1'
                  inputMode='numeric'
                  required
                />
              </div>
              <div>
                <label htmlFor='handsDate'>As of</label>
                <input type='datetime-local' id='handsDate' value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <p className='form-hint'>Leave &quot;As of&quot; blank to use the current time.</p>

            <label htmlFor='handsNote'>Note</label>
            <input
              type='text'
              id='handsNote'
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder='Optional note'
              maxLength={200}
            />

            <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'is-loading' : ''}>
              {isSubmitting && <span className='btn-spinner' aria-hidden='true' />}
              {isSubmitting ? 'Saving…' : 'Log Hands'}
            </button>
          </form>

          {rows.length > 0 && (
            <div className='hand-log__entries'>
              <div className='table-responsive'>
                <table>
                  <thead>
                    <tr>
                      <th scope='col'>Date</th>
                      <th scope='col'>Hands</th>
                      <th scope='col'>Lifetime</th>
                      <th scope='col'>Note</th>
                      <th scope='col'>
                        <span className='visually-hidden'>Manage</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(l => (
                      <tr key={l._id}>
                        <td data-label='Date'>{format(new Date(l.date), 'MM/dd/yy h:mm a')}</td>
                        <td data-label='Hands'>+{formatHands(l.hands)}</td>
                        <td data-label='Lifetime'>{formatHands(l.running)}</td>
                        <td data-label='Note'>{l.note || '—'}</td>
                        <td data-label=''>
                          <button
                            type='button'
                            onClick={() => setDeleteTarget(l._id)}
                            className='btn btn--subtle'
                            aria-label={`Delete entry of ${formatHands(l.hands)} hands`}>
                            <FaTrashAlt className='btn--icon--danger' />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > RECENT_COUNT && (
                <button type='button' className='btn btn--subtle' onClick={() => setShowAll(s => !s)}>
                  {showAll ? 'Show recent' : `Show all ${rows.length} entries`}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          message='Delete this hand log entry? Your lifetime total will drop by its hands.'
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default HandLog

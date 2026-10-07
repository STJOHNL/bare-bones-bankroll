import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
// Custom Hooks
import { useSession } from '../../hooks/useSession'
// Context
import { useBankrollContext } from '../../context/BankrollContext'
// Utils
import { formatDuration, toDateTimeLocal } from '../../utils/dates'
import { formatSigned } from '../../utils/money'

const SessionForm = ({ onSubmitCallback, parentData, prefillData, buttonText }) => {
  const { createSession, updateSession } = useSession()
  const { refetchTransactions } = useBankrollContext()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Setup fields: prefer parentData (edit), then prefillData (duplicate), then empty
  const initSource = parentData || prefillData || {}

  // Form data
  const [venue, setVenue] = useState(initSource.venue || 'Online')
  const [type, setType] = useState(initSource.type || 'Cash')
  const [game, setGame] = useState(initSource.game || 'NL')
  const [name, setName] = useState(initSource.name || '')
  const [buyin, setBuyin] = useState(initSource.buyin ?? '')
  // Result fields: only carry over when editing (parentData), not when duplicating
  const [cashout, setCashout] = useState(parentData?.cashout ?? '')
  const [start, setStart] = useState(toDateTimeLocal(parentData?.start || new Date()))
  const [end, setEnd] = useState(parentData?.end ? toDateTimeLocal(parentData.end) : '')
  const [notes, setNotes] = useState(initSource.notes || '')

  // Derived: live P&L
  const pnl = (parseFloat(cashout) || 0) - (parseFloat(buyin) || 0)
  const showPnl = buyin !== '' || cashout !== ''

  // Derived: session duration
  const duration = start && end ? formatDuration(new Date(end) - new Date(start)) : ''

  const validate = () => {
    if (!name.trim()) return type === 'Cash' ? 'Enter the stake' : 'Enter the tournament name'
    if (end && new Date(end) <= new Date(start)) return 'End time must be after the start time'
    return null
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    const formData = {
      venue,
      type,
      game,
      name: name.trim(),
      buyin: parseFloat(buyin) || 0,
      cashout: parseFloat(cashout) || 0,
      start: new Date(start).toISOString(),
      end: end ? new Date(end).toISOString() : null,
      notes,
    }

    setIsSubmitting(true)
    const res = parentData
      ? await updateSession({ id: parentData._id, ...formData })
      : await createSession(formData)
    setIsSubmitting(false)

    if (!res) return

    // The server keeps the session's Buy-in/Cash-out transactions in sync
    await refetchTransactions()

    if (parentData) {
      toast.success('Changes saved')
      onSubmitCallback?.(res)
    } else {
      toast.success('Go get some stacks!')
      navigate('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>
        {venue} {type} Session
      </h2>

      {/* Game Details Section */}
      <div className='form-section'>
        <h3>Game Details</h3>
        {/* Toggle buttons are not inputs so htmlFor doesn't apply — use role="group"
            with aria-label to give screen readers the field name */}
        <div role='group' aria-label='Session type'>
          <span aria-hidden='true'>Type</span>
          <div className='type-toggle'>
            {['Cash', 'Tournament'].map(t => (
              <button
                key={t}
                type='button'
                className={`type-toggle__btn${type === t ? ' type-toggle__btn--active' : ''}`}
                onClick={() => setType(t)}
                aria-pressed={type === t}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className='form-row'>
          <div>
            <label htmlFor='venue'>Venue</label>
            <select name='venue' id='venue' value={venue} onChange={e => setVenue(e.target.value)} required>
              <option value='Online'>Online</option>
              <option value='Live'>Live</option>
            </select>
          </div>
          <div>
            <label htmlFor='game'>Game</label>
            <select name='game' id='game' value={game} onChange={e => setGame(e.target.value)} required>
              <option value='NL'>NL</option>
              <option value='PLO'>PLO</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor='name'>{type === 'Cash' ? 'Stake' : 'Tournament Name'}</label>
          <input
            type='text'
            name='name'
            id='name'
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={type === 'Cash' ? 'e.g. NL20, NL50, NL100, NL200' : 'e.g. Sunday Million, WSOP Event #5, Home Game'}
            maxLength={200}
            required
          />
        </div>
      </div>

      {/* Financial Section */}
      <div className='form-section'>
        <h3>Financial Details</h3>
        <div className='form-row'>
          <div>
            <label htmlFor='buyin'>Buy-in ($)</label>
            <input
              type='number'
              name='buyin'
              id='buyin'
              value={buyin}
              onChange={e => setBuyin(e.target.value)}
              placeholder='0.00'
              step='0.01'
              min='0'
              required
            />
          </div>
          <div>
            <label htmlFor='cashout'>Cash Out ($)</label>
            <input
              type='number'
              name='cashout'
              id='cashout'
              value={cashout}
              onChange={e => setCashout(e.target.value)}
              placeholder='0.00'
              step='0.01'
              min='0'
            />
          </div>
        </div>
        {showPnl && <p className={`form-pnl ${pnl >= 0 ? 'amount--pos' : 'amount--neg'}`}>{formatSigned(pnl)}</p>}
      </div>

      {/* Time Section */}
      <div className='form-section'>
        <h3>Session Time</h3>
        <div className='form-row'>
          <div>
            <label htmlFor='start'>Start</label>
            <input
              type='datetime-local'
              name='start'
              id='start'
              value={start}
              onChange={e => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor='end'>End</label>
            <div className='input-action'>
              <input
                type='datetime-local'
                name='end'
                id='end'
                value={end}
                min={start}
                onChange={e => setEnd(e.target.value)}
              />
              <button type='button' className='btn--now' onClick={() => setEnd(toDateTimeLocal())}>
                Now
              </button>
            </div>
          </div>
        </div>
        {duration && <p className='form-hint'>Duration: {duration}</p>}
      </div>

      {/* Notes Section */}
      <div className='form-section'>
        <label htmlFor='notes'>Notes</label>
        <textarea
          name='notes'
          id='notes'
          onChange={e => setNotes(e.target.value)}
          value={notes}
          maxLength={5000}
          placeholder='Add any notes about this session...'></textarea>
      </div>

      <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'is-loading' : ''}>
        {isSubmitting && <span className='btn-spinner' aria-hidden='true' />}
        {isSubmitting ? 'Saving…' : buttonText}
      </button>
    </form>
  )
}

export default SessionForm

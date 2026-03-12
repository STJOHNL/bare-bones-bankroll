import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
// Custom Hooks
import { useSession } from '../../hooks/useSession'
import { useBankroll } from '../../hooks/useBankroll'
// Context
import { useBankrollContext } from '../../context/BankrollContext'

const CashForm = ({ onSubmitCallback, parentData, prefillData, buttonText, showStatus }) => {
  const { createSession, updateSession } = useSession()
  const { createTransaction } = useBankroll()
  const { setTransactions, refetchTransactions } = useBankrollContext()
  const navigate = useNavigate()

  // Convert ISO date string or Date object to datetime-local format
  const getLocalDateTime = date => {
    const d = date ? new Date(date) : new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Setup fields: prefer parentData (edit), then prefillData (duplicate), then empty
  const initSource = parentData || prefillData || {}

  // Form data
  const [venue, setVenue] = useState(initSource.venue || 'Online')
  const [type, setType] = useState(initSource.type || 'Cash')
  const [game, setGame] = useState(initSource.game || 'NL')
  const [name, setName] = useState(initSource.name || '')
  const [buyin, setBuyin] = useState(initSource.buyin || '')
  const [cashout, setCashout] = useState(parentData?.cashout || '')
  // Result fields: only carry over when editing (parentData), not when duplicating
  const [start, setStart] = useState(parentData?.start ? getLocalDateTime(parentData.start) : getLocalDateTime())
  const [end, setEnd] = useState(parentData?.end ? getLocalDateTime(parentData.end) : '')
  const [notes, setNotes] = useState(initSource.notes || '')

  // Derived: live P&L
  const buyinVal = parseFloat(buyin) || 0
  const cashoutVal = parseFloat(cashout) || 0
  const pnl = cashoutVal - buyinVal
  const showPnl = buyin !== '' || cashout !== ''

  // Derived: session duration
  const getDuration = () => {
    if (!start || !end) return ''
    const diff = new Date(end) - new Date(start)
    if (diff <= 0) return ''
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }
  const duration = getDuration()

  const handleSubmit = async e => {
    e.preventDefault()

    const formData = {
      id: parentData?._id || '',
      venue,
      type,
      game,
      name,
      buyin: parseFloat(buyin) || 0,
      cashout: parseFloat(cashout) || 0,
      start: start ? new Date(start).toISOString() : '',
      end: end ? new Date(end).toISOString() : '',
      notes
    }

    let res = null

    if (parentData) {
      res = await updateSession(formData)
      if (res) {
        await refetchTransactions()
        toast.success('Changes saved')
      }
    } else {
      res = await createSession(formData)
      if (res) {
        const buyinTxn = await createTransaction({
          type: 'Buy-in',
          amount: parseFloat(buyin) || 0,
          note: name,
          sessionId: res._id,
          ...(end && { date: new Date(end).toISOString() })
        })
        if (buyinTxn) setTransactions(prev => [buyinTxn, ...prev])

        const cashoutAmount = parseFloat(cashout) || 0
        if (cashoutAmount > 0) {
          const cashoutTxn = await createTransaction({
            type: 'Cash-out',
            amount: cashoutAmount,
            note: name,
            sessionId: res._id,
            ...(end && { date: new Date(end).toISOString() })
          })
          if (cashoutTxn) setTransactions(prev => [cashoutTxn, ...prev])
        }

        toast.success('Go get some stacks!')
        navigate('/dashboard')
      }
    }

    if (onSubmitCallback) {
      // Callback to update the parent component
      onSubmitCallback(res)
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
            <button
              type='button'
              className={`type-toggle__btn${type === 'Cash' ? ' type-toggle__btn--active' : ''}`}
              onClick={() => setType('Cash')}
              aria-pressed={type === 'Cash'}>
              Cash
            </button>
            <button
              type='button'
              className={`type-toggle__btn${type === 'Tournament' ? ' type-toggle__btn--active' : ''}`}
              onClick={() => setType('Tournament')}
              aria-pressed={type === 'Tournament'}>
              Tournament
            </button>
          </div>
        </div>
        <div className='form-row'>
          <div>
            <label htmlFor='venue'>Venue</label>
            <select
              name='venue'
              id='venue'
              value={venue}
              onChange={e => setVenue(e.target.value)}
              required>
              <option value='Online'>Online</option>
              <option value='Live'>Live</option>
            </select>
          </div>
          <div>
            <label htmlFor='game'>Game</label>
            <select
              name='game'
              id='game'
              value={game}
              onChange={e => setGame(e.target.value)}
              required>
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
            placeholder={
              type === 'Cash'
                ? 'e.g. NL20, NL50, NL100, NL200'
                : 'e.g. Sunday Million, WSOP Event #5, Home Game'
            }
            required
          />
        </div>
      </div>

      {/* Buy-in & Expenses Section */}
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
        {showPnl && (
          <p className={`form-pnl ${pnl >= 0 ? 'amount--pos' : 'amount--neg'}`}>
            {pnl >= 0 ? '+' : ''}
            {pnl.toFixed(2)}
          </p>
        )}
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
                onChange={e => setEnd(e.target.value)}
              />
              <button type='button' className='btn--now' onClick={() => setEnd(getLocalDateTime())}>
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
          placeholder='Add any notes about this session...'></textarea>
      </div>

      <button type='submit'>{buttonText}</button>
    </form>
  )
}

export default CashForm

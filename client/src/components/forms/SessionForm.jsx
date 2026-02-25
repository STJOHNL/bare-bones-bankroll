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
  const { setTransactions } = useBankrollContext()
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
        toast.success('Changes saved')
      }
    } else {
      res = await createSession(formData)
      if (res) {
        const txn = await createTransaction({
          type: 'Buy-in',
          amount: parseFloat(buyin) || 0,
          note: name
        })
        if (txn) setTransactions(prev => [txn, ...prev])
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
      <h2>{type} Session</h2>

      {/* Game Details Section */}
      <div>
        <h3>Game Details</h3>
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
          <label htmlFor='type'>Type</label>
          <select
            name='type'
            id='type'
            value={type}
            onChange={e => setType(e.target.value)}
            required>
            <option value='Cash'>Cash</option>
            <option value='Tournament'>Tournament</option>
          </select>
        </div>
        <div>
          <label htmlFor='game'>Game Type</label>
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
        <div>
          <label htmlFor='name'>Name</label>
          <input
            type='text'
            name='name'
            id='name'
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='Session Name'
            required
          />
        </div>
      </div>

      {/* Buy-in & Expenses Section */}
      <div>
        <h3>Financial Details</h3>
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

      {/* Time Section */}
      <div>
        <h3>Session Time</h3>
        <div>
          <label htmlFor='start'>Start Time</label>
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
          <label htmlFor='end'>End Time</label>
          <input
            type='datetime-local'
            name='end'
            id='end'
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </div>
      </div>

      {/* Notes Section */}
      <div>
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

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt, FaCopy, FaSyncAlt, FaFlagCheckered, FaPlus } from 'react-icons/fa'
import { format } from 'date-fns'
// Components
import SessionTimer from './SessionTimer'
// Utils
import { formatMoney, formatSigned, plColor } from '../utils/money'

const roundCents = n => Math.round(n * 100) / 100

// A running cash game starts with the buy-in still on the table; a running
// tournament has no result until chips are added.
const defaultCashout = session => session.cashout || (session.type === 'Cash' ? session.buyin : 0)

const ActiveSessionCard = ({ session, balance, onUpdate, onDuplicate, onDelete }) => {
  // The cash-out box shows exactly the value that Save/End will submit
  const [cashoutInput, setCashoutInput] = useState(String(defaultCashout(session)))
  const [addInput, setAddInput] = useState('')
  const [rebuyInput, setRebuyInput] = useState('')
  const [rebuyOpen, setRebuyOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const label = session.name
  const cashout = parseFloat(cashoutInput) || 0
  const pnl = cashout - session.buyin
  // Balance already reflects the saved cash-out; project the unsaved difference
  const projected = balance + (cashout - (session.cashout || 0))

  const run = async (changes, successMessage) => {
    setIsSaving(true)
    const res = await onUpdate(session, changes, successMessage)
    setIsSaving(false)
    return res
  }

  const saveCashout = () => run({ cashout: roundCents(cashout) }, 'Cashout updated!')

  const endSession = () => run({ cashout: roundCents(cashout), end: new Date().toISOString() }, 'Session ended!')

  const addToCashout = () => {
    const increment = parseFloat(addInput) || 0
    if (!increment) return
    setCashoutInput(String(roundCents(cashout + increment)))
    setAddInput('')
  }

  const rebuy = async () => {
    const increment = parseFloat(rebuyInput) || 0
    if (!increment) return
    const newBuyin = roundCents(session.buyin + increment)
    // Keep an untouched cash-out box tracking the stack on the table
    const tracksBuyin = cashout === defaultCashout(session) && !session.cashout
    const res = await run({ buyin: newBuyin }, 'Buy-in updated!')
    if (res) {
      if (tracksBuyin) setCashoutInput(String(newBuyin))
      setRebuyInput('')
      setRebuyOpen(false)
    }
  }

  const onEnter = action => e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className='active-session'>
      <div className='active-session__top'>
        <div>
          <span className='active-session__name'>{label}</span>
          <span className='active-session__meta'>
            {session.venue} · {session.type} · {session.game}
          </span>
        </div>
        <div className='active-session__manage'>
          <button
            onClick={() => onDuplicate(session)}
            className='btn btn--subtle'
            title='Duplicate'
            aria-label={`Duplicate ${label}`}>
            <FaCopy className='btn--icon' />
          </button>
          <Link
            to={`/sessions/${session._id}/edit`}
            className='btn btn--subtle'
            title='Edit'
            aria-label={`Edit ${label}`}>
            <FaPencilAlt className='btn--icon' />
          </Link>
          <button
            onClick={() => onDelete(session._id)}
            className='btn btn--subtle'
            title='Delete'
            aria-label={`Delete ${label}`}>
            <FaTrashAlt className='btn--icon--danger' />
          </button>
        </div>
      </div>
      <div className='active-session__info'>
        <span>
          <strong>{formatMoney(session.buyin)}</strong> buy-in ·{' '}
          {session.start ? format(new Date(session.start), 'h:mm a') : '—'}
          {session.start && <SessionTimer start={session.start} />}
        </span>
        {session.type === 'Cash' &&
          (rebuyOpen ? (
            <div className='active-session__rebuy'>
              <input
                type='number'
                value={rebuyInput}
                onChange={e => setRebuyInput(e.target.value)}
                onKeyDown={onEnter(rebuy)}
                placeholder='Rebuy amount'
                step='0.01'
                min='0'
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                aria-label='Rebuy amount'
              />
              <button onClick={rebuy} className='btn btn--subtle' aria-label='Confirm rebuy' disabled={isSaving}>
                <FaPlus className='btn--icon' />
              </button>
              <button onClick={() => setRebuyOpen(false)} className='btn btn--subtle' aria-label='Cancel rebuy'>
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => setRebuyOpen(true)} className='active-session__rebuy-toggle'>
              + rebuy
            </button>
          ))}
      </div>
      <div className='active-session__actions'>
        <input
          type='number'
          value={cashoutInput}
          onChange={e => setCashoutInput(e.target.value)}
          onKeyDown={onEnter(saveCashout)}
          placeholder='Cash out $'
          step='0.01'
          min='0'
          aria-label='Cash out amount'
        />
        {session.type === 'Tournament' && (
          <div className='active-session__add'>
            <input
              type='number'
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              onKeyDown={onEnter(addToCashout)}
              placeholder='+ add'
              step='0.01'
              min='0'
              aria-label='Add to cashout'
            />
            <button
              onClick={addToCashout}
              className='btn btn--subtle'
              title='Add to cashout'
              aria-label='Add amount to cashout'>
              <FaPlus className='btn--icon' />
            </button>
          </div>
        )}
        <span className='active-session__pnl' style={{ color: plColor(pnl) }}>
          {formatSigned(pnl)}
        </span>
        <span className='active-session__projected'>→ {formatMoney(projected)}</span>
        <button
          onClick={saveCashout}
          className='btn btn--subtle'
          title='Update Cashout'
          aria-label='Save cashout'
          disabled={isSaving}>
          <FaSyncAlt className='btn--icon' />
        </button>
        <button
          onClick={endSession}
          className='btn btn--primary'
          title='End Session'
          aria-label='End session'
          disabled={isSaving}>
          <FaFlagCheckered className='btn--icon' />
        </button>
      </div>
    </div>
  )
}

export default ActiveSessionCard

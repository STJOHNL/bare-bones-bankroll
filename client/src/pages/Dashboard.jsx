import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt, FaCopy } from 'react-icons/fa'
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import toast from 'react-hot-toast'
// Custom Hooks
import { useSession } from '../hooks/useSession'
import { useBankroll } from '../hooks/useBankroll'
// Context
import { useBankrollContext } from '../context/BankrollContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'alltime' }
]

const Dashboard = () => {
  const navigate = useNavigate()
  const { getSessions, deleteSession, updateSession } = useSession()
  const { createTransaction } = useBankroll()
  const { setTransactions } = useBankrollContext()

  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [cashoutValues, setCashoutValues] = useState({})
  const [dateFilter, setDateFilter] = useState('alltime')

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      const res = await getSessions()
      setSessions(res || [])
      setIsLoading(false)
    }
    fetchSessions()
  }, [])

  const activeSessions = useMemo(() => sessions.filter(s => !s.end), [sessions])

  const completedSessions = useMemo(() => {
    const done = sessions.filter(s => !!s.end)
    const filtered = dateFilter === 'alltime'
      ? done
      : (() => {
          const now = new Date()
          let cutoff
          if (dateFilter === 'today') cutoff = startOfDay(now)
          else if (dateFilter === 'week') cutoff = startOfWeek(now, { weekStartsOn: 1 })
          else if (dateFilter === 'month') cutoff = startOfMonth(now)
          else if (dateFilter === 'year') cutoff = startOfYear(now)
          return done.filter(s => s.start && new Date(s.start) >= cutoff)
        })()
    return filtered.sort((a, b) => new Date(b.start) - new Date(a.start))
  }, [sessions, dateFilter])

  const totalPL = completedSessions.reduce((sum, s) => sum + (s.cashout - s.buyin), 0)
  const sessionCount = completedSessions.length
  const wins = completedSessions.filter(s => s.cashout - s.buyin > 0).length
  const winRate = sessionCount > 0 ? (wins / sessionCount) * 100 : 0
  const avgPerSession = sessionCount > 0 ? totalPL / sessionCount : 0

  const setCashout = (id, val) => setCashoutValues(prev => ({ ...prev, [id]: val }))

  const handleDelete = async id => {
    if (!window.confirm('Delete this session?')) return
    const res = await deleteSession(id)
    if (res) setSessions(prev => prev.filter(s => s._id !== id))
  }

  const handleEndSession = async session => {
    const cashout = parseFloat(cashoutValues[session._id]) || 0
    const formData = {
      id: session._id,
      venue: session.venue,
      type: session.type,
      game: session.game,
      name: session.name,
      buyin: session.buyin,
      cashout,
      start: session.start,
      end: new Date().toISOString(),
      notes: session.notes || ''
    }
    const res = await updateSession(formData)
    if (res) {
      const txn = await createTransaction({
        type: 'Cash-out',
        amount: cashout,
        note: session.name
      })
      if (txn) setTransactions(prev => [txn, ...prev])
      setSessions(prev => prev.map(s => (s._id === session._id ? res : s)))
      setCashoutValues(prev => {
        const n = { ...prev }
        delete n[session._id]
        return n
      })
      toast.success('Session ended!')
    }
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Dashboard'} />

      {/* History */}
      <div className='date-filter'>
        {DATE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={`date-filter__btn${dateFilter === f.value ? ' date-filter__btn--active' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className='stats'>
        <div className='stat'>
          <p>P/L</p>
          <span
            className='stat__value'
            style={{ color: totalPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
            ${totalPL.toFixed(2)}
          </span>
        </div>
        <div className='stat'>
          <p>Sessions</p>
          <span className='stat__value'>{sessionCount}</span>
        </div>
        <div className='stat'>
          <p>Win Rate</p>
          <span className='stat__value'>{winRate.toFixed(1)}%</span>
        </div>
        <div className='stat'>
          <p>Avg / Session</p>
          <span
            className='stat__value'
            style={{ color: avgPerSession >= 0 ? 'var(--green)' : 'var(--red)' }}>
            ${avgPerSession.toFixed(2)}
          </span>
        </div>
      </div>
      {/* Active Sessions */}
      <div className='active-sessions-header'>
        <h2>Active</h2>
        <Link
          to='/sessions/new'
          className='btn btn--primary'>
          + New Session
        </Link>
      </div>

      {activeSessions.length ? (
        <div className='active-sessions'>
          {activeSessions.map(session => (
            <div
              className='active-session'
              key={session._id}>
              <div className='active-session__top'>
                <span className='active-session__name'>{session.name}</span>
                <span className='active-session__meta'>
                  {session.venue} · {session.type} · {session.game}
                </span>
              </div>
              <div className='active-session__info'>
                <span>
                  Buy-in: <strong>${session.buyin}</strong>
                </span>
                <span>
                  Started: <strong>{session.start ? format(new Date(session.start), 'h:mm a') : '—'}</strong>
                </span>
              </div>
              <div className='active-session__actions'>
                <input
                  type='number'
                  value={cashoutValues[session._id] || ''}
                  onChange={e => setCashout(session._id, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEndSession(session)}
                  placeholder='Cash out $'
                  step='0.01'
                  min='0'
                />
                <button
                  onClick={() => handleEndSession(session)}
                  className='btn btn--primary'>
                  End
                </button>
                <button
                  onClick={() => navigate('/sessions/new', { state: { prefill: session } })}
                  className='btn btn--subtle'
                  title='Duplicate'>
                  <FaCopy className='btn--icon' />
                </button>
                <Link
                  to={`/sessions/${session._id}/edit`}
                  className='btn btn--subtle'
                  title='Edit'>
                  <FaPencilAlt className='btn--icon' />
                </Link>
                <button
                  onClick={() => handleDelete(session._id)}
                  className='btn btn--subtle'
                  title='Delete'>
                  <FaTrashAlt className='btn--icon--danger' />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className='no-active'>No active sessions.</p>
      )}

      <table>
        <thead>
          <tr>
            <th scope='col'>Name</th>
            <th scope='col'>Venue</th>
            <th scope='col'>Type</th>
            <th scope='col'>Game</th>
            <th scope='col'>Buy-in</th>
            <th scope='col'>Cash-out</th>
            <th scope='col'>Profit</th>
            <th scope='col'>Date</th>
            <th scope='col'>Manage</th>
          </tr>
        </thead>
        <tbody>
          {completedSessions.length ? (
            completedSessions.map(session => (
              <tr key={session._id}>
                <td data-label='Name'>{session.name}</td>
                <td data-label='Venue'>{session.venue}</td>
                <td data-label='Type'>{session.type}</td>
                <td data-label='Game'>{session.game}</td>
                <td data-label='Buy-in'>${session.buyin}</td>
                <td data-label='Cash-out'>${session.cashout}</td>
                <td
                  data-label='Profit'
                  style={{ color: session.cashout - session.buyin >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  ${(session.cashout - session.buyin).toFixed(2)}
                </td>
                <td data-label='Date'>{session.start ? format(new Date(session.start), 'MM/dd/yy') : '—'}</td>
                <td data-label='Manage'>
                  <button
                    onClick={() => navigate('/sessions/new', { state: { prefill: session } })}
                    className='btn btn--subtle'
                    title='Duplicate'>
                    <FaCopy className='btn--icon' />
                  </button>
                  <Link
                    to={`/sessions/${session._id}/edit`}
                    className='btn btn--subtle'>
                    <FaPencilAlt className='btn--icon' />
                  </Link>
                  <button
                    onClick={() => handleDelete(session._id)}
                    className='btn btn--subtle'>
                    <FaTrashAlt className='btn--icon--danger' />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9}>No completed sessions.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}

export default Dashboard

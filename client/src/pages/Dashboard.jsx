import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt, FaCopy, FaSyncAlt, FaFlagCheckered, FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import toast from 'react-hot-toast'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
// Custom Hooks
import { useSession } from '../hooks/useSession'
// Context
import { useBankrollContext } from '../context/BankrollContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'

const yesGifs = Object.values(import.meta.glob('../assets/NumGenGifs/yes*.gif', { eager: true, query: '?url', import: 'default' }))
const noGifs = Object.values(import.meta.glob('../assets/NumGenGifs/no*.gif', { eager: true, query: '?url', import: 'default' }))

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
  const { refetchTransactions, balance } = useBankrollContext()

  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [cashoutValues, setCashoutValues] = useState({})
  const [addValues, setAddValues] = useState({})
  const [rebuyValues, setRebuyValues] = useState({})
  const [rebuyOpen, setRebuyOpen] = useState({})
  const [dateFilter, setDateFilter] = useState('week')
  const [rngResult, setRngResult] = useState(null)
  const [rngGif, setRngGif] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [historyOpen, setHistoryOpen] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const rollDecision = useCallback(() => {
    const roll = Math.floor(Math.random() * 100) + 1
    const pool = roll >= 50 ? yesGifs : noGifs
    setRngResult(roll)
    setRngGif(pool[Math.floor(Math.random() * pool.length)])
  }, [])

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

  useEffect(() => {
    if (!activeSessions.length) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeSessions.length])

  const completedSessions = useMemo(() => {
    const done = sessions.filter(s => !!s.end)
    const filtered =
      dateFilter === 'alltime'
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

  // Single-pass reduce avoids iterating completedSessions 4 times for stats
  const { totalPL, sessionCount, wins, totalMinutes } = useMemo(
    () =>
      completedSessions.reduce(
        (acc, s) => {
          const pl = (s.cashout ?? 0) - s.buyin
          acc.totalPL += pl
          acc.sessionCount += 1
          if (pl > 0) acc.wins += 1
          if (s.start && s.end) {
            acc.totalMinutes += (new Date(s.end) - new Date(s.start)) / 60000
          }
          return acc
        },
        { totalPL: 0, sessionCount: 0, wins: 0, totalMinutes: 0 }
      ),
    [completedSessions]
  )
  const winRate = sessionCount > 0 ? (wins / sessionCount) * 100 : 0
  const avgPerSession = sessionCount > 0 ? totalPL / sessionCount : 0
  const hourlyRate = totalMinutes > 0 ? totalPL / (totalMinutes / 60) : null

  const plChartData = useMemo(() => {
    let cumulative = 0
    return [...completedSessions]
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .map(s => {
        cumulative += (s.cashout ?? 0) - s.buyin
        return {
          date: s.start ? format(new Date(s.start), 'MM/dd') : '',
          pl: parseFloat(cumulative.toFixed(2)),
        }
      })
  }, [completedSessions])

  const setCashout = useCallback(
    (id, val) => setCashoutValues(prev => ({ ...prev, [id]: val })),
    []
  )

  // useCallback prevents new function references on every render, avoiding
  // unnecessary re-renders in session list items that receive these as props
  const handleAddToCashout = useCallback(
    session => {
      const increment = parseFloat(addValues[session._id]) || 0
      if (!increment) return
      const current = parseFloat(cashoutValues[session._id] ?? session.cashout) || 0
      setCashoutValues(prev => ({ ...prev, [session._id]: (current + increment).toFixed(2) }))
      setAddValues(prev => ({ ...prev, [session._id]: '' }))
    },
    [addValues, cashoutValues]
  )

  const handleRebuy = useCallback(
    async session => {
      const increment = parseFloat(rebuyValues[session._id]) || 0
      if (!increment) return
      const newBuyin = parseFloat((session.buyin + increment).toFixed(2))
      const formData = {
        id: session._id,
        venue: session.venue,
        type: session.type,
        game: session.game,
        name: session.name,
        buyin: newBuyin,
        cashout: session.cashout || 0,
        start: session.start,
        end: session.end || '',
        notes: session.notes || '',
      }
      const res = await updateSession(formData)
      if (res) {
        await refetchTransactions()
        setSessions(prev => prev.map(s => (s._id === session._id ? res : s)))
        setRebuyValues(prev => ({ ...prev, [session._id]: '' }))
        setRebuyOpen(prev => ({ ...prev, [session._id]: false }))
        toast.success('Buy-in updated!')
      }
    },
    [rebuyValues, updateSession, refetchTransactions]
  )

  const handleDelete = useCallback(
    async id => {
      const res = await deleteSession(id)
      if (res) {
        setSessions(prev => prev.filter(s => s._id !== id))
        await refetchTransactions()
      }
      setDeleteTarget(null)
    },
    [deleteSession, refetchTransactions]
  )

  const handleUpdateCashout = useCallback(
    async session => {
      const cashout = parseFloat(cashoutValues[session._id] ?? session.cashout) || 0
      const formData = {
        id: session._id,
        venue: session.venue,
        type: session.type,
        game: session.game,
        name: session.name,
        buyin: session.buyin,
        cashout,
        start: session.start,
        end: session.end || '',
        notes: session.notes || ''
      }
      const res = await updateSession(formData)
      if (res) {
        await refetchTransactions()
        setSessions(prev => prev.map(s => (s._id === session._id ? res : s)))
        toast.success('Cashout updated!')
      }
    },
    [cashoutValues, updateSession, refetchTransactions]
  )

  const handleEndSession = useCallback(
    async session => {
      const cashout = parseFloat(cashoutValues[session._id] ?? session.cashout) || 0
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
        await refetchTransactions()
        setSessions(prev => prev.map(s => (s._id === session._id ? res : s)))
        setCashoutValues(prev => {
          const n = { ...prev }
          delete n[session._id]
          return n
        })
        toast.success('Session ended!')
      }
    },
    [cashoutValues, updateSession, refetchTransactions]
  )

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
        <div className='stat'>
          <p>Hourly Rate</p>
          <span
            className='stat__value'
            style={{ color: hourlyRate === null ? undefined : hourlyRate >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {hourlyRate === null ? '—' : `$${hourlyRate.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* P/L Chart */}
      {plChartData.length > 1 && (
        <div className='pl-chart'>
          <p className='pl-chart__title'>Cumulative P/L</p>
          <ResponsiveContainer width='100%' height={220}>
            <LineChart data={plChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey='date' tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => `$${v}`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
              <Tooltip
                contentStyle={{ background: 'var(--alt-background)', border: '1px solid #3a3a3a', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                formatter={v => [`$${v.toFixed(2)}`, 'P/L']}
              />
              <ReferenceLine y={0} stroke='rgba(255,255,255,0.15)' strokeDasharray='4 4' />
              <Line
                type='monotone'
                dataKey='pl'
                stroke={plChartData[plChartData.length - 1]?.pl >= 0 ? 'var(--green)' : 'var(--red)'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Play Decision RNG */}
      <div className={`rng-widget${rngResult !== null ? ' rng-widget--expanded' : ''}`}>
        <div className='rng-widget__left'>
          <p>Play Decision</p>
          <button
            className='btn btn--primary'
            onClick={rollDecision}
            aria-label='Roll play decision'>
            Roll
          </button>
        </div>
        <div className='rng-widget__result' aria-live='polite'>
          {rngResult !== null ? (
            <>
              {rngGif && <img src={rngGif} alt='' className='rng-widget__gif' />}
              <span className='rng-widget__number'>{rngResult}</span>
              <span
                className='rng-widget__label'
                style={{ color: rngResult >= 50 ? 'var(--green)' : 'var(--red)' }}>
                {rngResult >= 50 ? 'Aggressive' : 'Passive'}
              </span>
            </>
          ) : (
            <span style={{ opacity: 0.35, fontSize: '0.85rem' }}>—</span>
          )}
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
                <div>
                  <span className='active-session__name'>{session.name}</span>
                  <span className='active-session__meta'>
                    {session.venue} · {session.type} · {session.game}
                  </span>
                </div>
                <div className='active-session__manage'>
                  <button
                    onClick={() => navigate('/sessions/new', { state: { prefill: session } })}
                    className='btn btn--subtle'
                    title='Duplicate'
                    aria-label={`Duplicate ${session.name}`}>
                    <FaCopy className='btn--icon' />
                  </button>
                  <Link
                    to={`/sessions/${session._id}/edit`}
                    className='btn btn--subtle'
                    title='Edit'
                    aria-label={`Edit ${session.name}`}>
                    <FaPencilAlt className='btn--icon' />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(session._id)}
                    className='btn btn--subtle'
                    title='Delete'
                    aria-label={`Delete ${session.name}`}>
                    <FaTrashAlt className='btn--icon--danger' />
                  </button>
                </div>
              </div>
              <div className='active-session__info'>
                <span>
                  <strong>${session.buyin}</strong> buy-in · {session.start ? format(new Date(session.start), 'h:mm a') : '—'}
                  {session.start && (() => {
                    const ms = now - new Date(session.start)
                    const h = Math.floor(ms / 3600000)
                    const m = Math.floor((ms % 3600000) / 60000)
                    const s = Math.floor((ms % 60000) / 1000)
                    return (
                      <span className='active-session__timer'>
                        {h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`}
                      </span>
                    )
                  })()}
                </span>
                {session.type === 'Cash' && (
                  rebuyOpen[session._id] ? (
                    <div className='active-session__rebuy'>
                      <input
                        type='number'
                        value={rebuyValues[session._id] || ''}
                        onChange={e => setRebuyValues(prev => ({ ...prev, [session._id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleRebuy(session)}
                        placeholder='Rebuy amount'
                        step='0.01'
                        min='0'
                        autoFocus
                        aria-label='Rebuy amount'
                      />
                      <button onClick={() => handleRebuy(session)} className='btn btn--subtle' aria-label='Confirm rebuy'>
                        <FaPlus className='btn--icon' />
                      </button>
                      <button onClick={() => setRebuyOpen(prev => ({ ...prev, [session._id]: false }))} className='btn btn--subtle' aria-label='Cancel rebuy'>✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRebuyOpen(prev => ({ ...prev, [session._id]: true }))}
                      className='active-session__rebuy-toggle'>
                      + rebuy
                    </button>
                  )
                )}
              </div>
              <div className='active-session__actions'>
                <input
                  type='number'
                  value={cashoutValues[session._id] ?? (session.cashout || (session.type === 'Cash' ? session.buyin : ''))}
                  onChange={e => setCashout(session._id, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateCashout(session)}
                  placeholder='Cash out $'
                  step='0.01'
                  min='0'
                  aria-label='Cash out amount'
                />
                {session.type === 'Tournament' && (
                  <div className='active-session__add'>
                    <input
                      type='number'
                      value={addValues[session._id] || ''}
                      onChange={e => setAddValues(prev => ({ ...prev, [session._id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddToCashout(session)}
                      placeholder='+ add'
                      step='0.01'
                      min='0'
                      aria-label='Add to cashout'
                    />
                    <button
                      onClick={() => handleAddToCashout(session)}
                      className='btn btn--subtle'
                      title='Add to cashout'
                      aria-label='Add amount to cashout'>
                      <FaPlus className='btn--icon' />
                    </button>
                  </div>
                )}
                {(() => {
                  const inputVal = parseFloat(cashoutValues[session._id] ?? (session.cashout || (session.type === 'Cash' ? session.buyin : 0))) || 0
                  const pnl = inputVal - session.buyin
                  const projected = balance + (inputVal - (session.cashout || 0))
                  return (
                    <>
                      <span
                        className='active-session__pnl'
                        style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                      <span className='active-session__projected'>
                        → ${projected.toFixed(2)}
                      </span>
                    </>
                  )
                })()}
                <button
                  onClick={() => handleUpdateCashout(session)}
                  className='btn btn--subtle'
                  title='Update Cashout'
                  aria-label='Save cashout'>
                  <FaSyncAlt className='btn--icon' />
                </button>
                <button
                  onClick={() => handleEndSession(session)}
                  className='btn btn--primary'
                  title='End Session'
                  aria-label='End session'>
                  <FaFlagCheckered className='btn--icon' />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className='no-active'>No active sessions.</p>
      )}

      <div className='active-sessions-header' style={{ marginTop: '2rem' }}>
        <h2>History</h2>
        <button
          className='btn btn--subtle'
          onClick={() => setHistoryOpen(o => !o)}
          aria-label={historyOpen ? 'Collapse history' : 'Expand history'}>
          {historyOpen ? <FaChevronUp className='btn--icon' /> : <FaChevronDown className='btn--icon' />}
        </button>
      </div>

      {historyOpen && (
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
              <th scope='col'>Notes</th>
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
                  <td data-label='Notes' className='td--notes'>
                    {session.notes ? <span title={session.notes}>{session.notes.length > 30 ? session.notes.slice(0, 30) + '…' : session.notes}</span> : <span style={{ opacity: 0.3 }}>—</span>}
                  </td>
                  <td data-label='Manage'>
                    <button
                      onClick={() => navigate('/sessions/new', { state: { prefill: session } })}
                      className='btn btn--subtle'
                      title='Duplicate'
                      aria-label={`Duplicate ${session.name}`}>
                      <FaCopy className='btn--icon' />
                    </button>
                    <Link
                      to={`/sessions/${session._id}/edit`}
                      className='btn btn--subtle'
                      aria-label={`Edit ${session.name}`}>
                      <FaPencilAlt className='btn--icon' />
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(session._id)}
                      className='btn btn--subtle'
                      aria-label={`Delete ${session.name}`}>
                      <FaTrashAlt className='btn--icon--danger' />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10}>No completed sessions.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {deleteTarget && (
        <ConfirmModal
          message='Delete this session? This cannot be undone.'
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default Dashboard

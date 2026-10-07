import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt, FaCopy } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
// Custom Hooks
import { useSession } from '../hooks/useSession'
// Context
import { useBankrollContext } from '../context/BankrollContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'
import PLChart from '../components/PLChart'
import StatGrid from '../components/StatGrid'
import ActiveSessionCard from '../components/ActiveSessionCard'
// Utils
import { DATE_FILTERS, cumulativeSeries, filterByPeriod, isCompleted, sessionPL, summarize } from '../utils/stats'
import { sessionLabel } from '../utils/stakes'
import { formatMoney, formatPL, plColor } from '../utils/money'
import { rollDecision } from '../utils/rngGifs'

const HISTORY_PREVIEW_SIZE = 5

const truncate = (text, n = 30) => (text.length > n ? `${text.slice(0, n)}…` : text)

const Dashboard = () => {
  const navigate = useNavigate()
  const { getSessions, deleteSession, updateSession } = useSession()
  const { refetchTransactions, balance } = useBankrollContext()

  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [dateFilter, setDateFilter] = useState('week')
  const [decision, setDecision] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      setSessions((await getSessions()) || [])
      setIsLoading(false)
    }
    fetchSessions()
  }, [getSessions])

  const activeSessions = useMemo(() => sessions.filter(s => !isCompleted(s)), [sessions])

  const completedSessions = useMemo(
    () =>
      filterByPeriod(sessions.filter(isCompleted), dateFilter).sort(
        (a, b) => new Date(b.start) - new Date(a.start)
      ),
    [sessions, dateFilter]
  )

  const stats = useMemo(() => summarize(completedSessions), [completedSessions])
  const plChartData = useMemo(() => cumulativeSeries(completedSessions), [completedSessions])

  const handleUpdate = useCallback(
    async (session, changes, successMessage) => {
      const res = await updateSession({ id: session._id, ...changes })
      if (res) {
        setSessions(prev => prev.map(s => (s._id === session._id ? res : s)))
        await refetchTransactions()
        toast.success(successMessage)
      }
      return res
    },
    [updateSession, refetchTransactions]
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

  const duplicate = useCallback(session => navigate('/sessions/new', { state: { prefill: session } }), [navigate])

  const recentSessions = completedSessions.slice(0, HISTORY_PREVIEW_SIZE)

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Dashboard'} />

      <div className='date-filter'>
        {DATE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            aria-pressed={dateFilter === f.value}
            className={`date-filter__btn${dateFilter === f.value ? ' date-filter__btn--active' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>

      <StatGrid
        stats={[
          { label: 'P/L', value: formatPL(stats.totalPL), color: plColor(stats.totalPL) },
          { label: 'Sessions', value: stats.count },
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%` },
          { label: 'Avg / Session', value: formatPL(stats.avgPerSession), color: plColor(stats.avgPerSession) },
          {
            label: 'Hourly Rate',
            value: stats.hourlyRate === null ? '—' : formatPL(stats.hourlyRate),
            color: stats.hourlyRate === null ? undefined : plColor(stats.hourlyRate),
          },
        ]}
      />

      <PLChart data={plChartData} />

      {/* Play Decision RNG */}
      <div className={`rng-widget${decision ? ' rng-widget--expanded' : ''}`}>
        <div className='rng-widget__left'>
          <p>Play Decision</p>
          <button className='btn btn--primary' onClick={() => setDecision(rollDecision())} aria-label='Roll play decision'>
            Roll
          </button>
        </div>
        <div className='rng-widget__result' aria-live='polite'>
          {decision ? (
            <>
              {decision.gif && <img src={decision.gif} alt='' className='rng-widget__gif' />}
              <span className='rng-widget__number'>{decision.roll}</span>
              <span className='rng-widget__label' style={{ color: decision.aggressive ? 'var(--green)' : 'var(--red)' }}>
                {decision.aggressive ? 'Aggressive' : 'Passive'}
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
        <Link to='/sessions/new' className='btn btn--primary'>
          + New Session
        </Link>
      </div>

      {activeSessions.length ? (
        <div className='active-sessions'>
          {activeSessions.map(session => (
            <ActiveSessionCard
              key={session._id}
              session={session}
              balance={balance}
              onUpdate={handleUpdate}
              onDuplicate={duplicate}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <div className='empty-state'>
          <span className='empty-state__title'>No active sessions</span>
          <Link to='/sessions/new' className='btn btn--primary'>
            + Start a Session
          </Link>
        </div>
      )}

      <div className='active-sessions-header' style={{ marginTop: '2rem' }}>
        <h2>History</h2>
        <Link to='/history' className='btn btn--subtle'>
          View all
        </Link>
      </div>

      <div className='table-responsive'>
        <table className='table--sessions'>
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
            {recentSessions.length > 0 ? (
              recentSessions.map(session => {
                const label = sessionLabel(session)
                const pl = sessionPL(session)
                return (
                  <tr key={session._id}>
                    <td data-label='Name'>{label}</td>
                    <td data-label='Venue'>{session.venue}</td>
                    <td data-label='Type'>{session.type}</td>
                    <td data-label='Game'>{session.game}</td>
                    <td data-label='Buy-in'>{formatMoney(session.buyin)}</td>
                    <td data-label='Cash-out'>{formatMoney(session.cashout)}</td>
                    <td data-label='Profit' style={{ color: plColor(pl) }}>
                      {formatPL(pl)}
                    </td>
                    <td data-label='Date'>{session.start ? format(new Date(session.start), 'MM/dd/yy') : '—'}</td>
                    <td data-label='Notes' className='td--notes'>
                      {session.notes ? (
                        <span title={session.notes}>{truncate(session.notes)}</span>
                      ) : (
                        <span style={{ opacity: 0.3 }}>—</span>
                      )}
                    </td>
                    <td data-label='Manage'>
                      <button
                        onClick={() => duplicate(session)}
                        className='btn btn--subtle'
                        title='Duplicate'
                        aria-label={`Duplicate ${label}`}>
                        <FaCopy className='btn--icon' />
                      </button>
                      <Link
                        to={`/sessions/${session._id}/edit`}
                        className='btn btn--subtle'
                        aria-label={`Edit ${label}`}>
                        <FaPencilAlt className='btn--icon' />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(session._id)}
                        className='btn btn--subtle'
                        aria-label={`Delete ${label}`}>
                        <FaTrashAlt className='btn--icon--danger' />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>
                  {dateFilter === 'alltime' ? 'No sessions recorded yet.' : 'No sessions for this period.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { useSession } from '../hooks/useSession'
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import PLChart from '../components/PLChart'
import StatGrid from '../components/StatGrid'
import {
  breakdownBy,
  byDayOfWeek,
  cumulativeSeries,
  isCompleted,
  sessionPL,
  streaks as computeStreaks,
  summarize,
  topSessions as computeTopSessions,
} from '../utils/stats'
import { formatMoney, formatPL, plColor } from '../utils/money'

const SessionsTable = ({ rows }) => (
  <div className='table-responsive'>
    <table>
      <thead>
        <tr>
          <th scope='col'>Name</th>
          <th scope='col'>Date</th>
          <th scope='col'>Buy-in</th>
          <th scope='col'>Cash-out</th>
          <th scope='col'>Profit</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(s => (
          <tr key={s._id}>
            <td data-label='Name'>{s.name}</td>
            <td data-label='Date'>{s.start ? format(new Date(s.start), 'MM/dd/yy') : '—'}</td>
            <td data-label='Buy-in'>{formatMoney(s.buyin)}</td>
            <td data-label='Cash-out'>{formatMoney(s.cashout)}</td>
            <td data-label='Profit' style={{ color: plColor(sessionPL(s)) }}>
              {formatPL(sessionPL(s))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const Reports = () => {
  const { getSessions } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [nameFilter, setNameFilter] = useState('')

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      setSessions((await getSessions()) || [])
      setIsLoading(false)
    }
    fetchSessions()
  }, [getSessions])

  const allCompleted = useMemo(() => sessions.filter(isCompleted), [sessions])

  // Distinct tournament names / cash stakes played, for the query datalist
  const uniqueNames = useMemo(
    () => Array.from(new Set(allCompleted.map(s => s.name).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [allCompleted]
  )

  const completed = useMemo(() => {
    const q = nameFilter.trim().toLowerCase()
    if (!q) return allCompleted
    return allCompleted.filter(s => s.name?.toLowerCase().includes(q))
  }, [allCompleted, nameFilter])

  const summary = useMemo(() => summarize(completed), [completed])
  const plChartData = useMemo(() => cumulativeSeries(completed), [completed])
  const breakdown = useMemo(
    () => ({
      venue: breakdownBy(completed, s => s.venue),
      type: breakdownBy(completed, s => s.type),
      game: breakdownBy(completed, s => s.game),
    }),
    [completed]
  )
  const streaks = useMemo(() => computeStreaks(completed), [completed])
  const byDay = useMemo(() => byDayOfWeek(completed), [completed])
  const top = useMemo(() => computeTopSessions(completed), [completed])

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title='Reports' />

      {allCompleted.length === 0 ? (
        <div className='empty-state'>
          <span className='empty-state__title'>No data yet</span>
          <span className='empty-state__desc'>Complete some sessions to see your reports here.</span>
        </div>
      ) : (
        <>
          {/* Query by tournament name / cash stake */}
          <div className='filter-form' style={{ marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor='nameFilter'>Stake / Tournament</label>
              <input
                list='session-names'
                type='text'
                id='nameFilter'
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                placeholder='e.g. NL50, Sunday Million'
              />
              <datalist id='session-names'>
                {uniqueNames.map(n => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            {nameFilter && (
              <button type='button' className='btn btn--subtle' onClick={() => setNameFilter('')}>
                Clear
              </button>
            )}
          </div>

          {completed.length === 0 ? (
            <div className='empty-state'>
              <span className='empty-state__title'>No matching sessions</span>
              <span className='empty-state__desc'>
                No sessions found for &quot;{nameFilter}&quot;. Try a different stake or tournament name.
              </span>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <PLChart data={plChartData} />
              </div>

              <StatGrid
                style={{ marginBottom: '2rem' }}
                stats={[
                  { label: 'Total P/L', value: formatPL(summary.totalPL), color: plColor(summary.totalPL) },
                  { label: 'Sessions', value: summary.count },
                  { label: 'Win Rate', value: `${summary.winRate.toFixed(1)}%` },
                  { label: 'Avg / Session', value: formatPL(summary.avgPerSession), color: plColor(summary.avgPerSession) },
                  {
                    label: 'Hourly Rate',
                    value: summary.hourlyRate !== null ? formatPL(summary.hourlyRate) : '—',
                    color: summary.hourlyRate !== null ? plColor(summary.hourlyRate) : undefined,
                  },
                  { label: 'Hours Played', value: `${summary.hours.toFixed(1)}h`, hint: 'overlapping tables count once' },
                ]}
              />

              <h2 style={{ marginBottom: '0.75rem' }}>Breakdown</h2>
              <div className='reports-breakdowns'>
                {[
                  { title: 'By Venue', rows: breakdown.venue },
                  { title: 'By Type', rows: breakdown.type },
                  { title: 'By Game', rows: breakdown.game },
                ].map(({ title, rows }) => (
                  <div className='reports-breakdown' key={title}>
                    <h3 className='reports-breakdown__title'>{title}</h3>
                    <table>
                      <thead>
                        <tr>
                          <th scope='col'>
                            <span className='visually-hidden'>Group</span>
                          </th>
                          <th scope='col'>Sessions</th>
                          <th scope='col'>P/L</th>
                          <th scope='col'>Win %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.label}>
                            <td data-label=''>{r.label}</td>
                            <td data-label='Sessions'>{r.count}</td>
                            <td data-label='P/L' style={{ color: plColor(r.totalPL) }}>
                              {formatPL(r.totalPL)}
                            </td>
                            <td data-label='Win %'>{r.winRate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              <h2 style={{ margin: '2rem 0 0.75rem' }}>Streaks</h2>
              <StatGrid
                stats={[
                  {
                    label: 'Current',
                    value: streaks.current > 0 ? `${streaks.current}W` : streaks.current < 0 ? `${-streaks.current}L` : '—',
                    color: plColor(streaks.current),
                  },
                  { label: 'Longest Win Streak', value: `${streaks.longestWin}W`, color: 'var(--green)' },
                  { label: 'Longest Loss Streak', value: `${streaks.longestLoss}L`, color: 'var(--red)' },
                ]}
              />

              <h2 style={{ margin: '2rem 0 0.75rem' }}>By Day of Week</h2>
              <div className='table-responsive'>
                <table>
                  <thead>
                    <tr>
                      <th scope='col'>Day</th>
                      <th scope='col'>Sessions</th>
                      <th scope='col'>P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDay
                      .filter(d => d.count > 0)
                      .map(d => (
                        <tr key={d.day}>
                          <td data-label='Day'>{d.day}</td>
                          <td data-label='Sessions'>{d.count}</td>
                          <td data-label='P/L' style={{ color: plColor(d.pl) }}>
                            {formatPL(d.pl)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <h2 style={{ margin: '2rem 0 0.75rem' }}>Best Sessions</h2>
              {top.best.length ? <SessionsTable rows={top.best} /> : <p className='form-hint'>No winning sessions yet.</p>}

              <h2 style={{ margin: '2rem 0 0.75rem' }}>Worst Sessions</h2>
              {top.worst.length ? <SessionsTable rows={top.worst} /> : <p className='form-hint'>No losing sessions yet.</p>}
            </>
          )}
        </>
      )}
    </>
  )
}

export default Reports

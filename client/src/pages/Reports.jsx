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
  stakesBreakdown,
  streaks as computeStreaks,
  summarize,
  topSessions as computeTopSessions,
} from '../utils/stats'
import { sessionLabel } from '../utils/stakes'
import { formatMoney, formatPL, plColor } from '../utils/money'

const formatBb100 = bb100 => (bb100 ? `${bb100.value >= 0 ? '+' : ''}${bb100.value.toFixed(1)}` : '—')

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
            <td data-label='Name'>{sessionLabel(s)}</td>
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
  const [labelFilter, setLabelFilter] = useState('All')

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      setSessions((await getSessions()) || [])
      setIsLoading(false)
    }
    fetchSessions()
  }, [getSessions])

  const allCompleted = useMemo(() => sessions.filter(isCompleted), [sessions])

  // Distinct stakes (cash) and tournament names, for the filter
  const labels = useMemo(() => {
    const cash = new Set()
    const tournaments = new Set()
    for (const s of allCompleted) (s.type === 'Cash' ? cash : tournaments).add(sessionLabel(s))
    const byBb = (a, b) => parseFloat(a.replace(/^\D+/, '')) - parseFloat(b.replace(/^\D+/, '')) || a.localeCompare(b)
    return { cash: [...cash].sort(byBb), tournaments: [...tournaments].sort((a, b) => a.localeCompare(b)) }
  }, [allCompleted])

  const completed = useMemo(
    () => (labelFilter === 'All' ? allCompleted : allCompleted.filter(s => sessionLabel(s) === labelFilter)),
    [allCompleted, labelFilter]
  )

  const summary = useMemo(() => summarize(completed), [completed])
  const plChartData = useMemo(() => cumulativeSeries(completed), [completed])
  const stakes = useMemo(() => stakesBreakdown(completed), [completed])
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
          <div className='filter-form' style={{ marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor='labelFilter'>Stakes / Tournament</label>
              <select id='labelFilter' value={labelFilter} onChange={e => setLabelFilter(e.target.value)}>
                <option value='All'>All sessions</option>
                {labels.cash.length > 0 && (
                  <optgroup label='Cash stakes'>
                    {labels.cash.map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </optgroup>
                )}
                {labels.tournaments.length > 0 && (
                  <optgroup label='Tournaments'>
                    {labels.tournaments.map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {labelFilter !== 'All' && (
              <button type='button' className='btn btn--subtle' onClick={() => setLabelFilter('All')}>
                Clear
              </button>
            )}
          </div>

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
              ...(summary.bb100
                ? [
                    {
                      label: 'bb/100',
                      value: formatBb100(summary.bb100),
                      color: plColor(summary.bb100.value),
                      hint: `${summary.bb100.hands.toLocaleString()} hands`,
                    },
                  ]
                : []),
            ]}
          />

          {stakes.length > 0 && (
            <>
              <h2 style={{ marginBottom: '0.75rem' }}>By Stakes</h2>
              <div className='table-responsive' style={{ marginBottom: '2rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th scope='col'>Stakes</th>
                      <th scope='col'>Sessions</th>
                      <th scope='col'>P/L</th>
                      <th scope='col'>Hourly</th>
                      <th scope='col'>bb/100</th>
                      <th scope='col'>Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakes.map(r => (
                      <tr key={r.label}>
                        <td data-label='Stakes'>{r.label}</td>
                        <td data-label='Sessions'>{r.count}</td>
                        <td data-label='P/L' style={{ color: plColor(r.totalPL) }}>
                          {formatPL(r.totalPL)}
                        </td>
                        <td data-label='Hourly'>{r.hourlyRate !== null ? formatPL(r.hourlyRate) : '—'}</td>
                        <td data-label='bb/100'>{formatBb100(r.bb100)}</td>
                        <td data-label='Win %'>{r.winRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

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
  )
}

export default Reports

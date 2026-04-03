import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { useSession } from '../hooks/useSession'
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const Reports = () => {
  const { getSessions } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      const res = await getSessions()
      setSessions(res || [])
      setIsLoading(false)
    }
    fetch()
  }, [])

  const completed = useMemo(() => sessions.filter(s => !!s.end), [sessions])

  // ── All-time summary ──────────────────────────────────────────────────────
  const summary = useMemo(() => {
    return completed.reduce(
      (acc, s) => {
        const pl = (s.cashout ?? 0) - s.buyin
        acc.totalPL += pl
        acc.count += 1
        if (pl > 0) acc.wins += 1
        if (s.start && s.end) acc.totalMinutes += (new Date(s.end) - new Date(s.start)) / 60000
        if (pl > acc.bestPL) { acc.bestPL = pl; acc.best = s }
        if (pl < acc.worstPL) { acc.worstPL = pl; acc.worst = s }
        return acc
      },
      { totalPL: 0, count: 0, wins: 0, totalMinutes: 0, bestPL: -Infinity, worstPL: Infinity, best: null, worst: null }
    )
  }, [completed])

  const winRate = summary.count > 0 ? (summary.wins / summary.count) * 100 : 0
  const avgPerSession = summary.count > 0 ? summary.totalPL / summary.count : 0
  const hourlyRate = summary.totalMinutes > 0 ? summary.totalPL / (summary.totalMinutes / 60) : null
  const totalHours = summary.totalMinutes / 60

  // ── Breakdown by category ────────────────────────────────────────────────
  const breakdown = useMemo(() => {
    const compute = key => {
      const map = {}
      for (const s of completed) {
        const k = s[key]
        if (!map[k]) map[k] = { label: k, count: 0, pl: 0, wins: 0 }
        const pl = (s.cashout ?? 0) - s.buyin
        map[k].count += 1
        map[k].pl += pl
        if (pl > 0) map[k].wins += 1
      }
      return Object.values(map)
    }
    return {
      venue: compute('venue'),
      type: compute('type'),
      game: compute('game'),
    }
  }, [completed])

  // ── Streaks ───────────────────────────────────────────────────────────────
  const streaks = useMemo(() => {
    const sorted = [...completed].sort((a, b) => new Date(a.start) - new Date(b.start))
    let currentStreak = 0, longestWin = 0, longestLoss = 0, cur = 0, curType = null
    for (const s of sorted) {
      const win = (s.cashout ?? 0) - s.buyin > 0
      if (curType === null) { curType = win; cur = 1 }
      else if (win === curType) { cur++ }
      else { curType = win; cur = 1 }
      if (win && cur > longestWin) longestWin = cur
      if (!win && cur > longestLoss) longestLoss = cur
    }
    // current streak = last N sessions in same direction
    if (sorted.length) {
      const lastWin = (sorted[sorted.length - 1].cashout ?? 0) - sorted[sorted.length - 1].buyin > 0
      let streak = 0
      for (let i = sorted.length - 1; i >= 0; i--) {
        const w = (sorted[i].cashout ?? 0) - sorted[i].buyin > 0
        if (w === lastWin) streak++
        else break
      }
      currentStreak = lastWin ? streak : -streak
    }
    return { currentStreak, longestWin, longestLoss }
  }, [completed])

  // ── By day of week ────────────────────────────────────────────────────────
  const byDay = useMemo(() => {
    const days = DAYS.map(d => ({ day: d, count: 0, pl: 0 }))
    for (const s of completed) {
      if (s.start) {
        const d = new Date(s.start).getDay()
        days[d].count += 1
        days[d].pl += (s.cashout ?? 0) - s.buyin
      }
    }
    return days
  }, [completed])

  // ── Top sessions ─────────────────────────────────────────────────────────
  const topSessions = useMemo(() => {
    const sorted = [...completed].sort((a, b) => ((b.cashout ?? 0) - b.buyin) - ((a.cashout ?? 0) - a.buyin))
    return { best: sorted.slice(0, 3), worst: sorted.slice(-3).reverse() }
  }, [completed])

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title='Reports' />
      <h1 style={{ marginBottom: '1.5rem' }}>Reports</h1>

      {completed.length === 0 ? (
        <p style={{ opacity: 0.5 }}>No completed sessions yet.</p>
      ) : (
        <>
          {/* Summary Stats */}
          <div className='stats' style={{ marginBottom: '2rem' }}>
            {[
              { label: 'Total P/L', value: `$${summary.totalPL.toFixed(2)}`, color: summary.totalPL >= 0 ? 'var(--green)' : 'var(--red)' },
              { label: 'Sessions', value: summary.count },
              { label: 'Win Rate', value: `${winRate.toFixed(1)}%` },
              { label: 'Avg / Session', value: `$${avgPerSession.toFixed(2)}`, color: avgPerSession >= 0 ? 'var(--green)' : 'var(--red)' },
              { label: 'Hourly Rate', value: hourlyRate !== null ? `$${hourlyRate.toFixed(2)}` : '—', color: hourlyRate !== null ? (hourlyRate >= 0 ? 'var(--green)' : 'var(--red)') : undefined },
              { label: 'Total Hours', value: `${totalHours.toFixed(1)}h` },
            ].map(({ label, value, color }) => (
              <div className='stat' key={label}>
                <p>{label}</p>
                <span className='stat__value' style={{ color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
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
                      <th scope='col'></th>
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
                        <td data-label='P/L' style={{ color: r.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          ${r.pl.toFixed(2)}
                        </td>
                        <td data-label='Win %'>{r.count > 0 ? ((r.wins / r.count) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Streaks */}
          <h2 style={{ margin: '2rem 0 0.75rem' }}>Streaks</h2>
          <div className='stats'>
            <div className='stat'>
              <p>Current</p>
              <span className='stat__value' style={{ color: streaks.currentStreak >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {streaks.currentStreak > 0 ? `+${streaks.currentStreak}W` : streaks.currentStreak < 0 ? `${Math.abs(streaks.currentStreak)}L` : '—'}
              </span>
            </div>
            <div className='stat'>
              <p>Longest Win Streak</p>
              <span className='stat__value' style={{ color: 'var(--green)' }}>{streaks.longestWin}W</span>
            </div>
            <div className='stat'>
              <p>Longest Loss Streak</p>
              <span className='stat__value' style={{ color: 'var(--red)' }}>{streaks.longestLoss}L</span>
            </div>
          </div>

          {/* By Day of Week */}
          <h2 style={{ margin: '2rem 0 0.75rem' }}>By Day of Week</h2>
          <table>
            <thead>
              <tr>
                <th scope='col'>Day</th>
                <th scope='col'>Sessions</th>
                <th scope='col'>P/L</th>
              </tr>
            </thead>
            <tbody>
              {byDay.filter(d => d.count > 0).map(d => (
                <tr key={d.day}>
                  <td data-label='Day'>{d.day}</td>
                  <td data-label='Sessions'>{d.count}</td>
                  <td data-label='P/L' style={{ color: d.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    ${d.pl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Top Sessions */}
          <h2 style={{ margin: '2rem 0 0.75rem' }}>Best Sessions</h2>
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
              {topSessions.best.map(s => (
                <tr key={s._id}>
                  <td data-label='Name'>{s.name}</td>
                  <td data-label='Date'>{s.start ? format(new Date(s.start), 'MM/dd/yy') : '—'}</td>
                  <td data-label='Buy-in'>${s.buyin}</td>
                  <td data-label='Cash-out'>${s.cashout}</td>
                  <td data-label='Profit' style={{ color: 'var(--green)' }}>+${((s.cashout ?? 0) - s.buyin).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ margin: '2rem 0 0.75rem' }}>Worst Sessions</h2>
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
              {topSessions.worst.map(s => (
                <tr key={s._id}>
                  <td data-label='Name'>{s.name}</td>
                  <td data-label='Date'>{s.start ? format(new Date(s.start), 'MM/dd/yy') : '—'}</td>
                  <td data-label='Buy-in'>${s.buyin}</td>
                  <td data-label='Cash-out'>${s.cashout}</td>
                  <td data-label='Profit' style={{ color: 'var(--red)' }}>${((s.cashout ?? 0) - s.buyin).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}

export default Reports

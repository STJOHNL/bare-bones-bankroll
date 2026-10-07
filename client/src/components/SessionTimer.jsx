import { useEffect, useState } from 'react'

// Live elapsed time for an active session. Ticks on its own so the rest of
// the dashboard doesn't re-render every second.
const SessionTimer = ({ start }) => {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const ms = Math.max(0, now - new Date(start))
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)

  return <span className='active-session__timer'>{h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`}</span>
}

export default SessionTimer

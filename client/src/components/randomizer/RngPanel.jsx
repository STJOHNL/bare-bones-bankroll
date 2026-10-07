import { useState, useEffect, useCallback, useRef } from 'react'
import { rollDecision } from '../../utils/rngGifs'

const RngPanel = () => {
  const [rngResult, setRngResult] = useState(null)
  const [rngGif, setRngGif] = useState(null)
  const [rolling, setRolling] = useState(false)
  const spinIntervalRef = useRef(null)
  const spinTimeoutRef = useRef(null)

  const roll = useCallback(() => {
    setRolling(true)
    setRngGif(null)

    clearInterval(spinIntervalRef.current)
    clearTimeout(spinTimeoutRef.current)

    // Rapidly cycle the number to give the impression of it spinning/randomizing
    spinIntervalRef.current = setInterval(() => {
      setRngResult(Math.floor(Math.random() * 100) + 1)
    }, 40)

    spinTimeoutRef.current = setTimeout(() => {
      clearInterval(spinIntervalRef.current)
      const { roll: n, gif } = rollDecision()
      setRngResult(n)
      setRngGif(gif)
      setRolling(false)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(spinIntervalRef.current)
      clearTimeout(spinTimeoutRef.current)
    }
  }, [])

  const isAggressive = rngResult !== null && rngResult >= 50

  return (
    <div className='rng-panel'>
      <p className='rng-panel__label'>Play Decision</p>
      <button
        className={`rng-panel__roll-btn${rolling ? ' rng-panel__roll-btn--rolling' : ''}`}
        onClick={roll}
        disabled={rolling}>
        Roll
      </button>

      <div className='rng-panel__result' aria-live='polite'>
        <div className='rng-panel__gif-wrap'>{rngGif && <img src={rngGif} alt='' className='rng-panel__gif' />}</div>
        <div
          className='rng-panel__verdict'
          style={{
            color: !rolling && rngResult !== null ? (isAggressive ? 'var(--green)' : 'var(--red)') : undefined,
          }}>
          <span className='rng-panel__number'>{rngResult !== null ? rngResult : '—'}</span>
          <span className='rng-panel__tag'>
            {!rolling && rngResult !== null ? (isAggressive ? 'Aggressive' : 'Passive') : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default RngPanel

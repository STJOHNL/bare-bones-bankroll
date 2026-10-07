import { useState } from 'react'

const Field = ({ id, label, optional, ...inputProps }) => (
  <div className='chip-calc__field'>
    <label htmlFor={id}>
      {label}
      {optional && (
        <>
          {' '}
          <span className='chip-calc__optional-label'>(optional)</span>
        </>
      )}
    </label>
    <input id={id} type='number' step='1' {...inputProps} />
  </div>
)

const ChipStackCalculator = () => {
  const [entries, setEntries] = useState('')
  const [startStack, setStartStack] = useState('')
  const [target, setTarget] = useState('')
  const [currentPlayers, setCurrentPlayers] = useState('')
  const [currentStack, setCurrentStack] = useState('')

  const calc = (() => {
    const n = parseInt(entries, 10)
    const start = parseInt(startStack, 10)
    const t = parseInt(target, 10)
    if (!n || !start || !t || t >= n) return null
    const total = n * start
    const avgAtTarget = Math.round(total / t)
    const players = parseInt(currentPlayers, 10) || null
    const myStack = currentStack !== '' ? parseInt(currentStack, 10) : null
    const currentAvg = players && players < n ? Math.round(total / players) : null
    return {
      total,
      avgAtTarget,
      comfortable: Math.round(avgAtTarget * 2),
      danger: Math.round(avgAtTarget * 0.5),
      currentAvg,
      myStack,
      gap: myStack !== null ? avgAtTarget - myStack : null,
    }
  })()

  return (
    <div className='chip-calc'>
      <p className='chip-calc__title'>Chip Stack Calculator</p>

      <div className='chip-calc__inputs'>
        <Field id='chip-entries' label='Total Entries' value={entries} onChange={e => setEntries(e.target.value)} placeholder='100' min='2' />
        <Field id='chip-start' label='Starting Stack' value={startStack} onChange={e => setStartStack(e.target.value)} placeholder='10000' min='1' />
        <Field id='chip-target' label='Target Players Left' value={target} onChange={e => setTarget(e.target.value)} placeholder='9' min='1' />
      </div>

      <div className='chip-calc__inputs' style={{ marginTop: '0.75rem' }}>
        <Field
          id='chip-current-players'
          label='Current Players Left'
          optional
          value={currentPlayers}
          onChange={e => setCurrentPlayers(e.target.value)}
          placeholder='—'
          min='1'
        />
        <Field
          id='chip-current-stack'
          label='Your Stack'
          optional
          value={currentStack}
          onChange={e => setCurrentStack(e.target.value)}
          placeholder='—'
          min='0'
        />
      </div>

      {calc && (
        <>
          <hr className='chip-calc__divider' />
          <p className='chip-calc__total'>
            Total chips in play: <strong>{calc.total.toLocaleString()}</strong>
          </p>
          <div className='chip-calc__results'>
            <div className='chip-calc__result'>
              <span className='chip-calc__result-label'>Average at {target} left</span>
              <span className='chip-calc__result-value'>{calc.avgAtTarget.toLocaleString()}</span>
              <span className='chip-calc__result-hint'>target average stack</span>
            </div>
            <div className='chip-calc__result'>
              <span className='chip-calc__result-label'>Comfortable</span>
              <span className='chip-calc__result-value' style={{ color: 'var(--green)' }}>
                {calc.comfortable.toLocaleString()}
              </span>
              <span className='chip-calc__result-hint'>~2× average</span>
            </div>
            <div className='chip-calc__result'>
              <span className='chip-calc__result-label'>Danger Zone</span>
              <span className='chip-calc__result-value' style={{ color: 'var(--red)' }}>
                {calc.danger.toLocaleString()}
              </span>
              <span className='chip-calc__result-hint'>≤ 0.5× average</span>
            </div>
          </div>

          {(calc.currentAvg !== null || calc.myStack !== null) && (
            <div className='chip-calc__meta'>
              {calc.currentAvg !== null && (
                <span className='chip-calc__meta-item'>
                  Current avg: <strong>{calc.currentAvg.toLocaleString()}</strong>
                </span>
              )}
              {calc.myStack !== null && calc.currentAvg !== null && (
                <span className='chip-calc__meta-item'>
                  You vs current avg:{' '}
                  <strong style={{ color: calc.myStack >= calc.currentAvg ? 'var(--green)' : 'var(--red)' }}>
                    {calc.myStack >= calc.currentAvg ? '+' : ''}
                    {(calc.myStack - calc.currentAvg).toLocaleString()}
                  </strong>
                </span>
              )}
              {calc.gap !== null && (
                <span className='chip-calc__meta-item'>
                  {calc.gap > 0 ? (
                    <>
                      Chips needed to reach target avg:{' '}
                      <strong style={{ color: 'var(--red)' }}>+{calc.gap.toLocaleString()}</strong>
                    </>
                  ) : (
                    <>
                      Surplus above target avg:{' '}
                      <strong style={{ color: 'var(--green)' }}>+{Math.abs(calc.gap).toLocaleString()}</strong>
                    </>
                  )}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ChipStackCalculator

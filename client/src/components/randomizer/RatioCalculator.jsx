import { useState } from 'react'

const RatioCalculator = () => {
  const [ratioA, setRatioA] = useState('')
  const [ratioB, setRatioB] = useState('')

  const a = parseFloat(ratioA)
  const b = parseFloat(ratioB)
  const total = a + b
  const calc = a > 0 && b > 0 ? { percentA: (a / total) * 100, percentB: (b / total) * 100 } : null

  return (
    <div className='ratio-calc'>
      <p className='ratio-calc__title'>Ratio to Percentage</p>
      <div className='ratio-calc__inputs'>
        <div className='ratio-calc__field'>
          <label htmlFor='ratio-a'>Ratio A</label>
          <input
            id='ratio-a'
            type='number'
            value={ratioA}
            onChange={e => setRatioA(e.target.value)}
            placeholder='3'
            min='0'
            step='1'
          />
        </div>
        <span className='ratio-calc__separator'>:</span>
        <div className='ratio-calc__field'>
          <label htmlFor='ratio-b'>Ratio B</label>
          <input
            id='ratio-b'
            type='number'
            value={ratioB}
            onChange={e => setRatioB(e.target.value)}
            placeholder='1'
            min='0'
            step='1'
          />
        </div>
      </div>

      {calc && (
        <div className='ratio-calc__results'>
          <div className='ratio-calc__result'>
            <span className='ratio-calc__result-label'>A of Total</span>
            <span className='ratio-calc__result-value'>{calc.percentA.toFixed(1)}%</span>
            <span className='ratio-calc__result-hint'>
              {ratioA} in {total}
            </span>
          </div>
          <div className='ratio-calc__result'>
            <span className='ratio-calc__result-label'>B of Total</span>
            <span className='ratio-calc__result-value'>{calc.percentB.toFixed(1)}%</span>
            <span className='ratio-calc__result-hint'>
              {ratioB} in {total}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RatioCalculator

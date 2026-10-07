import { useState } from 'react'

// Equity needed to call `bet` into `pot` (pot measured before the bet)
const potOdds =(pot, bet) => (bet / (pot + bet * 2)) * 100

const Verdict = ({ label, equity, needed }) => {
  const color = equity >= needed ? 'var(--green)' : 'var(--red)'
  return (
    <div className='pot-odds__result'>
      <span className='pot-odds__result-label'>{label}</span>
      <span className='pot-odds__result-value' style={{ color }}>
        {equity}%
      </span>
      <span className='pot-odds__result-verdict' style={{ color }}>
        {equity >= needed ? 'Call' : 'Fold'}
      </span>
    </div>
  )
}

const PotOddsCalculator = () => {
  const [pot, setPot] = useState('')
  const [bet, setBet] = useState('')
  const [outs, setOuts] = useState('')

  const p = parseFloat(pot)
  const b = parseFloat(bet)
  const o = parseInt(outs, 10)
  const calc =
    p && b
      ? {
          potOdds: potOdds(p, b),
          // Rule of 2 and 4
          turnEquity: o > 0 ? o * 2 : null,
          flopEquity: o > 0 ? Math.min(o * 4, 100) : null,
        }
      : null

  return (
    <div className='pot-odds'>
      <p className='pot-odds__title'>Pot Odds Calculator</p>
      <div className='pot-odds__inputs'>
        <div className='pot-odds__field'>
          <label htmlFor='pot-odds-pot'>Pot</label>
          <div className='pot-odds__input-wrap'>
            <span>$</span>
            <input
              id='pot-odds-pot'
              type='number'
              value={pot}
              onChange={e => setPot(e.target.value)}
              placeholder='0'
              min='0'
              step='0.01'
            />
          </div>
        </div>
        <div className='pot-odds__field'>
          <label htmlFor='pot-odds-bet'>Bet</label>
          <div className='pot-odds__input-wrap'>
            <span>$</span>
            <input
              id='pot-odds-bet'
              type='number'
              value={bet}
              onChange={e => setBet(e.target.value)}
              placeholder='0'
              min='0'
              step='0.01'
            />
          </div>
        </div>
        <div className='pot-odds__field'>
          <label htmlFor='pot-odds-outs'>Outs</label>
          <input
            id='pot-odds-outs'
            type='number'
            value={outs}
            onChange={e => setOuts(e.target.value)}
            placeholder='0'
            min='0'
            max='47'
            step='1'
          />
        </div>
      </div>

      {calc && (
        <div className='pot-odds__results'>
          <div className='pot-odds__result'>
            <span className='pot-odds__result-label'>Pot Odds</span>
            <span className='pot-odds__result-value'>{calc.potOdds.toFixed(1)}%</span>
            <span className='pot-odds__result-hint'>equity needed to break even</span>
          </div>
          {calc.turnEquity !== null && <Verdict label='Turn (1 card)' equity={calc.turnEquity} needed={calc.potOdds} />}
          {calc.flopEquity !== null && <Verdict label='Flop (2 cards)' equity={calc.flopEquity} needed={calc.potOdds} />}
        </div>
      )}
    </div>
  )
}

export default PotOddsCalculator

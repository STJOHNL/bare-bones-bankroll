import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import { formatPL, plColor } from '../utils/money'

// Theme-neutral greys read well on both the light and dark backgrounds
const AXIS_TICK = { fill: 'rgba(128,128,128,0.8)', fontSize: 11 }

const PLChart = ({ data, title = 'Cumulative P/L' }) => {
  if (data.length < 2) return null
  const last = data[data.length - 1].pl

  return (
    <div className='pl-chart'>
      <p className='pl-chart__title'>{title}</p>
      <ResponsiveContainer width='100%' height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <XAxis dataKey='date' tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={v => `$${v}`} tick={AXIS_TICK} tickLine={false} axisLine={false} width={60} />
          <Tooltip
            contentStyle={{
              background: 'var(--alt-background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
            }}
            labelStyle={{ color: 'rgba(128,128,128,0.9)' }}
            formatter={v => [formatPL(v), 'P/L']}
          />
          <ReferenceLine y={0} stroke='rgba(128,128,128,0.35)' strokeDasharray='4 4' />
          <Line type='monotone' dataKey='pl' stroke={plColor(last)} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PLChart

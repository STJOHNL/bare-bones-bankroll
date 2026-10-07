// Row of summary tiles: [{ label, value, color? }]
const StatGrid = ({ stats, style }) => (
  <div className='stats' style={style}>
    {stats.map(({ label, value, color, hint }) => (
      <div className='stat' key={label}>
        <p>{label}</p>
        <span className='stat__value' style={{ color }}>
          {value}
        </span>
        {hint && <span className='stat__hint'>{hint}</span>}
      </div>
    ))}
  </div>
)

export default StatGrid

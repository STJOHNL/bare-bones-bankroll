import { PLAYER_CATEGORIES, initials, playerCategory } from '../../utils/playerCategories'

// Initials on a circle in the player's category colour — easy to spot at a glance
export const PlayerAvatar = ({ name, category, size = 'md' }) => {
  const { color, label } = playerCategory(category)
  return (
    <span className={`player-avatar player-avatar--${size}`} style={{ backgroundColor: color }} title={label} aria-hidden='true'>
      {initials(name)}
    </span>
  )
}

export const CategoryBadge = ({ category }) => {
  const { color, label } = playerCategory(category)
  return (
    <span className='player-category' style={{ '--category-color': color }}>
      {label}
    </span>
  )
}

// Colour chips acting as a radio group for choosing a player's category
export const CategoryPicker = ({ value, onChange, idPrefix = 'category' }) => (
  <fieldset className='category-picker'>
    <legend>Player type</legend>
    <div className='category-picker__options'>
      {PLAYER_CATEGORIES.map(c => (
        <label
          key={c.key}
          className={`category-picker__option${value === c.key ? ' category-picker__option--active' : ''}`}
          style={{ '--category-color': c.color }}
          title={c.hint}
          htmlFor={`${idPrefix}-${c.key}`}>
          <input
            type='radio'
            id={`${idPrefix}-${c.key}`}
            name={idPrefix}
            value={c.key}
            checked={value === c.key}
            onChange={() => onChange(c.key)}
          />
          <span className='category-picker__dot' aria-hidden='true' />
          {c.label}
        </label>
      ))}
    </div>
    <p className='form-hint'>{playerCategory(value).hint}</p>
  </fieldset>
)

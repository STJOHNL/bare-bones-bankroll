import { NavLink } from 'react-router-dom'
import { FaSignInAlt, FaUserPlus, FaSun, FaMoon } from 'react-icons/fa'
import { useThemeContext } from '../../context/ThemeContext'

const NavbarPublic = () => {
  const { theme, toggleTheme } = useThemeContext()

  return (
    <nav>
      <span className='nav__brand'>Bankroll</span>
      <button
        type='button'
        className='nav__toggle'
        onClick={toggleTheme}
        aria-pressed={theme === 'dark'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <FaSun /> : <FaMoon />}
      </button>
      <div className='nav__links'>
        <NavLink to='/sign-in' className='nav__item'>
          <FaSignInAlt />
          <span>Sign in</span>
        </NavLink>
        <NavLink to='/sign-up' className='nav__item'>
          <FaUserPlus />
          <span>Sign up</span>
        </NavLink>
      </div>
    </nav>
  )
}

export default NavbarPublic

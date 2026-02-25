import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FaBars, FaTimes } from 'react-icons/fa'

const NavbarPublic = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav>
      <span className='nav__brand'>Bankroll</span>
      {!menuOpen && (
        <button className='nav__hamburger' onClick={() => setMenuOpen(true)}>
          <FaBars />
        </button>
      )}
      <div className={`nav__links${menuOpen ? ' nav__links--open' : ''}`}>
        <button className='nav__close' onClick={closeMenu}><FaTimes /></button>
        <NavLink to='/sign-in' onClick={closeMenu}>Sign in</NavLink>
        <NavLink to='/sign-up' onClick={closeMenu}>Sign up</NavLink>
      </div>
    </nav>
  )
}

export default NavbarPublic

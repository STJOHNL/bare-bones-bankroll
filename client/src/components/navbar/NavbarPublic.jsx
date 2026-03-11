import { NavLink } from 'react-router-dom'
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa'

const NavbarPublic = () => {
  return (
    <nav>
      <span className='nav__brand'>Bankroll</span>
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

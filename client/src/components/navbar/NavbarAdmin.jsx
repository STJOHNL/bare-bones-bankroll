import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { FaUsers, FaTicketAlt, FaArrowLeft, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa'
// Custom hooks
import { useAuth } from '../../hooks/useAuth'
import { useThemeContext } from '../../context/ThemeContext'
import ConfirmModal from '../ConfirmModal'

const NavbarAdmin = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useThemeContext()
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  const handleSignOut = async () => {
    try {
      toast.success('See you later!')
      await signOut()
      navigate('/sign-in')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <nav>
      <NavLink to='/admin' className='nav__brand'>
        Admin
      </NavLink>
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
        <NavLink to='/admin' className='nav__item'>
          <FaUsers />
          <span>Users</span>
        </NavLink>
        <NavLink to='/support-tickets' className='nav__item'>
          <FaTicketAlt />
          <span>Support Tickets</span>
        </NavLink>
        <NavLink to='/dashboard' className='nav__item'>
          <FaArrowLeft />
          <span>App</span>
        </NavLink>
        <button className='nav__item nav__logout' onClick={() => setShowSignOutModal(true)}>
          <FaSignOutAlt />
          <span>Log out</span>
        </button>
      </div>

      {showSignOutModal && (
        <ConfirmModal
          message='Are you sure you want to log out?'
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOutModal(false)}
          confirmLabel='Log out'
        />
      )}
    </nav>
  )
}

export default NavbarAdmin

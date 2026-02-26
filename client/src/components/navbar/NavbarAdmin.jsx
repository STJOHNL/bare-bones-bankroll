import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { FaBars, FaTimes } from 'react-icons/fa'
// Context
import { useUserContext } from '../../context/UserContext'
// Custom hooks
import { useAuth } from '../../hooks/useAuth'

const NavbarAdmin = () => {
  const navigate = useNavigate()
  const { user } = useUserContext()
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const handleSignOut = async () => {
    const userConfirmed = window.confirm('Are you sure you want to log out?')
    try {
      if (userConfirmed) {
        toast.success('See you later!')
        closeMenu()
        await signOut()
        navigate('/sign-in')
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <nav>
      <NavLink to='/admin' className='nav__brand'>
        Admin
      </NavLink>
      {!menuOpen && (
        <button className='nav__hamburger' onClick={() => setMenuOpen(true)}>
          <FaBars />
        </button>
      )}
      <div className={`nav__links${menuOpen ? ' nav__links--open' : ''}`}>
        <button className='nav__close' onClick={closeMenu}><FaTimes /></button>
        <NavLink to='/admin' onClick={closeMenu}>Users</NavLink>
        <NavLink to='/support-tickets' onClick={closeMenu}>Support Tickets</NavLink>
        <NavLink to='/dashboard' onClick={closeMenu}>← App</NavLink>
        <button className='nav__logout' onClick={handleSignOut}>Log out</button>
      </div>
    </nav>
  )
}

export default NavbarAdmin

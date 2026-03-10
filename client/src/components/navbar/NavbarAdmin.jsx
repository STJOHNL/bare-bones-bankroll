import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { FaUsers, FaTicketAlt, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa'
// Custom hooks
import { useAuth } from '../../hooks/useAuth'

const NavbarAdmin = () => {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    const userConfirmed = window.confirm('Are you sure you want to log out?')
    try {
      if (userConfirmed) {
        toast.success('See you later!')
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
        <button className='nav__item nav__logout' onClick={handleSignOut}>
          <FaSignOutAlt />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  )
}

export default NavbarAdmin

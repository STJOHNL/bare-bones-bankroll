import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { FaTachometerAlt, FaWallet, FaUser, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa'
// Context
import { useUserContext } from '../../context/UserContext'
import { useBankrollContext } from '../../context/BankrollContext'
// Custom hooks
import { useAuth } from '../../hooks/useAuth'

const NavbarPrivate = () => {
  const navigate = useNavigate()
  const { user } = useUserContext()
  const { signOut } = useAuth()
  const { balance } = useBankrollContext()

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
      <NavLink to='/dashboard' className='nav__brand'>
        Bankroll <span className='nav__balance' style={{ color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>${balance.toFixed(2)}</span>
      </NavLink>
      <div className='nav__links'>
        <NavLink to='/dashboard' className='nav__item'>
          <FaTachometerAlt />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to='/bankroll' className='nav__item'>
          <FaWallet />
          <span>Bankroll</span>
        </NavLink>
        <NavLink to={`/profile/${user?._id}`} className='nav__item'>
          <FaUser />
          <span>Profile</span>
        </NavLink>
        {user?.role === 'Admin' && (
          <NavLink to='/admin' className='nav__item'>
            <FaShieldAlt />
            <span>Admin</span>
          </NavLink>
        )}
        <button className='nav__item nav__logout' onClick={handleSignOut}>
          <FaSignOutAlt />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  )
}

export default NavbarPrivate

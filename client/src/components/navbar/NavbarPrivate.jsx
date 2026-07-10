import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  FaTachometerAlt,
  FaWallet,
  FaUser,
  FaShieldAlt,
  FaSignOutAlt,
  FaChartBar,
  FaDice,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa'
// Context
import { useUserContext } from '../../context/UserContext'
import { useBankrollContext } from '../../context/BankrollContext'
// Custom hooks
import { useAuth } from '../../hooks/useAuth'
import ConfirmModal from '../ConfirmModal'

const NavbarPrivate = () => {
  const navigate = useNavigate()
  const { user } = useUserContext()
  const { signOut } = useAuth()
  const { balance } = useBankrollContext()
  const [isBalanceHidden, setIsBalanceHidden] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  useEffect(() => {
    const storedValue = localStorage.getItem('bankrollHidden')
    setIsBalanceHidden(storedValue === 'true')
  }, [])

  const handleSignOut = async () => {
    try {
      toast.success('See you later!')
      await signOut()
      navigate('/sign-in')
    } catch (error) {
      console.log(error)
    }
  }

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(prev => {
      const next = !prev
      localStorage.setItem('bankrollHidden', next.toString())
      return next
    })
  }

  const balanceDisplay = isBalanceHidden ? '••••' : `$${balance.toFixed(2)}`
  const balanceColor = isBalanceHidden
    ? 'var(--light)'
    : balance >= 0
      ? 'var(--green)'
      : 'var(--red)'

  return (
    <nav>
      <NavLink to="/dashboard" className="nav__brand">
        Bankroll{' '}
        <span className="nav__balance" style={{ color: balanceColor }}>
          {balanceDisplay}
        </span>
      </NavLink>
      <button
        type="button"
        className="nav__toggle"
        onClick={toggleBalanceVisibility}
        aria-pressed={isBalanceHidden}
        title={isBalanceHidden ? 'Show bankroll' : 'Hide bankroll'}
      >
        {isBalanceHidden ? <FaEye /> : <FaEyeSlash />}
      </button>
      <div className="nav__links">
        <NavLink to="/dashboard" className="nav__item">
          <FaTachometerAlt />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/bankroll" className="nav__item">
          <FaWallet />
          <span>Bankroll</span>
        </NavLink>
        <NavLink to="/reports" className="nav__item">
          <FaChartBar />
          <span>Reports</span>
        </NavLink>
        <NavLink to="/randomizer" className="nav__item">
          <FaDice />
          <span>Randomizer</span>
        </NavLink>
        <NavLink to={`/profile/${user?._id}`} className="nav__item">
          <FaUser />
          <span>Profile</span>
        </NavLink>
        {user?.role === 'Admin' && (
          <NavLink to="/admin" className="nav__item">
            <FaShieldAlt />
            <span>Admin</span>
          </NavLink>
        )}
        <button className="nav__item nav__logout" onClick={() => setShowSignOutModal(true)}>
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

export default NavbarPrivate

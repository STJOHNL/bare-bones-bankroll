import { useState } from 'react'
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
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaSun,
  FaMoon,
} from 'react-icons/fa'
// Context
import { useUserContext } from '../../context/UserContext'
import { useBankrollContext } from '../../context/BankrollContext'
import { useThemeContext } from '../../context/ThemeContext'
// Custom hooks
import { useAuth } from '../../hooks/useAuth'
// Utils
import { formatPL } from '../../utils/money'
import ConfirmModal from '../ConfirmModal'

const NavbarPrivate = () => {
  const navigate = useNavigate()
  const { user } = useUserContext()
  const { signOut } = useAuth()
  const { balance } = useBankrollContext()
  const { theme, toggleTheme } = useThemeContext()
  const [isBalanceHidden, setIsBalanceHidden] = useState(() => localStorage.getItem('bankrollHidden') === 'true')
  const [showSignOutModal, setShowSignOutModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('See you later!')
    navigate('/sign-in')
  }

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(prev => {
      const next = !prev
      localStorage.setItem('bankrollHidden', next.toString())
      return next
    })
  }

  const balanceDisplay = isBalanceHidden ? '••••' : formatPL(balance)
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
      <button
        type="button"
        className="nav__toggle"
        onClick={toggleTheme}
        aria-pressed={theme === 'dark'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <FaSun /> : <FaMoon />}
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
        <NavLink to="/history" className="nav__item">
          <FaHistory />
          <span>History</span>
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

import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
// Context
import { useUserContext } from '../../context/UserContext'
// Custom hooks
import { useAuth } from '../../hooks/useAuth'

const NavbarPrivate = () => {
  const navigate = useNavigate()
  const { user } = useUserContext()
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
      <NavLink to={`/profile/${user?._id}`}>Profile</NavLink>
      <div onClick={() => handleSignOut()}>Log out</div>
    </nav>
  )
}

export default NavbarPrivate

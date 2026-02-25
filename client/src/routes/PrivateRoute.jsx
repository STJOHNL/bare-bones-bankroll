import { Navigate } from 'react-router-dom'
// Context
import { useUserContext } from '../context/UserContext'
// Components
import Loader from '../components/Loader'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useUserContext()

  if (loading) {
    return <Loader />
  }

  return user ? children : <Navigate to='/sign-in' />
}

export default PrivateRoute

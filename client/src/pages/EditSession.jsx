import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
// Custom Hooks
import { useSession } from '../hooks/useSession'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import SessionForm from '../components/forms/SessionForm'

const EditSession = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getSessionById } = useSession()

  // Start in the loading state so the form never mounts with empty fields
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState()

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      setSession(await getSessionById(id))
      setIsLoading(false)
    }
    fetchSession()
  }, [id, getSessionById])

  const handleSubmit = () => {
    navigate(location.state?.returnTo || '/dashboard')
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Edit Session'} />
      {session ? (
        <SessionForm parentData={session} buttonText={'Save Changes'} onSubmitCallback={handleSubmit} />
      ) : (
        <div className='empty-state'>
          <span className='empty-state__title'>Session not found</span>
        </div>
      )}
    </>
  )
}

export default EditSession

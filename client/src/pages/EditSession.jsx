import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// Custom Hooks
import { useSession } from '../hooks/useSession'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import SessionForm from '../components/forms/SessionForm'

const EditSession = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSessionById } = useSession()

  const [isLoading, setIsLoading] = useState(false)
  const [session, setSession] = useState()

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      const res = await getSessionById(id)
      setSession(res)
      setIsLoading(false)
    }

    fetchSession()
  }, [])

  const handleSubmit = () => {
    navigate('/dashboard')
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Edit Session'} />
      <SessionForm
        parentData={session}
        buttonText={'Save Changes'}
        onSubmitCallback={handleSubmit}
      />
    </>
  )
}

export default EditSession

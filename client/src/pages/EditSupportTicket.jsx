import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// Custom Hooks
import { useSupport } from '../hooks/useSupport'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import SupportForm from '../components/forms/SupportForm'

const EditSupportTicket = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSupportTicket } = useSupport()

  // Start in the loading state so the form never mounts with empty fields
  const [isLoading, setIsLoading] = useState(true)
  const [supportTicket, setSupportTicket] = useState()

  useEffect(() => {
    const fetchSupportTicket = async () => {
      setIsLoading(true)
      setSupportTicket(await getSupportTicket(id))
      setIsLoading(false)
    }
    fetchSupportTicket()
  }, [id, getSupportTicket])

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Update Support Ticket'} />
      {supportTicket ? (
        <SupportForm
          parentData={supportTicket}
          showStatus
          buttonText={'Save Changes'}
          onSubmitCallback={() => navigate('/support-tickets')}
        />
      ) : (
        <div className='empty-state'>
          <span className='empty-state__title'>Ticket not found</span>
        </div>
      )}
    </>
  )
}

export default EditSupportTicket

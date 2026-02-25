import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// Custom Hooks
import { useSupportTicket } from '../hooks/useSupportTicket'

// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import SupportForm from '../components/forms/SupportForm'

const EditSupportTicket = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSupportTicket } = useSupportTicket()

  const [isLoading, setIsLoading] = useState(false)
  const [supportTicket, setSupportTicket] = useState()

  // Data fetch
  useEffect(() => {
    const fetchSupportTicket = async (id) => {
      setIsLoading(true)

      let res = await getSupportTicket(id)
      setSupportTicket(res)

      setIsLoading(false)
    }

    fetchSupportTicket(id)
  }, [])

  const handleSubmit = async (e) => {
    navigate('/support-tickets')
  }

  // Conditional loader
  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Update Support Ticket'} />
      <SupportForm
        parentData={supportTicket}
        showStatus={true}
        buttonText={'Save Changes'}
        onSubmitCallback={handleSubmit}
      />
    </>
  )
}

export default EditSupportTicket

import { useNavigate } from 'react-router-dom'
// Components
import PageTitle from '../components/PageTitle'
import SupportForm from '../components/forms/SupportForm'

const Support = () => {
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    navigate('/support')
  }

  return (
    <>
      <PageTitle title={'Feedback & Support'} hideTitle />
      <SupportForm
        buttonText={'Send message'}
        onSubmitCallback={handleSubmit}
      />
    </>
  )
}

export default Support

// Components
import PageTitle from '../components/PageTitle'
import SupportForm from '../components/forms/SupportForm'

const Support = () => {
  return (
    <>
      <PageTitle title={'Feedback & Support'} hideTitle />
      <SupportForm buttonText={'Send message'} />
    </>
  )
}

export default Support

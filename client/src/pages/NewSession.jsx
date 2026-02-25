import { useLocation } from 'react-router-dom'
// Components
import PageTitle from '../components/PageTitle'
import SessionForm from '../components/forms/SessionForm'

const NewSession = () => {
  const { state } = useLocation()
  return (
    <>
      <PageTitle title={state?.prefill ? 'Duplicate Session' : 'New Session'} />
      <SessionForm buttonText={'Start Session'} prefillData={state?.prefill} />
    </>
  )
}

export default NewSession

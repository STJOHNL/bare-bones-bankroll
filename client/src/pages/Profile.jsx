import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
// Custom Hooks
import { useUser } from '../hooks/useUser'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import UserForm from '../components/forms/UserForm'

const Profile = () => {
  const { getUser } = useUser()
  const { id } = useParams()

  const [isLoading, setIsLoading] = useState(false)
  const [formUser, setFormUser] = useState()

  useEffect(() => {
    const fetchUser = async (id) => {
      setIsLoading(true)
      const res = await getUser(id)
      setFormUser(res)
      setIsLoading(false)
    }
    fetchUser(id)
  }, [id])

  // Conditional loader
  if (isLoading) return <Loader />

  return (
    <>
      {formUser && (
        <PageTitle
          title={
            formUser.fName.length
              ? `${formUser.fName} ${formUser.lName}`
              : 'Profile'
          }
          hideTitle
        />
      )}
      <UserForm parentData={formUser} buttonText={'Save Changes'} />
    </>
  )
}

export default Profile

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
// Context
import { useUserContext } from '../../context/UserContext'
// Custom Hooks
import { useUser } from '../../hooks/useUser'

const UserForm = ({ onSubmitCallback, parentData, buttonText }) => {
  const { user, setUser } = useUserContext()
  const { createUser, updateUser } = useUser()

  // Form data
  const [fName, setFName] = useState(parentData?.fName || '')
  const [lName, setLName] = useState(parentData?.lName || '')
  const [email, setEmail] = useState(parentData?.email || '')

  const handleSubmit = async e => {
    e.preventDefault()

    const formData = {
      updatingUserId: user?._id,
      id: parentData?._id || '',
      fName,
      lName,
      email
    }

    let res

    if (parentData) {
      res = await updateUser(formData)
      if (res) {
        if (formData.updatingUserId == formData.id) {
          setUser(res)
        }
        toast.success('Changes Saved')
      }
    } else {
      res = await createUser(formData)
      if (res) {
        toast.success('User Created')
      }
    }

    if (onSubmitCallback) {
      // Callback to update the parent component
      onSubmitCallback(res)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className='heading-lg'>My info</h2>
      <label htmlFor='fName'>First</label>
      <input
        type='text'
        name='fName'
        id='fName'
        placeholder='First Name'
        onChange={e => setFName(e.target.value)}
        value={fName}
        required
      />
      <label htmlFor='lName'>Last</label>
      <input
        type='text'
        name='lName'
        id='lName'
        placeholder='Last Name'
        onChange={e => setLName(e.target.value)}
        value={lName}
        required
      />
      <label htmlFor='email'>Email</label>
      <input
        type='email'
        name='email'
        id='email'
        placeholder='email@email.com'
        onChange={e => setEmail(e.target.value)}
        value={email}
        required
      />

      <button>{buttonText}</button>
    </form>
  )
}

export default UserForm

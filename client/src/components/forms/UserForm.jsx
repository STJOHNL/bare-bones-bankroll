import { useState } from 'react'
import toast from 'react-hot-toast'
// Context
import { useUserContext } from '../../context/UserContext'
// Custom Hooks
import { useUser } from '../../hooks/useUser'

const UserForm = ({ onSubmitCallback, parentData, buttonText }) => {
  const { user, setUser } = useUserContext()
  const { updateUser } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSelf = user?._id === parentData._id
  const canEditRole = user?.role === 'Admin' && !isSelf

  // Form data
  const [fName, setFName] = useState(parentData.fName || '')
  const [lName, setLName] = useState(parentData.lName || '')
  const [email, setEmail] = useState(parentData.email || '')
  const [role, setRole] = useState(parentData.role || 'User')

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSubmitting(true)

    const res = await updateUser({
      id: parentData._id,
      fName,
      lName,
      email,
      ...(canEditRole && { role }),
    })
    setIsSubmitting(false)

    if (res) {
      if (isSelf) setUser(prev => ({ ...prev, fName: res.fName, lName: res.lName, email: res.email }))
      toast.success('Changes saved')
      onSubmitCallback?.(res)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className='heading-lg'>{isSelf ? 'My info' : 'User info'}</h2>
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
      {canEditRole && (
        <>
          <label htmlFor='role'>Role</label>
          <select id='role' value={role} onChange={e => setRole(e.target.value)}>
            <option value='User'>User</option>
            <option value='Admin'>Admin</option>
          </select>
        </>
      )}

      <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'is-loading' : ''}>
        {isSubmitting && <span className='btn-spinner' aria-hidden='true' />}
        {isSubmitting ? 'Saving…' : buttonText}
      </button>
    </form>
  )
}

export default UserForm

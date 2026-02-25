import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
// Custom Hooks
import { useAuth } from '../hooks/useAuth'
// Components
import PageTitle from '../components/PageTitle'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords to not match')
    } else {
      const formData = { password, confirmPassword, token }
      const res = await resetPassword(formData)
      if (res) {
        toast.success('Password has been updated!')
        navigate('/')
      }
    }
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <>
      <PageTitle
        title={'Reset Password'}
        hideTitle
      />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Create New Password</h1>
        <label htmlFor='password'>Password</label>
        <input
          type='password'
          name='password'
          id='password'
          placeholder='Password'
          onChange={e => setPassword(e.target.value)}
          value={password}
          required
          autoFocus
        />
        <label htmlFor='confirmPassword'>Confirm</label>
        <input
          type='password'
          name='confirmPassword'
          id='confirmPassword'
          placeholder='Confirm Password'
          onChange={e => setConfirmPassword(e.target.value)}
          value={confirmPassword}
          required
        />
        <button>Update Password</button>
      </form>
      <div>
        <Link to='/sign-in'>Return to sign in</Link>
      </div>
    </>
  )
}

export default ResetPassword

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    const res = await resetPassword({ password, token })
    setIsSubmitting(false)

    if (res) {
      toast.success('Password has been updated! Sign in with your new password.')
      navigate('/sign-in')
    } else {
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <>
      <PageTitle title={'Reset Password'} hideTitle />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Create New Password</h1>
        <label htmlFor='password'>Password</label>
        <input
          type='password'
          name='password'
          id='password'
          placeholder='At least 8 characters'
          autoComplete='new-password'
          minLength={8}
          onChange={e => setPassword(e.target.value)}
          value={password}
          required
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <label htmlFor='confirmPassword'>Confirm</label>
        <input
          type='password'
          name='confirmPassword'
          id='confirmPassword'
          placeholder='Confirm Password'
          autoComplete='new-password'
          minLength={8}
          onChange={e => setConfirmPassword(e.target.value)}
          value={confirmPassword}
          required
        />
        <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'is-loading' : ''}>
          {isSubmitting && <span className='btn-spinner' aria-hidden='true' />}
          {isSubmitting ? 'Updating…' : 'Update Password'}
        </button>
      </form>
      <div className='auth-links'>
        <Link to='/sign-in'>Return to sign in</Link>
      </div>
    </>
  )
}

export default ResetPassword

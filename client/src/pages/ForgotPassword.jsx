import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
// Custom Hooks
import { useAuth } from '../hooks/useAuth'
// Components
import PageTitle from '../components/PageTitle'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()

    setIsSubmitting(true)
    const res = await forgotPassword({ email })
    setIsSubmitting(false)

    if (res) {
      // The server responds the same way whether or not the account exists
      toast.success(res.message || 'Check your email for a reset link', { duration: 6000 })
      navigate('/sign-in')
    }
  }

  return (
    <>
      <PageTitle title={'Forgot password'} hideTitle />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Forgot password</h1>
        <label htmlFor='email'>Email</label>
        <input
          type='email'
          name='email'
          id='email'
          placeholder='Email'
          autoComplete='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          required
        />
        <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'is-loading' : ''}>
          {isSubmitting && <span className='btn-spinner' aria-hidden='true' />}
          {isSubmitting ? 'Sending…' : 'Send password reset'}
        </button>
      </form>
      <div className='auth-links'>
        <Link to='/sign-in'>Return to sign in</Link>
      </div>
    </>
  )
}

export default ForgotPassword

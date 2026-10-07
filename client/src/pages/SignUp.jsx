import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
// Context
import { useUserContext } from '../context/UserContext'
// Custom Hooks
import { useAuth } from '../hooks/useAuth'
// Components
import PageTitle from '../components/PageTitle'

const SignUp = () => {
  const { signUp } = useAuth()
  const { user } = useUserContext()
  const navigate = useNavigate()

  // Form state
  const [fName, setFName] = useState('')
  const [lName, setLName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Already signed in (or just signed up) — go to the dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async e => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    const res = await signUp({ fName, lName, email, password })
    setIsSubmitting(false)
    if (res?.user) toast.success('Welcome!')
  }

  return (
    <>
      <PageTitle title={'Sign up'} hideTitle />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Welcome!</h1>
        <label htmlFor='fName'>First</label>
        <input
          type='text'
          name='fName'
          id='fName'
          placeholder='First Name'
          autoComplete='given-name'
          onChange={e => setFName(e.target.value)}
          value={fName}
          required
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <label htmlFor='lName'>Last</label>
        <input
          type='text'
          name='lName'
          id='lName'
          placeholder='Last Name'
          autoComplete='family-name'
          onChange={e => setLName(e.target.value)}
          value={lName}
          required
        />
        <label htmlFor='email'>Email</label>
        <input
          type='email'
          name='email'
          id='email'
          placeholder='name@email.com'
          autoComplete='email'
          onChange={e => setEmail(e.target.value)}
          value={email}
          required
        />
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
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <div className='auth-links'>
        <Link to='/sign-in'>Already have an account?</Link>
        <Link to='/forgot-password'>Forgot password?</Link>
      </div>
    </>
  )
}

export default SignUp

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
// Context
import { useUserContext } from '../context/UserContext'
// Custom Hooks
import { useAuth } from '../hooks/useAuth'
// Components
import PageTitle from '../components/PageTitle'

const SignIn = () => {
  const { signIn } = useAuth()
  const { user } = useUserContext()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Signing in sets the user, which sends us to the dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await signIn(formData)
    setIsSubmitting(false)
    if (res?.user) toast.success('Welcome!')
  }

  return (
    <>
      <PageTitle title='Sign in' hideTitle={true} />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Welcome!</h1>
        <label htmlFor='email'>Email</label>
        <input
          type='email'
          name='email'
          id='email'
          placeholder='name@email.com'
          autoComplete='email'
          onChange={handleChange}
          value={formData.email}
          required
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        <label htmlFor='password'>Password</label>
        <input
          type='password'
          name='password'
          id='password'
          placeholder='Password'
          autoComplete='current-password'
          onChange={handleChange}
          value={formData.password}
          required
        />

        <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'is-loading' : ''}>
          {isSubmitting && <span className='btn-spinner' aria-hidden='true' />}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className='auth-links'>
        <Link to='/sign-up'>Need an account?</Link>
        <Link to='/forgot-password'>Forgot password?</Link>
      </div>
    </>
  )
}

export default SignIn

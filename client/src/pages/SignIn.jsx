import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
// Context
import { useUserContext } from '../context/UserContext'
// Custom Hooks
import { useAuth } from '../hooks/useAuth'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'

const SignIn = () => {
  const { signIn } = useAuth()
  const { setToken, user } = useUserContext()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await signIn(formData)
      if (res?.token) {
        toast.success('Welcome!')
        setToken(res.token)
        setTimeout(() => {
          // Small delay to ensure toast is visible
          navigate('/dashboard')
        }, 100)
      }
    } catch (error) {
      // Error toasts are handled in useApi
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle
        title='Sign in'
        hideTitle={true}
      />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Welcome!</h1>
        <label htmlFor='email'>Email</label>
        <input
          type='email'
          name='email'
          id='email'
          placeholder='name@email.com'
          onChange={handleChange}
          value={formData.email}
          required
          autoFocus
        />

        <label htmlFor='password'>Password</label>
        <input
          type='password'
          name='password'
          id='password'
          placeholder='Password'
          onChange={handleChange}
          value={formData.password}
          required
        />

        <button
          type='submit'
          disabled={isLoading}>
          Sign in
        </button>
      </form>

      <div>
        <Link to='/sign-up'>Need an account?</Link>
        <Link to='/forgot-password'>Forgot password?</Link>
      </div>
    </>
  )
}

export default SignIn

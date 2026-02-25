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
  const { setToken, user } = useUserContext()
  const navigate = useNavigate()

  // Form state
  const [fName, setFName] = useState('')
  const [lName, setLName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user]) // Check if user is already logged in on mount

  const handleSubmit = async e => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords to not match')
      const [password, setPassword] = useState('')
      const [confirmPassword, setConfirmPassword] = useState('')
    } else {
      const formData = { fName, lName, email, password, confirmPassword }

      const res = await signUp(formData)
      if (res?.token) {
        setToken(res?.token)
        toast.success('Welcome!')
        navigate('/dashboard')
      }
    }
  }

  return (
    <>
      <PageTitle
        title={'Sign up'}
        hideTitle
      />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Welcome!</h1>
        <label htmlFor='fName'>First</label>
        <input
          type='text'
          name='fName'
          id='fName'
          placeholder='First Name'
          onChange={e => setFName(e.target.value)}
          value={fName}
          required
          autoFocus
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
          placeholder='name@email.com'
          onChange={e => setEmail(e.target.value)}
          value={email}
          required
        />
        <label htmlFor='password'>Password</label>
        <input
          type='password'
          name='password'
          id='password'
          placeholder='Password'
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
          onChange={e => setConfirmPassword(e.target.value)}
          value={confirmPassword}
          required
        />

        <button>Sign up</button>
      </form>
      <div>
        <Link to='/'>Already have an account?</Link>
        <Link to='/forgot-password'>Forgot password?</Link>
      </div>
    </>
  )
}

export default SignUp

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

  const handleSubmit = async e => {
    e.preventDefault()

    const res = await forgotPassword({ email: email })

    if (res) {
      toast.success(`Email sent to ${email}`)
      navigate('/')
    }
  }

  return (
    <>
      <PageTitle
        title={'Forgot password'}
        hideTitle
      />
      <form onSubmit={handleSubmit}>
        <h1 className='heading-lg'>Forgot password</h1>
        <label htmlFor='email'>Email</label>
        <input
          type='email'
          name='email'
          id='email'
          placeholder='Email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
          required
        />
        <button>Send password reset</button>
      </form>
      <div>
        <Link to='/sign-in'>Return to sign in</Link>
      </div>
    </>
  )
}

export default ForgotPassword

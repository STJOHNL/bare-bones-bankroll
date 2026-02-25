import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
// Context
import { useUserContext } from '../../context/UserContext'
// Custom Hooks
import { useSupport } from '../../hooks/useSupport'

const SupportForm = ({ onSubmitCallback, parentData, buttonText, showStatus }) => {
  const { user } = useUserContext()
  const { createSupportTicket, updateSupportTicket } = useSupport()
  const navigate = useNavigate()

  // Form data
  const [category, setCategory] = useState(parentData?.category || '')
  const [message, setMessage] = useState(parentData?.message || '')
  const [status, setStatus] = useState(parentData?.status || 'Pending')

  const handleSubmit = async e => {
    e.preventDefault()

    const formData = {
      id: parentData?._id || '',
      category,
      message,
      status,
      userEmail: parentData?.userEmail || user.email,
      userName: parentData?.userName || `${user.fName} ${user.lName}`
    }

    let res = null

    if (parentData) {
      res = await updateSupportTicket(formData)
      if (res) {
        toast.success('Changes saved')
      }
    } else {
      res = await createSupportTicket(formData)
      if (res) {
        toast.success('Message sent')
        navigate('/dashboard')
      }
    }

    if (onSubmitCallback) {
      // Callback to update the parent component
      onSubmitCallback(res)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className='heading-lg'>Send a message</h2>
      <label htmlFor='category'>Category</label>
      <select
        name='category'
        id='category'
        onChange={e => setCategory(e.target.value)}
        autoFocus
        required>
        {category == '' ? <option>Select Category</option> : <option value={category}>{category}</option>}
        <option value='Bug'>Report Bug/Error</option>
        <option value='Feedback'>Feedback</option>
        <option value='Feature Request'>Feature Request</option>
        <option value='Other'>Other</option>
      </select>
      <label htmlFor='message'>Message</label>
      <textarea
        name='message'
        id='message'
        onChange={e => setMessage(e.target.value)}
        value={message}
        required></textarea>
      {showStatus && (
        <>
          <label htmlFor='status'>Status</label>
          <select
            name='status'
            id='status'
            onChange={e => setStatus(e.target.value)}
            required>
            <option value={status}>{status}</option>
            <option value='Completed'>Completed</option>
            <option value='In Progress'>In Progress</option>
            <option value='Pending'>Pending</option>
            <option value='Planned'>Planned</option>
          </select>
        </>
      )}

      <button>{buttonText}</button>
    </form>
  )
}

export default SupportForm

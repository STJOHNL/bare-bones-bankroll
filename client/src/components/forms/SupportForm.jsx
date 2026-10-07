import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
// Custom Hooks
import { useSupport } from '../../hooks/useSupport'
// Utils
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from '../../utils/support'

const SupportForm = ({ onSubmitCallback, parentData, buttonText, showStatus }) => {
  const { createSupportTicket, updateSupportTicket } = useSupport()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [category, setCategory] = useState(parentData?.category || '')
  const [message, setMessage] = useState(parentData?.message || '')
  const [status, setStatus] = useState(parentData?.status || 'Pending')

  const handleSubmit = async e => {
    e.preventDefault()
    setIsSubmitting(true)

    // The server fills in who sent the ticket from the signed-in account
    const res = parentData
      ? await updateSupportTicket({ id: parentData._id, category, message, status })
      : await createSupportTicket({ category, message })
    setIsSubmitting(false)

    if (!res) return
    if (parentData) {
      toast.success('Changes saved')
      onSubmitCallback?.(res)
    } else {
      toast.success('Message sent')
      navigate('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className='heading-lg'>{parentData ? 'Support ticket' : 'Send a message'}</h2>
      <label htmlFor='category'>Category</label>
      <select
        name='category'
        id='category'
        value={category}
        onChange={e => setCategory(e.target.value)}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        required>
        <option value='' disabled>
          Select Category
        </option>
        {SUPPORT_CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <label htmlFor='message'>Message</label>
      <textarea
        name='message'
        id='message'
        onChange={e => setMessage(e.target.value)}
        value={message}
        maxLength={5000}
        required></textarea>
      {showStatus && (
        <>
          <label htmlFor='status'>Status</label>
          <select name='status' id='status' value={status} onChange={e => setStatus(e.target.value)} required>
            {SUPPORT_STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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

export default SupportForm

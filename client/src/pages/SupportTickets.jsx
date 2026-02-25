import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
// Custom Hooks
import { useSupport } from '../hooks/useSupport'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'

const SupportTickets = () => {
  const { getSupportTickets, deleteSupportTicket } = useSupport()

  const [isLoading, setIsLoading] = useState(false)
  const [supportTickets, setSupportTickets] = useState([])
  const [filteredSupportTickets, setFilteredSupportTickets] = useState([])
  const [filters, setFilters] = useState({
    category: '',
    status: ''
  })

  useEffect(() => {
    const fetchSupportTickets = async () => {
      setIsLoading(true)
      const res = await getSupportTickets()
      setSupportTickets(res || [])
      setIsLoading(false)
    }

    fetchSupportTickets()
  }, [])

  useEffect(() => {
    let filtered = supportTickets
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category)
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status)
    }
    setFilteredSupportTickets(filtered)
  }, [filters, supportTickets])

  const handleDelete = async id => {
    if (!window.confirm('Delete this support ticket?')) return
    const res = await deleteSupportTicket(id)
    if (res) {
      setSupportTickets(prev => prev.filter(t => t._id !== id))
    }
  }

  const handleFilterChange = e => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Support Tickets'} />
      <form className='filter-form'>
        <label htmlFor='category'>Type</label>
        <select
          name='category'
          id='category'
          value={filters.category}
          onChange={handleFilterChange}>
          <option value=''>All Types</option>
          <option value='Bug'>Bug/Error</option>
          <option value='Feedback'>Feedback</option>
          <option value='Feature Request'>Feature Request</option>
          <option value='Other'>Other</option>
        </select>
        <label htmlFor='status'>Status</label>
        <select
          name='status'
          id='status'
          value={filters.status}
          onChange={handleFilterChange}>
          <option value=''>All Statuses</option>
          <option value='Completed'>Completed</option>
          <option value='In Progress'>In Progress</option>
          <option value='Pending'>Pending</option>
          <option value='Planned'>Planned</option>
        </select>
      </form>

      <table>
        <thead>
          <tr>
            <th scope='col'>Type</th>
            <th scope='col'>Message</th>
            <th scope='col'>Status</th>
            <th scope='col'>User</th>
            <th scope='col'>Manage</th>
          </tr>
        </thead>
        <tbody>
          {filteredSupportTickets.length ? (
            filteredSupportTickets.map(ticket => (
              <tr key={ticket._id}>
                <td data-label='Type'>{ticket.category}</td>
                <td data-label='Message'>{ticket.message}</td>
                <td data-label='Status'>{ticket.status}</td>
                <td data-label='User'>{ticket.userName}</td>
                <td data-label='Manage'>
                  <Link
                    to={`/support-tickets/${ticket._id}`}
                    className='btn btn--subtle'>
                    <FaPencilAlt className='btn--icon' />
                  </Link>
                  <button
                    onClick={() => handleDelete(ticket._id)}
                    className='btn btn--subtle'>
                    <FaTrashAlt className='btn--icon--danger' />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No support tickets found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}

export default SupportTickets

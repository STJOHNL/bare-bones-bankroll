import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
// Custom Hooks
import { useSupport } from '../hooks/useSupport'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'
// Utils
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from '../utils/support'

const SupportTickets = () => {
  const { getSupportTickets, deleteSupportTicket } = useSupport()

  const [isLoading, setIsLoading] = useState(true)
  const [supportTickets, setSupportTickets] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [filters, setFilters] = useState({
    category: '',
    status: '',
  })

  useEffect(() => {
    const fetchSupportTickets = async () => {
      setIsLoading(true)
      setSupportTickets((await getSupportTickets()) || [])
      setIsLoading(false)
    }
    fetchSupportTickets()
  }, [getSupportTickets])

  const filteredSupportTickets = useMemo(
    () =>
      supportTickets.filter(
        t => (!filters.category || t.category === filters.category) && (!filters.status || t.status === filters.status)
      ),
    [supportTickets, filters]
  )

  const handleDelete = async id => {
    const res = await deleteSupportTicket(id)
    if (res) {
      setSupportTickets(prev => prev.filter(t => t._id !== id))
    }
    setDeleteTarget(null)
  }

  const handleFilterChange = e => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Support Tickets'} />
      <div className='filter-form'>
        <div>
          <label htmlFor='category'>Type</label>
          <select name='category' id='category' value={filters.category} onChange={handleFilterChange}>
            <option value=''>All Types</option>
            {SUPPORT_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor='status'>Status</label>
          <select name='status' id='status' value={filters.status} onChange={handleFilterChange}>
            <option value=''>All Statuses</option>
            {SUPPORT_STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='table-responsive'>
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
              filteredSupportTickets.map(ticket => {
                const status = ticket.status || 'Pending'
                return (
                  <tr key={ticket._id}>
                    <td data-label='Type'>{ticket.category}</td>
                    <td data-label='Message'>{ticket.message}</td>
                    <td data-label='Status'>
                      <span className={`badge badge--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
                    </td>
                    <td data-label='User'>{ticket.userName}</td>
                    <td data-label='Manage'>
                      <Link
                        to={`/support-tickets/${ticket._id}`}
                        className='btn btn--subtle'
                        aria-label={`Edit ticket from ${ticket.userName}`}>
                        <FaPencilAlt className='btn--icon' />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(ticket._id)}
                        className='btn btn--subtle'
                        aria-label={`Delete ticket from ${ticket.userName}`}>
                        <FaTrashAlt className='btn--icon--danger' />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5}>No support tickets found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmModal
          message='Delete this support ticket? This cannot be undone.'
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default SupportTickets

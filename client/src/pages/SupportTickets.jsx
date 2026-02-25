import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
// Custom Hooks
import { useSupportTicket } from '../hooks/useSupportTicket'
// Helpers
import { handleChange } from '../utils/formHelpers'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import SupportTicketRow from '../components/SupportTicketRow'
// import SupportTicketCard from '../components/SupportTicketCard'

const SupportTickets = () => {
  const { getSupportTickets } = useSupportTicket()

  const [isLoading, setIsLoading] = useState(false)
  const [supportTickets, setSupportTickets] = useState()
  const [filteredSupportTickets, setFilteredSupportTickets] = useState([])
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  })

  useEffect(() => {
    const fetchSupportTickets = async () => {
      setIsLoading(true)

      let res = await getSupportTickets()
      setSupportTickets(res)

      setIsLoading(false)
    }

    fetchSupportTickets()
  }, [])

  useEffect(() => {
    // Filter time off requests on change
    const filteredSupportTickets = () => {
      let filtered = supportTickets
      // Type filter
      if (filters.type) {
        filtered = filtered.filter(supportTicket => supportTicket.type == filters.type)
      }

      // Type filter
      if (filters.status) {
        filtered = filtered.filter(supportTicket => supportTicket.status == filters.status)
      }

      return filtered
    }
    if (supportTickets) {
      setFilteredSupportTickets(filteredSupportTickets())
    }
  }, [filters, supportTickets])

  // Handle delete return
  const handleDelete = deletedSupportTicket => {
    setSupportTickets(prev => prev.filter(supportTicket => supportTicket._id !== deletedSupportTicket._id))
  }

  // Conditional loader
  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Support Tickets'} />
      <form>
        <label htmlFor='type'>Type</label>
        <select
          name='type'
          id='type'
          value={filters.type}
          onChange={e => handleChange(e, setFilters, filters)}>
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
          onChange={e => handleChange(e, setFilters, filters)}>
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
          {filteredSupportTickets?.length ? (
            filteredSupportTickets.map(supportTicket => {
              return (
                <SupportTicketRow
                  key={supportTicket._id}
                  supportTicket={supportTicket}
                  onDeleteCallback={handleDelete}
                />
                // <tr key={supportTicket?._id}>
                //   <td data-label='Type'>{supportTicket.type}</td>
                //   <td data-label='Message' className='support-table__message'>
                //     {supportTicket.message}
                //   </td>
                //   <td data-label='Status'>{supportTicket.status}</td>
                //   <td data-label='User'>{supportTicket.user}</td>
                //   <td data-label='Manage'>
                //     <Link
                //       to={`/support-tickets/${supportTicket._id}`}
                //       className='btn btn--subtle'
                //     >
                //       <FaPencilAlt className='btn--icon' />
                //     </Link>
                //     <button
                //       onClick={() => handleDelete(supportTicket._id)}
                //       className='btn btn--subtle'
                //     >
                //       <FaTrashAlt className='btn--icon--danger' />
                //     </button>
                //   </td>
                // </tr>
              )
            })
          ) : (
            <></>
          )}
        </tbody>
      </table>
    </>
  )
}

export default SupportTickets

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
// Custom Hooks
import { useUser } from '../hooks/useUser'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'

const Admin = () => {
  const { getUsers, deleteUser } = useUser()

  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState([])

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      const res = await getUsers()
      setUsers(res || [])
      setIsLoading(false)
    }

    fetchUsers()
  }, [])

  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return
    const res = await deleteUser(id)
    if (res) {
      setUsers(prev => prev.filter(u => u._id !== id))
    }
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Admin'} />
      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th scope='col'>Name</th>
            <th scope='col'>Email</th>
            <th scope='col'>Role</th>
            <th scope='col'>Manage</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map(u => (
              <tr key={u._id}>
                <td data-label='Name'>
                  {u.fName} {u.lName}
                </td>
                <td data-label='Email'>{u.email}</td>
                <td data-label='Role'>{u.role}</td>
                <td data-label='Manage'>
                  <Link
                    to={`/profile/${u._id}`}
                    className='btn btn--subtle'>
                    <FaPencilAlt className='btn--icon' />
                  </Link>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className='btn btn--subtle'>
                    <FaTrashAlt className='btn--icon--danger' />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}

export default Admin

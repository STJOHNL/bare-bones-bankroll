import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
// Custom Hooks
import { useUser } from '../hooks/useUser'
// Context
import { useUserContext } from '../context/UserContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'

const Admin = () => {
  const { getUsers, deleteUser } = useUser()
  const { user: currentUser } = useUserContext()

  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      setUsers((await getUsers()) || [])
      setIsLoading(false)
    }
    fetchUsers()
  }, [getUsers])

  const handleDelete = async id => {
    const res = await deleteUser(id)
    if (res) {
      setUsers(prev => prev.filter(u => u._id !== id))
    }
    setDeleteTarget(null)
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Admin'} />
      <div className='active-sessions-header'>
        <h2>Users</h2>
        <span style={{ fontSize: '0.85rem', opacity: 0.45 }}>{users.length} total</span>
      </div>
      <div className='table-responsive'>
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
                  <td data-label='Role'>
                    <span className={`badge badge--${u.role === 'Admin' ? 'in-progress' : 'planned'}`}>{u.role}</span>
                  </td>
                  <td data-label='Manage'>
                    <Link to={`/profile/${u._id}`} className='btn btn--subtle' aria-label={`Edit ${u.fName} ${u.lName}`}>
                      <FaPencilAlt className='btn--icon' />
                    </Link>
                    {u._id !== currentUser?._id && (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className='btn btn--subtle'
                        aria-label={`Delete ${u.fName} ${u.lName}`}>
                        <FaTrashAlt className='btn--icon--danger' />
                      </button>
                    )}
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
      </div>

      {deleteTarget && (
        <ConfirmModal
          message={`Delete ${deleteTarget.fName} ${deleteTarget.lName} and all of their sessions and transactions? This cannot be undone.`}
          onConfirm={() => handleDelete(deleteTarget._id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default Admin

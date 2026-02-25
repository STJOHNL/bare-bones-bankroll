import { useState } from 'react'
import { FaTrashAlt } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
// Custom Hooks
import { useBankroll } from '../hooks/useBankroll'
// Context
import { useBankrollContext } from '../context/BankrollContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'

const Bankroll = () => {
  const { createTransaction, deleteTransaction } = useBankroll()
  const { transactions, setTransactions, isLoading } = useBankrollContext()

  // Form state
  const [type, setType] = useState('Deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()

    const formData = {
      type,
      amount: parseFloat(amount),
      note,
      ...(date && { date })
    }

    const res = await createTransaction(formData)
    if (res) {
      setTransactions(prev => [res, ...prev])
      toast.success('Transaction added')
      setAmount('')
      setNote('')
      setDate('')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this transaction?')) return
    const res = await deleteTransaction(id)
    if (res) {
      setTransactions(prev => prev.filter(t => t._id !== id))
    }
  }

  const deposits = transactions.filter(t => t.type === 'Deposit' || t.type === 'Cash-out').reduce((sum, t) => sum + t.amount, 0)

  const withdrawals = transactions.filter(t => t.type === 'Withdrawal' || t.type === 'Buy-in').reduce((sum, t) => sum + t.amount, 0)

  const balance = deposits - withdrawals

  const profit = balance - deposits

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title={'Bankroll'} />

      <div className='stats'>
        <div className='stat'>
          <p>Deposits</p>
          <span className='stat__value'>${deposits.toFixed(2)}</span>
        </div>
        <div className='stat'>
          <p>Withdrawals</p>
          <span className='stat__value'>${withdrawals.toFixed(2)}</span>
        </div>
        <div className='stat'>
          <p>Balance</p>
          <span className='stat__value'>${balance.toFixed(2)}</span>
        </div>
        <div className='stat'>
          <p>Profit</p>
          <span className='stat__value'>${profit.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <h2>Add Transaction</h2>
        <label htmlFor='type'>Type</label>
        <select
          name='type'
          id='type'
          value={type}
          onChange={e => setType(e.target.value)}
          required>
          <option value='Deposit'>Deposit</option>
          <option value='Withdrawal'>Withdrawal</option>
        </select>

        <label htmlFor='amount'>Amount ($)</label>
        <input
          type='number'
          name='amount'
          id='amount'
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder='0.00'
          step='0.01'
          min='0'
          required
        />

        <label htmlFor='note'>Note</label>
        <input
          type='text'
          name='note'
          id='note'
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder='Optional note'
        />

        <label htmlFor='date'>Date</label>
        <input
          type='date'
          name='date'
          id='date'
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <button type='submit'>Add</button>
      </form>

      <table>
        <thead>
          <tr>
            <th scope='col'>Type</th>
            <th scope='col'>Amount</th>
            <th scope='col'>Note</th>
            <th scope='col'>Date</th>
            <th scope='col'>Manage</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length ? (
            [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
              <tr key={t._id}>
                <td data-label='Type'>{t.type}</td>
                <td data-label='Amount'>${t.amount.toFixed(2)}</td>
                <td data-label='Note'>{t.note || '—'}</td>
                <td data-label='Date'>{t.date ? format(new Date(t.date), 'MM/dd/yy') : '—'}</td>
                <td data-label='Manage'>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className='btn btn--subtle'>
                    <FaTrashAlt className='btn--icon--danger' />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No transactions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}

export default Bankroll

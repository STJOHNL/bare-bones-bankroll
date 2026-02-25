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

  // Filter state
  const [filterType, setFilterType] = useState('All')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

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

  const deposits = transactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0)

  const withdrawals = transactions.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0)

  const cashouts = transactions.filter(t => t.type === 'Cash-out').reduce((sum, t) => sum + t.amount, 0)
  const buyins = transactions.filter(t => t.type === 'Buy-in').reduce((sum, t) => sum + t.amount, 0)
  const promos = transactions.filter(t => t.type === 'Promo').reduce((sum, t) => sum + t.amount, 0)
  const balance = cashouts + deposits + promos - buyins

  const profit = balance - deposits

  const filteredTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(t => {
      if (filterType !== 'All' && t.type !== filterType) return false
      if (filterFrom && new Date(t.date) < new Date(filterFrom)) return false
      if (filterTo && new Date(t.date) > new Date(filterTo + 'T23:59:59')) return false
      return true
    })

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
          <option value='Promo'>Promo</option>
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

      <div className='filter-form'>
        <div>
          <label htmlFor='filterType'>Type</label>
          <select
            id='filterType'
            value={filterType}
            onChange={e => setFilterType(e.target.value)}>
            <option value='All'>All</option>
            <option value='Deposit'>Deposit</option>
            <option value='Withdrawal'>Withdrawal</option>
            <option value='Promo'>Promo</option>
            <option value='Buy-in'>Buy-in</option>
            <option value='Cash-out'>Cash-out</option>
          </select>
        </div>
        <div>
          <label htmlFor='filterFrom'>From</label>
          <input
            type='date'
            id='filterFrom'
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor='filterTo'>To</label>
          <input
            type='date'
            id='filterTo'
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
          />
        </div>
        {(filterType !== 'All' || filterFrom || filterTo) && (
          <button
            className='btn btn--subtle'
            onClick={() => {
              setFilterType('All')
              setFilterFrom('')
              setFilterTo('')
            }}>
            Clear
          </button>
        )}
      </div>

      <div className='table-scroll'>
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
            {filteredTransactions.length ? (
              filteredTransactions.map(t => (
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
                <td colSpan={5}>No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Bankroll

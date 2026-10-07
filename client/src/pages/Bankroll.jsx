import { useState, useMemo } from 'react'
import { FaTrashAlt, FaCheck, FaBan } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
// Custom Hooks
import { useBankroll } from '../hooks/useBankroll'
// Context
import { useBankrollContext } from '../context/BankrollContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'
import StatGrid from '../components/StatGrid'
// Utils
import { isCredit, isSessionTransaction } from '../utils/bankroll'
import { inDateRange, localDateToISO } from '../utils/dates'
import { formatMoney, formatPL, plColor } from '../utils/money'

const PAGE_SIZE = 20

const TYPE_HELP = {
  Purchase: 'Credits bought on the site. Enter what you paid and the chips you received — any extra counts as bonus.',
  Redemption: 'Chips cashed out to your bank. Pending redemptions leave your playable balance right away.',
  Promo: 'Free chips from promotions, rewards or giveaways.',
}

const Bankroll = () => {
  const { createTransaction, updateTransaction, deleteTransaction } = useBankroll()
  const { transactions, setTransactions, summary, isLoading } = useBankrollContext()

  // Form state
  const [type, setType] = useState('Purchase')
  const [amount, setAmount] = useState('')
  const [chips, setChips] = useState('')
  const [status, setStatus] = useState('Pending')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter state
  const [filterType, setFilterType] = useState('All')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const resetForm = () => {
    setAmount('')
    setChips('')
    setNote('')
    setDate('')
    setStatus('Pending')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!(value > 0)) {
      toast.error('Enter an amount greater than 0')
      return
    }

    // For purchases `amount` is the chips credited and `cost` the dollars paid
    const formData =
      type === 'Purchase'
        ? { type, cost: value, amount: parseFloat(chips) || value }
        : { type, amount: value, ...(type === 'Redemption' && { status }) }

    setIsSubmitting(true)
    const res = await createTransaction({
      ...formData,
      note: note.trim(),
      ...(date && { date: localDateToISO(date) }),
    })
    setIsSubmitting(false)

    if (res) {
      setTransactions(prev => [res, ...prev])
      toast.success(`${type} added`)
      resetForm()
    }
  }

  const handleStatus = async (t, nextStatus) => {
    const res = await updateTransaction(t._id, { status: nextStatus })
    if (res) {
      setTransactions(prev => prev.map(x => (x._id === t._id ? res : x)))
      toast.success(`Redemption marked ${nextStatus.toLowerCase()}`)
    }
  }

  const handleDelete = async id => {
    const res = await deleteTransaction(id)
    if (res) {
      setTransactions(prev => prev.filter(t => t._id !== id))
    }
    setDeleteTarget(null)
  }

  const filteredTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .filter(t => {
          if (filterType !== 'All' && t.type !== filterType) return false
          return inDateRange(t.date, filterFrom, filterTo)
        }),
    [transactions, filterType, filterFrom, filterTo]
  )

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedTransactions = filteredTransactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Only block the page on the first load; refreshes keep the table visible
  if (isLoading && transactions.length === 0) return <Loader />

  const describe = t => {
    if (t.type === 'Purchase') {
      const bonus = t.amount - t.cost
      return `Paid ${formatMoney(t.cost)}${bonus > 0 ? ` · +${formatMoney(bonus)} bonus` : ''}`
    }
    return null
  }

  return (
    <>
      <PageTitle title={'Bankroll'} />

      <StatGrid
        stats={[
          { label: 'Balance', value: formatPL(summary.balance), color: plColor(summary.balance) },
          { label: 'Purchased', value: formatMoney(summary.spent), hint: summary.bonus > 0 ? `+${formatMoney(summary.bonus)} bonus` : undefined },
          { label: 'Redeemed', value: formatMoney(summary.redeemed) },
          { label: 'Pending', value: formatMoney(summary.pending) },
          { label: 'Profit', value: formatPL(summary.profit), color: plColor(summary.profit) },
          { label: 'Net Cash', value: formatPL(summary.netCash), color: plColor(summary.netCash), hint: 'redeemed − purchased' },
        ]}
      />

      <div className='card'>
        <form onSubmit={handleSubmit}>
          <h2>Add Transaction</h2>
          <label htmlFor='type'>Type</label>
          <select name='type' id='type' value={type} onChange={e => setType(e.target.value)} required>
            <option value='Purchase'>Purchase</option>
            <option value='Redemption'>Redemption</option>
            <option value='Promo'>Promo</option>
          </select>
          <p className='form-hint'>{TYPE_HELP[type]}</p>

          <div className='form-row'>
            <div>
              <label htmlFor='amount'>{type === 'Purchase' ? 'Amount paid ($)' : 'Amount ($)'}</label>
              <input
                type='number'
                name='amount'
                id='amount'
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder='0.00'
                step='0.01'
                min='0.01'
                required
              />
            </div>
            {type === 'Purchase' && (
              <div>
                <label htmlFor='chips'>Chips received</label>
                <input
                  type='number'
                  name='chips'
                  id='chips'
                  value={chips}
                  onChange={e => setChips(e.target.value)}
                  placeholder={amount || 'Same as paid'}
                  step='0.01'
                  min='0.01'
                />
              </div>
            )}
            {type === 'Redemption' && (
              <div>
                <label htmlFor='status'>Status</label>
                <select id='status' value={status} onChange={e => setStatus(e.target.value)}>
                  <option value='Pending'>Pending</option>
                  <option value='Completed'>Completed</option>
                </select>
              </div>
            )}
          </div>

          <label htmlFor='note'>Note</label>
          <input
            type='text'
            name='note'
            id='note'
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='Optional note'
            maxLength={500}
          />

          <label htmlFor='date'>Date</label>
          <input type='date' name='date' id='date' value={date} onChange={e => setDate(e.target.value)} />

          <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'is-loading' : ''}>
            {isSubmitting && <span className='btn-spinner' aria-hidden='true' />}
            {isSubmitting ? 'Saving…' : 'Add'}
          </button>
        </form>
      </div>

      <div className='filter-form'>
        <div>
          <label htmlFor='filterType'>Type</label>
          <select
            id='filterType'
            value={filterType}
            onChange={e => {
              setFilterType(e.target.value)
              setPage(1)
            }}>
            <option value='All'>All</option>
            <option value='Purchase'>Purchase</option>
            <option value='Redemption'>Redemption</option>
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
            onChange={e => {
              setFilterFrom(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div>
          <label htmlFor='filterTo'>To</label>
          <input
            type='date'
            id='filterTo'
            value={filterTo}
            onChange={e => {
              setFilterTo(e.target.value)
              setPage(1)
            }}
          />
        </div>
        {(filterType !== 'All' || filterFrom || filterTo) && (
          <button
            className='btn btn--subtle'
            onClick={() => {
              setFilterType('All')
              setFilterFrom('')
              setFilterTo('')
              setPage(1)
            }}>
            Clear
          </button>
        )}
      </div>

      <div className='table-scroll'>
        <table className='table--transactions'>
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
            {pagedTransactions.length ? (
              pagedTransactions.map(t => {
                const cancelled = t.status === 'Cancelled'
                const detail = describe(t)
                return (
                  <tr key={t._id} style={cancelled ? { opacity: 0.5 } : undefined}>
                    <td data-label='Type'>
                      {t.type}
                      {t.type === 'Redemption' && (
                        <span className={`badge badge--${t.status.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>
                          {t.status}
                        </span>
                      )}
                    </td>
                    <td data-label='Amount' className={isCredit(t) ? 'amount--pos' : 'amount--neg'}>
                      {cancelled ? <s>{formatMoney(t.amount)}</s> : formatMoney(t.amount)}
                    </td>
                    <td data-label='Note'>
                      {t.note || (detail ? '' : '—')}
                      {detail && <span className='td__sub'>{detail}</span>}
                    </td>
                    <td data-label='Date'>{t.date ? format(new Date(t.date), 'MM/dd/yy') : '—'}</td>
                    <td data-label='Manage'>
                      {t.type === 'Redemption' && t.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleStatus(t, 'Completed')}
                            className='btn btn--subtle'
                            title='Mark completed'
                            aria-label='Mark redemption completed'>
                            <FaCheck className='btn--icon' />
                          </button>
                          <button
                            onClick={() => handleStatus(t, 'Cancelled')}
                            className='btn btn--subtle'
                            title='Mark cancelled'
                            aria-label='Mark redemption cancelled'>
                            <FaBan className='btn--icon' />
                          </button>
                        </>
                      )}
                      {isSessionTransaction(t) ? (
                        <span className='td__sub' title='Edit or delete the session to change this'>
                          From session
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteTarget(t._id)}
                          className='btn btn--subtle'
                          aria-label={`Delete ${t.type.toLowerCase()}`}>
                          <FaTrashAlt className='btn--icon--danger' />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>
                  {transactions.length === 0
                    ? 'No transactions yet. Add a purchase to get started.'
                    : 'No transactions match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className='pagination'>
          <button className='btn btn--subtle' onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
            ‹ Prev
          </button>
          <span>
            {safePage} / {totalPages}
          </span>
          <button
            className='btn btn--subtle'
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}>
            Next ›
          </button>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message='Delete this transaction? This cannot be undone.'
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default Bankroll

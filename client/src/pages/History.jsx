import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { FaPencilAlt, FaTrashAlt, FaCopy, FaDownload } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
// Custom Hooks
import { useSession } from '../hooks/useSession'
import { useBankrollContext } from '../context/BankrollContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'

const PAGE_SIZE = 20

const SORT_COLUMNS = [
  { key: 'name', label: 'Name', accessor: s => s.name?.toLowerCase() || '' },
  { key: 'venue', label: 'Venue', accessor: s => s.venue?.toLowerCase() || '' },
  { key: 'type', label: 'Type', accessor: s => s.type?.toLowerCase() || '' },
  { key: 'game', label: 'Game', accessor: s => s.game?.toLowerCase() || '' },
  { key: 'buyin', label: 'Buy-in', accessor: s => s.buyin ?? 0 },
  { key: 'cashout', label: 'Cash-out', accessor: s => s.cashout ?? 0 },
  { key: 'profit', label: 'Profit', accessor: s => (s.cashout ?? 0) - s.buyin },
  { key: 'start', label: 'Date', accessor: s => (s.start ? new Date(s.start).getTime() : 0) },
  { key: 'notes', label: 'Notes', accessor: s => s.notes?.toLowerCase() || '' },
]

const History = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getSessions, updateSession, deleteSession } = useSession()
  const { refetchTransactions } = useBankrollContext()

  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Inline name editing
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingId, setSavingId] = useState(null)
  const nameInputRef = useRef(null)

  // Search & filters — synced to the URL so a link into this page (e.g. from
  // the edit form's "back") restores exactly what was searched for
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10))
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [filterType, setFilterType] = useState(() => searchParams.get('type') || 'All')
  const [filterVenue, setFilterVenue] = useState(() => searchParams.get('venue') || 'All')
  const [filterGame, setFilterGame] = useState(() => searchParams.get('game') || 'All')
  const [filterFrom, setFilterFrom] = useState(() => searchParams.get('from') || '')
  const [filterTo, setFilterTo] = useState(() => searchParams.get('to') || '')
  const [filterBuyinMin, setFilterBuyinMin] = useState(() => searchParams.get('buyinMin') || '')
  const [filterBuyinMax, setFilterBuyinMax] = useState(() => searchParams.get('buyinMax') || '')

  // Sort — defaults match the original fixed "most recent first" ordering
  const [sortField, setSortField] = useState(() => searchParams.get('sort') || 'start')
  const [sortDir, setSortDir] = useState(() => searchParams.get('dir') || 'desc')

  const handleSort = key => {
    if (sortField === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  useEffect(() => {
    const next = {}
    if (query) next.q = query
    if (filterType !== 'All') next.type = filterType
    if (filterVenue !== 'All') next.venue = filterVenue
    if (filterGame !== 'All') next.game = filterGame
    if (filterFrom) next.from = filterFrom
    if (filterTo) next.to = filterTo
    if (filterBuyinMin) next.buyinMin = filterBuyinMin
    if (filterBuyinMax) next.buyinMax = filterBuyinMax
    if (sortField !== 'start') next.sort = sortField
    if (sortDir !== 'desc') next.dir = sortDir
    if (page !== 1) next.page = String(page)
    setSearchParams(next, { replace: true })
  }, [query, filterType, filterVenue, filterGame, filterFrom, filterTo, filterBuyinMin, filterBuyinMax, sortField, sortDir, page, setSearchParams])

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      const res = await getSessions()
      setSessions(res || [])
      setIsLoading(false)
    }
    fetchSessions()
  }, [])

  useEffect(() => {
    if (editingId && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingId])

  const allCompleted = useMemo(() => sessions.filter(s => !!s.end), [sessions])

  const hasActiveFilters =
    query || filterType !== 'All' || filterVenue !== 'All' || filterGame !== 'All' || filterFrom || filterTo || filterBuyinMin || filterBuyinMax

  const clearFilters = () => {
    setQuery('')
    setFilterType('All')
    setFilterVenue('All')
    setFilterGame('All')
    setFilterFrom('')
    setFilterTo('')
    setFilterBuyinMin('')
    setFilterBuyinMax('')
    setPage(1)
  }

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const buyinMin = parseFloat(filterBuyinMin)
    const buyinMax = parseFloat(filterBuyinMax)
    return allCompleted
      .filter(s => {
        if (q && !`${s.name} ${s.notes || ''}`.toLowerCase().includes(q)) return false
        if (filterType !== 'All' && s.type !== filterType) return false
        if (filterVenue !== 'All' && s.venue !== filterVenue) return false
        if (filterGame !== 'All' && s.game !== filterGame) return false
        if (filterFrom && new Date(s.start) < new Date(filterFrom)) return false
        if (filterTo && new Date(s.start) > new Date(filterTo + 'T23:59:59')) return false
        if (!Number.isNaN(buyinMin) && s.buyin < buyinMin) return false
        if (!Number.isNaN(buyinMax) && s.buyin > buyinMax) return false
        return true
      })
      .sort((a, b) => {
        const { accessor } = SORT_COLUMNS.find(c => c.key === sortField)
        const av = accessor(a)
        const bv = accessor(b)
        const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [allCompleted, query, filterType, filterVenue, filterGame, filterFrom, filterTo, filterBuyinMin, filterBuyinMax, sortField, sortDir])

  const { totalPL, count } = useMemo(
    () =>
      filteredSessions.reduce(
        (acc, s) => {
          acc.totalPL += (s.cashout ?? 0) - s.buyin
          acc.count += 1
          return acc
        },
        { totalPL: 0, count: 0 }
      ),
    [filteredSessions]
  )

  const handleDelete = useCallback(
    async id => {
      const res = await deleteSession(id)
      if (res) {
        setSessions(prev => prev.filter(s => s._id !== id))
        await refetchTransactions()
      }
      setDeleteTarget(null)
    },
    [deleteSession, refetchTransactions]
  )

  const startEditName = session => {
    setEditingId(session._id)
    setEditingName(session.name)
  }

  const cancelEditName = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveEditName = useCallback(
    async session => {
      const trimmed = editingName.trim()
      if (!trimmed || trimmed === session.name) {
        cancelEditName()
        return
      }
      setSavingId(session._id)
      const res = await updateSession({
        id: session._id,
        venue: session.venue,
        type: session.type,
        game: session.game,
        name: trimmed,
        buyin: session.buyin,
        cashout: session.cashout || 0,
        start: session.start,
        end: session.end || '',
        notes: session.notes || ''
      })
      if (res) {
        setSessions(prev => prev.map(s => (s._id === session._id ? res : s)))
        toast.success('Name updated')
      }
      setSavingId(null)
      cancelEditName()
    },
    [editingName, updateSession]
  )

  const exportCsv = useCallback(() => {
    const headers = ['Name', 'Venue', 'Type', 'Game', 'Buy-in', 'Cash-out', 'Profit', 'Date', 'Duration (hrs)', 'Notes']
    const rows = filteredSessions.map(s => {
      const profit = ((s.cashout ?? 0) - s.buyin).toFixed(2)
      const durationHrs = s.start && s.end ? ((new Date(s.end) - new Date(s.start)) / 3600000).toFixed(2) : ''
      const escapedNotes = s.notes ? `"${s.notes.replace(/"/g, '""')}"` : ''
      return [s.name, s.venue, s.type, s.game, s.buyin, s.cashout ?? 0, profit, s.start ? format(new Date(s.start), 'yyyy-MM-dd') : '', durationHrs, escapedNotes].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sessions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredSessions])

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedSessions = filteredSessions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title='History' hideTitle />

      <div className='active-sessions-header'>
        <h1>History</h1>
        {filteredSessions.length > 0 && (
          <button
            className='btn btn--subtle'
            onClick={exportCsv}
            title='Export CSV'
            aria-label='Export sessions as CSV'>
            <FaDownload className='btn--icon' /> Export
          </button>
        )}
      </div>

      {allCompleted.length === 0 ? (
        <div className='empty-state'>
          <span className='empty-state__title'>No sessions yet</span>
          <span className='empty-state__desc'>Complete a session to see it show up here.</span>
        </div>
      ) : (
        <>
          <div className='filter-form'>
            <div>
              <label htmlFor='query'>Search</label>
              <input
                type='text'
                id='query'
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1) }}
                placeholder='Name or notes…'
              />
            </div>
            <div>
              <label htmlFor='filterType'>Type</label>
              <select
                id='filterType'
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setPage(1) }}>
                <option value='All'>All</option>
                <option value='Cash'>Cash</option>
                <option value='Tournament'>Tournament</option>
              </select>
            </div>
            <div>
              <label htmlFor='filterVenue'>Venue</label>
              <select
                id='filterVenue'
                value={filterVenue}
                onChange={e => { setFilterVenue(e.target.value); setPage(1) }}>
                <option value='All'>All</option>
                <option value='Online'>Online</option>
                <option value='Live'>Live</option>
              </select>
            </div>
            <div>
              <label htmlFor='filterGame'>Game</label>
              <select
                id='filterGame'
                value={filterGame}
                onChange={e => { setFilterGame(e.target.value); setPage(1) }}>
                <option value='All'>All</option>
                <option value='NL'>NL</option>
                <option value='PLO'>PLO</option>
              </select>
            </div>
            <div>
              <label htmlFor='filterFrom'>From</label>
              <input
                type='date'
                id='filterFrom'
                value={filterFrom}
                onChange={e => { setFilterFrom(e.target.value); setPage(1) }}
              />
            </div>
            <div>
              <label htmlFor='filterTo'>To</label>
              <input
                type='date'
                id='filterTo'
                value={filterTo}
                onChange={e => { setFilterTo(e.target.value); setPage(1) }}
              />
            </div>
            <div>
              <label htmlFor='filterBuyinMin'>Min Buy-in ($)</label>
              <input
                type='number'
                id='filterBuyinMin'
                value={filterBuyinMin}
                onChange={e => { setFilterBuyinMin(e.target.value); setPage(1) }}
                placeholder='0'
                min='0'
                step='0.01'
              />
            </div>
            <div>
              <label htmlFor='filterBuyinMax'>Max Buy-in ($)</label>
              <input
                type='number'
                id='filterBuyinMax'
                value={filterBuyinMax}
                onChange={e => { setFilterBuyinMax(e.target.value); setPage(1) }}
                placeholder='Any'
                min='0'
                step='0.01'
              />
            </div>
            {hasActiveFilters && (
              <button className='btn btn--subtle' onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.85rem', opacity: 0.55, margin: '0.75rem 0 0' }}>
            {count} session{count === 1 ? '' : 's'} · P/L{' '}
            <span style={{ color: totalPL >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
              ${totalPL.toFixed(2)}
            </span>
          </p>

          <div className='table-responsive'>
          <table className='table--sessions'>
            <thead>
              <tr>
                {SORT_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    scope='col'
                    aria-sort={sortField === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      type='button'
                      className='th-sort'
                      onClick={() => handleSort(col.key)}
                      aria-label={`Sort by ${col.label}`}>
                      {col.label}
                      {sortField === col.key && (
                        <span className='th-sort__icon' aria-hidden='true'>{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </th>
                ))}
                <th scope='col'>Manage</th>
              </tr>
            </thead>
            <tbody>
              {pagedSessions.length > 0 ? (
                pagedSessions.map(session => (
                  <tr key={session._id}>
                    <td data-label='Name'>
                      {editingId === session._id ? (
                        <input
                          ref={nameInputRef}
                          type='text'
                          className='inline-edit-input'
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onBlur={() => saveEditName(session)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); saveEditName(session) }
                            if (e.key === 'Escape') { e.preventDefault(); cancelEditName() }
                          }}
                          disabled={savingId === session._id}
                          aria-label={`Edit name for ${session.name}`}
                        />
                      ) : (
                        <button
                          type='button'
                          className='inline-edit-trigger'
                          onClick={() => startEditName(session)}
                          title='Click to rename'
                          aria-label={`Edit name for ${session.name}`}>
                          {session.name}
                        </button>
                      )}
                    </td>
                    <td data-label='Venue'>{session.venue}</td>
                    <td data-label='Type'>{session.type}</td>
                    <td data-label='Game'>{session.game}</td>
                    <td data-label='Buy-in'>${session.buyin}</td>
                    <td data-label='Cash-out'>${session.cashout}</td>
                    <td
                      data-label='Profit'
                      style={{ color: session.cashout - session.buyin >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      ${(session.cashout - session.buyin).toFixed(2)}
                    </td>
                    <td data-label='Date'>{session.start ? format(new Date(session.start), 'MM/dd/yy h:mm a') : '—'}</td>
                    <td data-label='Notes' className='td--notes'>
                      {session.notes ? <span title={session.notes}>{session.notes.length > 30 ? session.notes.slice(0, 30) + '…' : session.notes}</span> : <span style={{ opacity: 0.3 }}>—</span>}
                    </td>
                    <td data-label='Manage'>
                      <button
                        onClick={() => navigate('/sessions/new', { state: { prefill: session } })}
                        className='btn btn--subtle'
                        title='Duplicate'
                        aria-label={`Duplicate ${session.name}`}>
                        <FaCopy className='btn--icon' />
                      </button>
                      <Link
                        to={`/sessions/${session._id}/edit`}
                        state={{ returnTo: `${location.pathname}${location.search}` }}
                        className='btn btn--subtle'
                        aria-label={`Edit ${session.name}`}>
                        <FaPencilAlt className='btn--icon' />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(session._id)}
                        className='btn btn--subtle'
                        aria-label={`Delete ${session.name}`}>
                        <FaTrashAlt className='btn--icon--danger' />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', opacity: 0.4 }}>
                    No sessions match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {totalPages > 1 && (
            <div className='pagination'>
              <button
                className='btn btn--subtle'
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}>
                ‹ Prev
              </button>
              <span>{safePage} / {totalPages}</span>
              <button
                className='btn btn--subtle'
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}>
                Next ›
              </button>
            </div>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          message='Delete this session? This cannot be undone.'
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default History

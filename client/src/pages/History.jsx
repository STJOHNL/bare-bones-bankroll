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
// Utils
import { isCompleted, sessionPL } from '../utils/stats'
import { sessionLabel, sessionStakes } from '../utils/stakes'
import { inDateRange } from '../utils/dates'
import { SESSION_CSV_COLUMNS, downloadCsv, toCsv } from '../utils/csv'
import { formatMoney, formatPL, plColor } from '../utils/money'

const PAGE_SIZE = 20

const SORT_COLUMNS = [
  { key: 'name', label: 'Name', accessor: s => sessionLabel(s).toLowerCase() },
  { key: 'venue', label: 'Venue', accessor: s => s.venue?.toLowerCase() || '' },
  { key: 'type', label: 'Type', accessor: s => s.type?.toLowerCase() || '' },
  { key: 'game', label: 'Game', accessor: s => s.game?.toLowerCase() || '' },
  { key: 'buyin', label: 'Buy-in', accessor: s => s.buyin ?? 0 },
  { key: 'cashout', label: 'Cash-out', accessor: s => s.cashout ?? 0 },
  { key: 'profit', label: 'Profit', accessor: sessionPL },
  { key: 'start', label: 'Date', accessor: s => (s.start ? new Date(s.start).getTime() : 0) },
  { key: 'notes', label: 'Notes', accessor: s => s.notes?.toLowerCase() || '' },
]

const sortColumn = key => SORT_COLUMNS.find(c => c.key === key) || SORT_COLUMNS.find(c => c.key === 'start')

const History = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getSessions, updateSession, deleteSession } = useSession()
  const { refetchTransactions } = useBankrollContext()

  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Inline tournament-name editing (cash names come from their stakes)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef(null)
  const savingRef = useRef(false)

  // Search & filters — synced to the URL so a link into this page (e.g. from
  // the edit form's "back") restores exactly what was searched for
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get('page'), 10) || 1))
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [filterType, setFilterType] = useState(() => searchParams.get('type') || 'All')
  const [filterVenue, setFilterVenue] = useState(() => searchParams.get('venue') || 'All')
  const [filterGame, setFilterGame] = useState(() => searchParams.get('game') || 'All')
  const [filterStakes, setFilterStakes] = useState(() => searchParams.get('stakes') || 'All')
  const [filterFrom, setFilterFrom] = useState(() => searchParams.get('from') || '')
  const [filterTo, setFilterTo] = useState(() => searchParams.get('to') || '')
  const [filterBuyinMin, setFilterBuyinMin] = useState(() => searchParams.get('buyinMin') || '')
  const [filterBuyinMax, setFilterBuyinMax] = useState(() => searchParams.get('buyinMax') || '')

  // Sort — unknown values from the URL fall back to "most recent first"
  const [sortField, setSortField] = useState(() => sortColumn(searchParams.get('sort')).key)
  const [sortDir, setSortDir] = useState(() => (searchParams.get('dir') === 'asc' ? 'asc' : 'desc'))

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
    if (filterStakes !== 'All') next.stakes = filterStakes
    if (filterFrom) next.from = filterFrom
    if (filterTo) next.to = filterTo
    if (filterBuyinMin) next.buyinMin = filterBuyinMin
    if (filterBuyinMax) next.buyinMax = filterBuyinMax
    if (sortField !== 'start') next.sort = sortField
    if (sortDir !== 'desc') next.dir = sortDir
    if (page !== 1) next.page = String(page)
    setSearchParams(next, { replace: true })
  }, [query, filterType, filterVenue, filterGame, filterStakes, filterFrom, filterTo, filterBuyinMin, filterBuyinMax, sortField, sortDir, page, setSearchParams])

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true)
      setSessions((await getSessions()) || [])
      setIsLoading(false)
    }
    fetchSessions()
  }, [getSessions])

  useEffect(() => {
    if (editingId && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingId])

  const allCompleted = useMemo(() => sessions.filter(isCompleted), [sessions])

  const stakeOptions = useMemo(
    () =>
      [...new Set(allCompleted.filter(s => sessionStakes(s)).map(sessionLabel))].sort(
        (a, b) => parseFloat(a.replace(/^\D+/, '')) - parseFloat(b.replace(/^\D+/, '')) || a.localeCompare(b)
      ),
    [allCompleted]
  )

  const hasActiveFilters =
    query ||
    filterType !== 'All' ||
    filterVenue !== 'All' ||
    filterGame !== 'All' ||
    filterStakes !== 'All' ||
    filterFrom ||
    filterTo ||
    filterBuyinMin ||
    filterBuyinMax

  const clearFilters = () => {
    setQuery('')
    setFilterType('All')
    setFilterVenue('All')
    setFilterGame('All')
    setFilterStakes('All')
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
    const { accessor } = sortColumn(sortField)
    return allCompleted
      .filter(s => {
        if (q && !`${sessionLabel(s)} ${s.notes || ''}`.toLowerCase().includes(q)) return false
        if (filterType !== 'All' && s.type !== filterType) return false
        if (filterVenue !== 'All' && s.venue !== filterVenue) return false
        if (filterGame !== 'All' && s.game !== filterGame) return false
        if (filterStakes !== 'All' && (!sessionStakes(s) || sessionLabel(s) !== filterStakes)) return false
        if (!inDateRange(s.start, filterFrom, filterTo)) return false
        if (!Number.isNaN(buyinMin) && s.buyin < buyinMin) return false
        if (!Number.isNaN(buyinMax) && s.buyin > buyinMax) return false
        return true
      })
      .sort((a, b) => {
        const av = accessor(a)
        const bv = accessor(b)
        const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [allCompleted, query, filterType, filterVenue, filterGame, filterStakes, filterFrom, filterTo, filterBuyinMin, filterBuyinMax, sortField, sortDir])

  const totalPL = useMemo(() => filteredSessions.reduce((sum, s) => sum + sessionPL(s), 0), [filteredSessions])
  const count = filteredSessions.length

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
    setEditingName(session.name || '')
  }

  const cancelEditName = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveEditName = async session => {
    // Enter saves and then blurs the input — only handle the first of the two
    if (savingRef.current) return
    const trimmed = editingName.trim()
    if (!trimmed || trimmed === session.name) {
      cancelEditName()
      return
    }
    savingRef.current = true
    const res = await updateSession({ id: session._id, name: trimmed })
    if (res) {
      setSessions(prev => prev.map(s => (s._id === session._id ? res : s)))
      toast.success('Name updated')
    }
    savingRef.current = false
    cancelEditName()
  }

  const exportCsv = useCallback(() => {
    // Same columns the Profile importer reads, plus a computed profit column
    const headers = [...SESSION_CSV_COLUMNS, 'profit']
    const rows = filteredSessions.map(s => {
      const stakes = sessionStakes(s)
      return [
        s.venue,
        s.type,
        s.game,
        sessionLabel(s),
        stakes?.sb ?? '',
        stakes?.bb ?? '',
        s.hands ?? '',
        s.buyin ?? 0,
        s.cashout ?? 0,
        s.start ? new Date(s.start).toISOString() : '',
        s.end ? new Date(s.end).toISOString() : '',
        s.notes || '',
        sessionPL(s).toFixed(2),
      ]
    })
    downloadCsv(`sessions-${format(new Date(), 'yyyy-MM-dd')}.csv`, toCsv(headers, rows))
  }, [filteredSessions])

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedSessions = filteredSessions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const onFilter = setter => e => {
    setter(e.target.value)
    setPage(1)
  }

  if (isLoading) return <Loader />

  return (
    <>
      <PageTitle title='History' hideTitle />

      <div className='active-sessions-header'>
        <h1>History</h1>
        {filteredSessions.length > 0 && (
          <button className='btn btn--subtle' onClick={exportCsv} title='Export CSV' aria-label='Export sessions as CSV'>
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
              <input type='text' id='query' value={query} onChange={onFilter(setQuery)} placeholder='Name or notes…' />
            </div>
            <div>
              <label htmlFor='filterType'>Type</label>
              <select id='filterType' value={filterType} onChange={onFilter(setFilterType)}>
                <option value='All'>All</option>
                <option value='Cash'>Cash</option>
                <option value='Tournament'>Tournament</option>
              </select>
            </div>
            <div>
              <label htmlFor='filterStakes'>Stakes</label>
              <select id='filterStakes' value={filterStakes} onChange={onFilter(setFilterStakes)}>
                <option value='All'>All</option>
                {stakeOptions.map(label => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='filterVenue'>Venue</label>
              <select id='filterVenue' value={filterVenue} onChange={onFilter(setFilterVenue)}>
                <option value='All'>All</option>
                <option value='Online'>Online</option>
                <option value='Live'>Live</option>
              </select>
            </div>
            <div>
              <label htmlFor='filterGame'>Game</label>
              <select id='filterGame' value={filterGame} onChange={onFilter(setFilterGame)}>
                <option value='All'>All</option>
                <option value='NL'>NL</option>
                <option value='PLO'>PLO</option>
              </select>
            </div>
            <div>
              <label htmlFor='filterFrom'>From</label>
              <input type='date' id='filterFrom' value={filterFrom} onChange={onFilter(setFilterFrom)} />
            </div>
            <div>
              <label htmlFor='filterTo'>To</label>
              <input type='date' id='filterTo' value={filterTo} onChange={onFilter(setFilterTo)} />
            </div>
            <div>
              <label htmlFor='filterBuyinMin'>Min Buy-in ($)</label>
              <input
                type='number'
                id='filterBuyinMin'
                value={filterBuyinMin}
                onChange={onFilter(setFilterBuyinMin)}
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
                onChange={onFilter(setFilterBuyinMax)}
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
            <span style={{ color: plColor(totalPL), fontWeight: 600 }}>{formatPL(totalPL)}</span>
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
                          <span className='th-sort__icon' aria-hidden='true'>
                            {sortDir === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                  <th scope='col'>Manage</th>
                </tr>
              </thead>
              <tbody>
                {pagedSessions.length > 0 ? (
                  pagedSessions.map(session => {
                    const label = sessionLabel(session)
                    const pl = sessionPL(session)
                    return (
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
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  saveEditName(session)
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault()
                                  cancelEditName()
                                }
                              }}
                              maxLength={200}
                              aria-label={`Edit name for ${label}`}
                            />
                          ) : session.type === 'Tournament' ? (
                            <button
                              type='button'
                              className='inline-edit-trigger'
                              onClick={() => startEditName(session)}
                              title='Click to rename'
                              aria-label={`Edit name for ${label}`}>
                              {label}
                            </button>
                          ) : (
                            label
                          )}
                        </td>
                        <td data-label='Venue'>{session.venue}</td>
                        <td data-label='Type'>{session.type}</td>
                        <td data-label='Game'>{session.game}</td>
                        <td data-label='Buy-in'>{formatMoney(session.buyin)}</td>
                        <td data-label='Cash-out'>{formatMoney(session.cashout)}</td>
                        <td data-label='Profit' style={{ color: plColor(pl) }}>
                          {formatPL(pl)}
                        </td>
                        <td data-label='Date'>
                          {session.start ? format(new Date(session.start), 'MM/dd/yy h:mm a') : '—'}
                        </td>
                        <td data-label='Notes' className='td--notes'>
                          {session.notes ? (
                            <span title={session.notes}>
                              {session.notes.length > 30 ? session.notes.slice(0, 30) + '…' : session.notes}
                            </span>
                          ) : (
                            <span style={{ opacity: 0.3 }}>—</span>
                          )}
                        </td>
                        <td data-label='Manage'>
                          <button
                            onClick={() => navigate('/sessions/new', { state: { prefill: session } })}
                            className='btn btn--subtle'
                            title='Duplicate'
                            aria-label={`Duplicate ${label}`}>
                            <FaCopy className='btn--icon' />
                          </button>
                          <Link
                            to={`/sessions/${session._id}/edit`}
                            state={{ returnTo: `${location.pathname}${location.search}` }}
                            className='btn btn--subtle'
                            aria-label={`Edit ${label}`}>
                            <FaPencilAlt className='btn--icon' />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(session._id)}
                            className='btn btn--subtle'
                            aria-label={`Delete ${label}`}>
                            <FaTrashAlt className='btn--icon--danger' />
                          </button>
                        </td>
                      </tr>
                    )
                  })
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

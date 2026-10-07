import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { FaFileImport } from 'react-icons/fa'
import toast from 'react-hot-toast'
// Custom Hooks
import { useUser } from '../hooks/useUser'
import { useSession } from '../hooks/useSession'
// Context
import { useBankrollContext } from '../context/BankrollContext'
// Components
import Loader from '../components/Loader'
import PageTitle from '../components/PageTitle'
import UserForm from '../components/forms/UserForm'
// Utils
import { SESSION_CSV_COLUMNS, parseCsvObjects } from '../utils/csv'

const parseTimestamp = str => {
  if (!str) return null
  // Normalize single-digit time parts: T5:46:0 → T05:46:00
  const normalized = str.replace(/T(\d{1,2}):(\d{1,2}):(\d{1,2})/, (_, h, m, s) =>
    `T${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`)
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

const number = str => (str === '' || str == null ? undefined : parseFloat(str))

// Older exports used title-case headers ('Buy-in', 'Date'); map them onto the import columns
const HEADER_ALIASES = { 'buy-in': 'buyin', 'cash-out': 'cashout', date: 'start' }

const toSession = raw => {
  const row = Object.fromEntries(Object.entries(raw).map(([k, v]) => [HEADER_ALIASES[k] || k, v]))
  return {
    venue: row.venue,
    type: row.type,
    game: row.game,
    ...(row.name && { name: row.name }),
    ...(number(row.sb) !== undefined && { sb: number(row.sb) }),
    ...(number(row.bb) !== undefined && { bb: number(row.bb) }),
    ...(number(row.hands) !== undefined && { hands: parseInt(row.hands, 10) }),
    buyin: number(row.buyin) ?? 0,
    cashout: number(row.cashout) ?? 0,
    ...(parseTimestamp(row.start) && { start: parseTimestamp(row.start) }),
    ...(parseTimestamp(row.end) && { end: parseTimestamp(row.end) }),
    ...(row.notes && { notes: row.notes }),
  }
}

const Profile = () => {
  const { getUser } = useUser()
  const { importSessions } = useSession()
  const { refetchTransactions } = useBankrollContext()
  const { id } = useParams()

  const csvInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [formUser, setFormUser] = useState()

  const handleCsvImport = async e => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    const rows = parseCsvObjects(await file.text())
    if (!rows.length) {
      toast.error('That file has no rows to import')
      return
    }

    // The server validates every row and reports the ones it skipped
    setIsImporting(true)
    const res = await importSessions(rows.map(toSession))
    setIsImporting(false)
    if (!res) return

    if (res.imported) toast.success(`Imported ${res.imported} session(s)`)
    if (res.skipped?.length) {
      const preview = res.skipped
        .slice(0, 3)
        // `row` counts data rows from 1; the header makes it one more in the file
        .map(s => `line ${s.row + 1}: ${s.reason}`)
        .join('; ')
      toast.error(`Skipped ${res.skipped.length} row(s) — ${preview}${res.skipped.length > 3 ? '…' : ''}`, {
        duration: 8000,
      })
    }
    if (res.imported) await refetchTransactions()
  }

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      setFormUser(await getUser(id))
      setIsLoading(false)
    }
    fetchUser()
  }, [id, getUser])

  // Conditional loader
  if (isLoading) return <Loader />

  const initials = formUser ? `${formUser.fName?.[0] || ''}${formUser.lName?.[0] || ''}`.toUpperCase() : ''

  const fullName = formUser?.fName ? `${formUser.fName} ${formUser.lName}`.trim() : 'Profile'

  return (
    <>
      <PageTitle title={fullName} hideTitle />

      {formUser && (
        <div className='profile-header'>
          <div className='profile-avatar'>{initials}</div>
          <div className='profile-header__info'>
            <h1 className='heading-xl'>{fullName}</h1>
            <p className='profile-email'>{formUser.email}</p>
          </div>
        </div>
      )}

      {formUser && (
        <div className='profile-card'>
          <UserForm parentData={formUser} buttonText={'Save Changes'} onSubmitCallback={setFormUser} />
        </div>
      )}

      <div className='profile-card'>
        <h2>Import Sessions</h2>
        <p className='profile-card__desc'>
          Bulk import past sessions from a CSV file. Files exported from History import as-is.
        </p>
        <input
          ref={csvInputRef}
          type='file'
          accept='.csv'
          style={{ display: 'none' }}
          onChange={handleCsvImport}
          aria-label='CSV file to import'
        />
        <button className='import-zone' onClick={() => csvInputRef.current.click()} disabled={isImporting}>
          <FaFileImport className='import-zone__icon' />
          <span>{isImporting ? 'Importing…' : 'Click to upload a CSV'}</span>
          <span className='import-zone__hint'>{SESSION_CSV_COLUMNS.join(', ')}</span>
        </button>
      </div>
    </>
  )
}

export default Profile

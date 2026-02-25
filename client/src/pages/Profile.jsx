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

const parseCSVLine = line => {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current.trim())
  return result
}

const parseTimestamp = str => {
  if (!str) return null
  // Normalize single-digit time parts: T5:46:0 → T05:46:00
  const normalized = str.replace(/T(\d{1,2}):(\d{1,2}):(\d{1,2})/, (_, h, m, s) =>
    `T${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`)
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

const Profile = () => {
  const { getUser } = useUser()
  const { importSessions } = useSession()
  const { setTransactions } = useBankrollContext()
  const { id } = useParams()

  const csvInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formUser, setFormUser] = useState()

  const handleCsvImport = async e => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    const lines = text.trim().split('\n').filter(l => l.trim())
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
    const validVenues = ['Online', 'Live']
    const validTypes = ['Cash', 'Tournament']
    const validGames = ['NL', 'PLO']
    const sessions = []
    const skipped = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })

      if (!validVenues.includes(row.venue)) { skipped.push(i + 1); continue }
      if (!validTypes.includes(row.type)) { skipped.push(i + 1); continue }
      if (!validGames.includes(row.game)) { skipped.push(i + 1); continue }

      sessions.push({
        venue: row.venue,
        type: row.type,
        game: row.game,
        ...(row.name && { name: row.name }),
        ...(row.buyin && { buyin: parseFloat(row.buyin) }),
        ...(row.cashout && { cashout: parseFloat(row.cashout) }),
        ...(parseTimestamp(row.start) && { start: parseTimestamp(row.start) }),
        ...(parseTimestamp(row.end) && { end: parseTimestamp(row.end) }),
        ...(row.notes && { notes: row.notes })
      })
    }

    if (skipped.length) toast.error(`Skipped ${skipped.length} invalid row(s)`)
    if (sessions.length) {
      const res = await importSessions(sessions)
      if (res) {
        toast.success(`Imported ${res.imported} session(s)`)
        if (res.transactions?.length) setTransactions(prev => [...res.transactions, ...prev])
      }
    }
    e.target.value = ''
  }

  useEffect(() => {
    const fetchUser = async (id) => {
      setIsLoading(true)
      const res = await getUser(id)
      setFormUser(res)
      setIsLoading(false)
    }
    fetchUser(id)
  }, [id])

  // Conditional loader
  if (isLoading) return <Loader />

  const initials = formUser
    ? `${formUser.fName?.[0] || ''}${formUser.lName?.[0] || ''}`.toUpperCase()
    : ''

  const fullName = formUser?.fName
    ? `${formUser.fName} ${formUser.lName}`.trim()
    : 'Profile'

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

      <div className='profile-card'>
        <UserForm parentData={formUser} buttonText={'Save Changes'} />
      </div>

      <div className='profile-card'>
        <h2>Import Sessions</h2>
        <p className='profile-card__desc'>Bulk import past sessions from a CSV file.</p>
        <input
          ref={csvInputRef}
          type='file'
          accept='.csv'
          style={{ display: 'none' }}
          onChange={handleCsvImport}
        />
        <button className='import-zone' onClick={() => csvInputRef.current.click()}>
          <FaFileImport className='import-zone__icon' />
          <span>Click to upload a CSV</span>
          <span className='import-zone__hint'>venue, type, game, name, buyin, cashout, start, end, notes</span>
        </button>
      </div>
    </>
  )
}

export default Profile

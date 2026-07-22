import { useState, useEffect, useCallback, useRef } from 'react'
import { FaPlus, FaPencilAlt, FaTrashAlt, FaSearch } from 'react-icons/fa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import PageTitle from '../components/PageTitle'
import ConfirmModal from '../components/ConfirmModal'
import Loader from '../components/Loader'
import { usePlayerNote } from '../hooks/usePlayerNote'
import {
  createSavedHand,
  loadSavedHands,
  saveSavedHands,
  SAVED_HANDS_STORAGE_KEY,
} from '../utils/randomizerSavedHands'

const yesGifs = Object.values(
  import.meta.glob('../assets/NumGenGifs/yes*.gif', {
    eager: true,
    query: '?url',
    import: 'default',
  })
)
const noGifs = Object.values(
  import.meta.glob('../assets/NumGenGifs/no*.gif', {
    eager: true,
    query: '?url',
    import: 'default',
  })
)

const Randomizer = () => {
  const { getPlayerNotes, createPlayerNote, updatePlayerNote, deletePlayerNote } = usePlayerNote()

  // ── RNG ──────────────────────────────────────────────────────────────────
  const [rngResult, setRngResult] = useState(null)
  const [rngGif, setRngGif] = useState(null)
  const [rolling, setRolling] = useState(false)
  const spinIntervalRef = useRef(null)
  const spinTimeoutRef = useRef(null)

  const roll = useCallback(() => {
    setRolling(true)
    setRngGif(null)

    clearInterval(spinIntervalRef.current)
    clearTimeout(spinTimeoutRef.current)

    // Rapidly cycle the number to give the impression of it spinning/randomizing
    spinIntervalRef.current = setInterval(() => {
      setRngResult(Math.floor(Math.random() * 100) + 1)
    }, 40)

    spinTimeoutRef.current = setTimeout(() => {
      clearInterval(spinIntervalRef.current)
      const n = Math.floor(Math.random() * 100) + 1
      const pool = n >= 50 ? yesGifs : noGifs
      setRngResult(n)
      setRngGif(pool[Math.floor(Math.random() * pool.length)])
      setRolling(false)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(spinIntervalRef.current)
      clearTimeout(spinTimeoutRef.current)
    }
  }, [])

  // ── Pot odds ─────────────────────────────────────────────────────────────
  const [pot, setPot] = useState('')
  const [bet, setBet] = useState('')
  const [outs, setOuts] = useState('')

  // ── Chip Stack Calculator ─────────────────────────────────────────────────
  const [chipEntries, setChipEntries] = useState('')
  const [chipStartStack, setChipStartStack] = useState('')
  const [chipTarget, setChipTarget] = useState('')
  const [chipCurrentPlayers, setChipCurrentPlayers] = useState('')
  const [chipCurrentStack, setChipCurrentStack] = useState('')

  const potOddsCalc = (() => {
    const p = parseFloat(pot)
    const b = parseFloat(bet)
    const o = parseInt(outs)
    if (!p || !b) return null
    const potOdds = (b / (p + b * 2)) * 100
    const turnEquity = o > 0 ? o * 2 : null
    const flopEquity = o > 0 ? Math.min(o * 4, 100) : null
    return { potOdds, turnEquity, flopEquity }
  })()

  const chipCalc = (() => {
    const entries = parseInt(chipEntries)
    const start = parseInt(chipStartStack)
    const target = parseInt(chipTarget)
    if (!entries || !start || !target || target >= entries) return null
    const total = entries * start
    const avgAtTarget = Math.round(total / target)
    const currentPlayers = parseInt(chipCurrentPlayers) || null
    const myStack = chipCurrentStack !== '' ? parseInt(chipCurrentStack) : null
    const currentAvg = currentPlayers && currentPlayers < entries ? Math.round(total / currentPlayers) : null
    const gap = myStack !== null ? avgAtTarget - myStack : null
    return {
      total,
      avgAtTarget,
      comfortable: Math.round(avgAtTarget * 2),
      danger: Math.round(avgAtTarget * 0.5),
      currentAvg,
      myStack,
      gap,
    }
  })()

  // ── Player notes ─────────────────────────────────────────────────────────
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNote, setNewNote] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // ── Saved hands ─────────────────────────────────────────────────────
  const [savedHands, setSavedHands] = useState([])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveNotes, setSaveNotes] = useState('')
  const [saveDetails, setSaveDetails] = useState('')

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      const data = await getPlayerNotes()
      setNotes(data || [])
      setIsLoading(false)
    }
    fetch()
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const created = await createPlayerNote({ name: newName.trim(), notes: newNote.trim() })
    if (created) {
      setNotes(prev => [created, ...prev])
      setNewName('')
      setNewNote('')
      setAddOpen(false)
      toast.success('Note saved!')
    }
    setSaving(false)
  }

  const handleEdit = note => {
    setEditId(note._id)
    setEditName(note.name)
    setEditNote(note.notes)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    const updated = await updatePlayerNote(editId, {
      name: editName.trim(),
      notes: editNote.trim(),
    })
    if (updated) {
      setNotes(prev => prev.map(n => (n._id === editId ? updated : n)))
      setEditId(null)
      toast.success('Note updated!')
    }
    setSaving(false)
  }

  const handleDelete = async id => {
    const res = await deletePlayerNote(id)
    if (res) {
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success('Note deleted.')
    }
    setDeleteTarget(null)
  }

  const filtered = search.trim()
    ? notes.filter(n => n.name.toLowerCase().includes(search.trim().toLowerCase()))
    : notes

  useEffect(() => {
    setSavedHands(loadSavedHands())
  }, [])

  useEffect(() => {
    saveSavedHands(savedHands)
  }, [savedHands])

  const isAggressive = rngResult !== null && rngResult >= 50

  const handleSaveHand = () => {
    if (!saveTitle.trim() && !saveNotes.trim() && !saveDetails.trim()) return

    const newHand = createSavedHand({
      title: saveTitle,
      notes: saveNotes,
      details: saveDetails,
    })

    setSavedHands(prev => [newHand, ...prev])
    setSaveTitle('')
    setSaveNotes('')
    setSaveDetails('')
    setShowSaveForm(false)
    toast.success('Hand saved for review')
  }

  const handleDeleteSavedHand = id => {
    setSavedHands(prev => prev.filter(hand => hand.id !== id))
    toast.success('Saved hand removed')
  }

  return (
    <>
      <PageTitle title="Randomizer" />

      {/* ── RNG ─────────────────────────────────────────────────── */}
      <div className="rng-panel">
        <p className="rng-panel__label">Play Decision</p>
        <button
          className={`rng-panel__roll-btn${rolling ? ' rng-panel__roll-btn--rolling' : ''}`}
          onClick={roll}
          disabled={rolling}
        >
          Roll
        </button>

        <div className="rng-panel__result">
          <div className="rng-panel__gif-wrap">
            {rngGif && <img src={rngGif} alt="" className="rng-panel__gif" />}
          </div>
          <div
            className="rng-panel__verdict"
            style={{ color: !rolling && rngResult !== null ? (isAggressive ? 'var(--green)' : 'var(--red)') : undefined }}
          >
            <span className="rng-panel__number">{rngResult !== null ? rngResult : '—'}</span>
            <span className="rng-panel__tag">
              {!rolling && rngResult !== null ? (isAggressive ? 'Aggressive' : 'Passive') : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Pot Odds ─────────────────────────────────────────────── */}
      <div className="pot-odds">
        <p className="pot-odds__title">Pot Odds Calculator</p>
        <div className="pot-odds__inputs">
          <div className="pot-odds__field">
            <label>Pot</label>
            <div className="pot-odds__input-wrap">
              <span>$</span>
              <input
                type="number"
                value={pot}
                onChange={e => setPot(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="pot-odds__field">
            <label>Bet</label>
            <div className="pot-odds__input-wrap">
              <span>$</span>
              <input
                type="number"
                value={bet}
                onChange={e => setBet(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="pot-odds__field">
            <label>Outs</label>
            <input
              type="number"
              value={outs}
              onChange={e => setOuts(e.target.value)}
              placeholder="0"
              min="0"
              max="47"
              step="1"
            />
          </div>
        </div>

        {potOddsCalc && (
          <div className="pot-odds__results">
            <div className="pot-odds__result">
              <span className="pot-odds__result-label">Pot Odds</span>
              <span className="pot-odds__result-value">{potOddsCalc.potOdds.toFixed(1)}%</span>
              <span className="pot-odds__result-hint">equity needed to break even</span>
            </div>

            {potOddsCalc.turnEquity !== null && (
              <div className="pot-odds__result">
                <span className="pot-odds__result-label">Turn (1 card)</span>
                <span
                  className="pot-odds__result-value"
                  style={{
                    color:
                      potOddsCalc.turnEquity >= potOddsCalc.potOdds ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {potOddsCalc.turnEquity}%
                </span>
                <span
                  className="pot-odds__result-verdict"
                  style={{
                    color:
                      potOddsCalc.turnEquity >= potOddsCalc.potOdds ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {potOddsCalc.turnEquity >= potOddsCalc.potOdds ? 'Call' : 'Fold'}
                </span>
              </div>
            )}

            {potOddsCalc.flopEquity !== null && (
              <div className="pot-odds__result">
                <span className="pot-odds__result-label">Flop (2 cards)</span>
                <span
                  className="pot-odds__result-value"
                  style={{
                    color:
                      potOddsCalc.flopEquity >= potOddsCalc.potOdds ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {potOddsCalc.flopEquity}%
                </span>
                <span
                  className="pot-odds__result-verdict"
                  style={{
                    color:
                      potOddsCalc.flopEquity >= potOddsCalc.potOdds ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  {potOddsCalc.flopEquity >= potOddsCalc.potOdds ? 'Call' : 'Fold'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Chip Stack Calculator ────────────────────────────────── */}
      <div className="chip-calc">
        <p className="chip-calc__title">Chip Stack Calculator</p>

        <div className="chip-calc__inputs">
          <div className="chip-calc__field">
            <label>Total Entries</label>
            <input
              type="number"
              value={chipEntries}
              onChange={e => setChipEntries(e.target.value)}
              placeholder="100"
              min="2"
              step="1"
            />
          </div>
          <div className="chip-calc__field">
            <label>Starting Stack</label>
            <input
              type="number"
              value={chipStartStack}
              onChange={e => setChipStartStack(e.target.value)}
              placeholder="10000"
              min="1"
              step="1"
            />
          </div>
          <div className="chip-calc__field">
            <label>Target Players Left</label>
            <input
              type="number"
              value={chipTarget}
              onChange={e => setChipTarget(e.target.value)}
              placeholder="9"
              min="1"
              step="1"
            />
          </div>
        </div>

        <div className="chip-calc__inputs" style={{ marginTop: '0.75rem' }}>
          <div className="chip-calc__field">
            <label>
              Current Players Left{' '}
              <span className="chip-calc__optional-label">(optional)</span>
            </label>
            <input
              type="number"
              value={chipCurrentPlayers}
              onChange={e => setChipCurrentPlayers(e.target.value)}
              placeholder="—"
              min="1"
              step="1"
            />
          </div>
          <div className="chip-calc__field">
            <label>
              Your Stack{' '}
              <span className="chip-calc__optional-label">(optional)</span>
            </label>
            <input
              type="number"
              value={chipCurrentStack}
              onChange={e => setChipCurrentStack(e.target.value)}
              placeholder="—"
              min="0"
              step="1"
            />
          </div>
        </div>

        {chipCalc && (
          <>
            <hr className="chip-calc__divider" />
            <p className="chip-calc__total">
              Total chips in play:{' '}
              <strong>{chipCalc.total.toLocaleString()}</strong>
            </p>
            <div className="chip-calc__results">
              <div className="chip-calc__result">
                <span className="chip-calc__result-label">
                  Average at {chipTarget} left
                </span>
                <span className="chip-calc__result-value">
                  {chipCalc.avgAtTarget.toLocaleString()}
                </span>
                <span className="chip-calc__result-hint">target average stack</span>
              </div>
              <div className="chip-calc__result">
                <span className="chip-calc__result-label">Comfortable</span>
                <span
                  className="chip-calc__result-value"
                  style={{ color: 'var(--green)' }}>
                  {chipCalc.comfortable.toLocaleString()}
                </span>
                <span className="chip-calc__result-hint">~2× average</span>
              </div>
              <div className="chip-calc__result">
                <span className="chip-calc__result-label">Danger Zone</span>
                <span
                  className="chip-calc__result-value"
                  style={{ color: 'var(--red)' }}>
                  {chipCalc.danger.toLocaleString()}
                </span>
                <span className="chip-calc__result-hint">≤ 0.5× average</span>
              </div>
            </div>

            {(chipCalc.currentAvg !== null || chipCalc.myStack !== null) && (
              <div className="chip-calc__meta">
                {chipCalc.currentAvg !== null && (
                  <span className="chip-calc__meta-item">
                    Current avg:{' '}
                    <strong>{chipCalc.currentAvg.toLocaleString()}</strong>
                  </span>
                )}
                {chipCalc.myStack !== null && chipCalc.currentAvg !== null && (
                  <span className="chip-calc__meta-item">
                    You vs current avg:{' '}
                    <strong
                      style={{
                        color:
                          chipCalc.myStack >= chipCalc.currentAvg
                            ? 'var(--green)'
                            : 'var(--red)',
                      }}>
                      {chipCalc.myStack >= chipCalc.currentAvg ? '+' : ''}
                      {(chipCalc.myStack - chipCalc.currentAvg).toLocaleString()}
                    </strong>
                  </span>
                )}
                {chipCalc.gap !== null && (
                  <span className="chip-calc__meta-item">
                    {chipCalc.gap > 0 ? (
                      <>
                        Chips needed to reach target avg:{' '}
                        <strong style={{ color: 'var(--red)' }}>
                          +{chipCalc.gap.toLocaleString()}
                        </strong>
                      </>
                    ) : (
                      <>
                        Surplus above target avg:{' '}
                        <strong style={{ color: 'var(--green)' }}>
                          +{Math.abs(chipCalc.gap).toLocaleString()}
                        </strong>
                      </>
                    )}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="randomizer-reference randomizer-reference--saved-hands">
        <div className="randomizer-reference__header">
          <p className="randomizer-reference__title">Saved Hands</p>
          <button className="btn btn--primary" onClick={() => setShowSaveForm(prev => !prev)}>
            {showSaveForm ? 'Cancel' : 'Save Hand'}
          </button>
        </div>

        {showSaveForm && (
          <div className="saved-hand-form">
            <input
              type="text"
              placeholder="Hand title"
              value={saveTitle}
              onChange={e => setSaveTitle(e.target.value)}
            />
            <textarea
              placeholder="What happened in this hand?"
              value={saveNotes}
              onChange={e => setSaveNotes(e.target.value)}
              rows={3}
            />
            <textarea
              placeholder="Optional details (board, action, reads)"
              value={saveDetails}
              onChange={e => setSaveDetails(e.target.value)}
              rows={3}
            />
            <button className="btn btn--primary" onClick={handleSaveHand}>
              Save for Review
            </button>
          </div>
        )}

        {savedHands.length === 0 ? (
          <p className="player-notes__empty">No saved hands yet.</p>
        ) : (
          <div className="saved-hands-list">
            {savedHands.map(hand => (
              <div className="player-note saved-hand" key={hand.id}>
                <div className="player-note__top">
                  <span className="player-note__name">{hand.title}</span>
                  <button
                    className="btn btn--subtle"
                    onClick={() => handleDeleteSavedHand(hand.id)}
                  >
                    Remove
                  </button>
                </div>
                {hand.notes && <p className="player-note__text">{hand.notes}</p>}
                {hand.details && <p className="player-note__text">{hand.details}</p>}
                <span className="player-note__date">
                  {format(new Date(hand.createdAt), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Player Notes ─────────────────────────────────────────── */}
      <div className="player-notes">
        <div className="player-notes__header">
          <h2>Player Notes</h2>
          <button
            className="btn btn--primary"
            onClick={() => {
              setAddOpen(o => !o)
              setNewName('')
              setNewNote('')
            }}
          >
            <FaPlus /> Add
          </button>
        </div>

        {addOpen && (
          <div className="player-note player-note--form">
            <input
              type="text"
              placeholder="Player name or screen name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <textarea
              placeholder="Notes about this player..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="player-note__actions">
              <button className="btn btn--primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn--subtle" onClick={() => setAddOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {notes.length > 1 && (
          <div className="player-notes__search">
            <FaSearch className="player-notes__search-icon" />
            <input
              type="text"
              placeholder="Search players…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {isLoading ? (
          <Loader />
        ) : filtered.length === 0 && !addOpen ? (
          <p className="player-notes__empty">
            {notes.length === 0 ? 'No player notes yet.' : 'No results.'}
          </p>
        ) : (
          <div className="player-notes__list">
            {filtered.map(n => (
              <div className="player-note" key={n._id}>
                {editId === n._id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                    />
                    <textarea
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      rows={4}
                    />
                    <div className="player-note__actions">
                      <button
                        className="btn btn--primary"
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button className="btn btn--subtle" onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="player-note__top">
                      <span className="player-note__name">{n.name}</span>
                      <div className="player-note__manage">
                        <button
                          className="btn btn--subtle"
                          onClick={() => handleEdit(n)}
                          aria-label="Edit"
                        >
                          <FaPencilAlt className="btn--icon" />
                        </button>
                        <button
                          className="btn btn--subtle"
                          onClick={() => setDeleteTarget(n._id)}
                          aria-label="Delete"
                        >
                          <FaTrashAlt className="btn--icon--danger" />
                        </button>
                      </div>
                    </div>
                    {n.notes && <p className="player-note__text">{n.notes}</p>}
                    <span className="player-note__date">
                      {format(new Date(n.updatedAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message="Delete this player note?"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default Randomizer

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import ConfirmModal from '../ConfirmModal'
import { createSavedHand, loadSavedHands, saveSavedHands } from '../../utils/randomizerSavedHands'

// Hands are kept in this browser's localStorage
const SavedHands = () => {
  // Lazy initial state loads before the first save, so nothing is overwritten
  const [savedHands, setSavedHands] = useState(loadSavedHands)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveNotes, setSaveNotes] = useState('')
  const [saveDetails, setSaveDetails] = useState('')
  const [removeTarget, setRemoveTarget] = useState(null)

  useEffect(() => {
    saveSavedHands(savedHands)
  }, [savedHands])

  const handleSaveHand = () => {
    if (!saveTitle.trim() && !saveNotes.trim() && !saveDetails.trim()) return

    setSavedHands(prev => [createSavedHand({ title: saveTitle, notes: saveNotes, details: saveDetails }), ...prev])
    setSaveTitle('')
    setSaveNotes('')
    setSaveDetails('')
    setShowSaveForm(false)
    toast.success('Hand saved for review')
  }

  const handleRemove = id => {
    setSavedHands(prev => prev.filter(hand => hand.id !== id))
    setRemoveTarget(null)
    toast.success('Saved hand removed')
  }

  return (
    <div className='randomizer-reference randomizer-reference--saved-hands'>
      <div className='randomizer-reference__header'>
        <p className='randomizer-reference__title'>Saved Hands</p>
        <button className='btn btn--primary' onClick={() => setShowSaveForm(prev => !prev)}>
          {showSaveForm ? 'Cancel' : 'Save Hand'}
        </button>
      </div>

      {showSaveForm && (
        <div className='saved-hand-form'>
          <input
            type='text'
            placeholder='Hand title'
            aria-label='Hand title'
            value={saveTitle}
            onChange={e => setSaveTitle(e.target.value)}
          />
          <textarea
            placeholder='What happened in this hand?'
            aria-label='What happened in this hand?'
            value={saveNotes}
            onChange={e => setSaveNotes(e.target.value)}
            rows={3}
          />
          <textarea
            placeholder='Optional details (board, action, reads)'
            aria-label='Hand details'
            value={saveDetails}
            onChange={e => setSaveDetails(e.target.value)}
            rows={3}
          />
          <button className='btn btn--primary' onClick={handleSaveHand}>
            Save for Review
          </button>
        </div>
      )}

      {savedHands.length === 0 ? (
        <p className='player-notes__empty'>No saved hands yet.</p>
      ) : (
        <div className='saved-hands-list'>
          {savedHands.map(hand => (
            <div className='player-note saved-hand' key={hand.id}>
              <div className='player-note__top'>
                <span className='player-note__name'>{hand.title}</span>
                <button className='btn btn--subtle' onClick={() => setRemoveTarget(hand)}>
                  Remove
                </button>
              </div>
              {hand.notes && <p className='player-note__text'>{hand.notes}</p>}
              {hand.details && <p className='player-note__text'>{hand.details}</p>}
              <span className='player-note__date'>{format(new Date(hand.createdAt), 'MMM d, yyyy · h:mm a')}</span>
            </div>
          ))}
        </div>
      )}

      {removeTarget && (
        <ConfirmModal
          message={`Remove "${removeTarget.title}"? This cannot be undone.`}
          confirmLabel='Remove'
          onConfirm={() => handleRemove(removeTarget.id)}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}

export default SavedHands

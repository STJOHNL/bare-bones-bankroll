import { useEffect, useRef, useState } from 'react'

const ConfirmModal = ({ message, onConfirm, onCancel, confirmLabel = 'Delete' }) => {
  const cancelRef = useRef(null)
  const [isWorking, setIsWorking] = useState(false)
  // Callers pass inline handlers; a ref keeps the mount effect from re-running
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  // Focus the safe action, close on Escape, and restore focus afterwards
  useEffect(() => {
    const previouslyFocused = document.activeElement
    cancelRef.current?.focus()
    const onKeyDown = e => {
      if (e.key === 'Escape') onCancelRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  // Keep Tab inside the dialog
  const trapFocus = e => {
    if (e.key !== 'Tab') return
    const buttons = e.currentTarget.querySelectorAll('button:not([disabled])')
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const handleConfirm = async () => {
    setIsWorking(true)
    try {
      await onConfirm()
    } finally {
      setIsWorking(false)
    }
  }

  return (
    // The overlay click is a mouse convenience; Escape and Cancel cover keyboard users
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className='modal-overlay' onClick={onCancel}>
      {/* Stops overlay clicks from closing the dialog; keyboard handling is the focus trap */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className='modal'
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='confirm-modal-message'
        onClick={e => e.stopPropagation()}
        onKeyDown={trapFocus}>
        <p className='modal__message' id='confirm-modal-message'>
          {message}
        </p>
        <div className='modal__actions'>
          <button ref={cancelRef} className='btn btn--subtle' onClick={onCancel}>
            Cancel
          </button>
          <button className='btn btn--danger' onClick={handleConfirm} disabled={isWorking}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

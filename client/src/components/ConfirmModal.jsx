const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className='modal-overlay' onClick={onCancel}>
    <div className='modal' onClick={e => e.stopPropagation()}>
      <p className='modal__message'>{message}</p>
      <div className='modal__actions'>
        <button className='btn btn--subtle' onClick={onCancel}>Cancel</button>
        <button className='btn btn--danger' onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
)

export default ConfirmModal

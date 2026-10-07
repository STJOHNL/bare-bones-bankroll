import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ActiveSessionCard from '../components/ActiveSessionCard'

const cashSession = {
  _id: 's1',
  venue: 'Online',
  type: 'Cash',
  game: 'NL',
  name: 'NL10',
  buyin: 10,
  cashout: 0,
  start: new Date().toISOString(),
}

const renderCard = (session, onUpdate = vi.fn().mockResolvedValue(session)) => {
  render(
    <MemoryRouter>
      <ActiveSessionCard session={session} balance={100} onUpdate={onUpdate} onDuplicate={vi.fn()} onDelete={vi.fn()} />
    </MemoryRouter>
  )
  return onUpdate
}

describe('ActiveSessionCard', () => {
  it('ends an untouched cash session at the stack shown, not at zero', async () => {
    const onUpdate = renderCard(cashSession)
    expect(screen.getByLabelText('Cash out amount')).toHaveValue(10)

    await userEvent.click(screen.getByLabelText('End session'))

    expect(onUpdate).toHaveBeenCalledWith(cashSession, expect.objectContaining({ cashout: 10 }), 'Session ended!')
  })

  it('sends the typed cashout when the player busts', async () => {
    const onUpdate = renderCard(cashSession)
    const input = screen.getByLabelText('Cash out amount')
    await userEvent.clear(input)
    await userEvent.type(input, '0')

    await userEvent.click(screen.getByLabelText('Save cashout'))

    expect(onUpdate).toHaveBeenCalledWith(cashSession, { cashout: 0 }, 'Cashout updated!')
  })

  it('shows the stake as entered', () => {
    renderCard(cashSession)
    expect(screen.getByText('NL10')).toBeInTheDocument()
  })

  it('starts a running tournament at zero', () => {
    renderCard({ ...cashSession, type: 'Tournament', name: 'Turbo' })
    expect(screen.getByLabelText('Cash out amount')).toHaveValue(0)
  })
})

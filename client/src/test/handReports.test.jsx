import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Reports from '../pages/Reports'

const sessions = [
  // Before the first checkpoint → hands 0–100,000
  { _id: 's1', name: 'NL10', start: '2025-12-15T10:00:00.000Z', end: '2025-12-15T12:00:00.000Z', buyin: 100, cashout: 200 },
  // Between checkpoints → hands 100,000–150,000
  { _id: 's2', name: 'NL25', start: '2026-01-15T10:00:00.000Z', end: '2026-01-15T12:00:00.000Z', buyin: 100, cashout: 150 },
  // After the last checkpoint → its hands aren't logged yet
  { _id: 's3', name: 'NL25', start: '2026-02-15T10:00:00.000Z', end: '2026-02-15T12:00:00.000Z', buyin: 100, cashout: 1099 },
]

const logs = [
  { _id: 'h1', hands: 100000, date: '2026-01-01T12:00:00.000Z' },
  { _id: 'h2', hands: 50000, date: '2026-02-01T12:00:00.000Z' },
]

const createHandLog = vi.fn(async data => ({ _id: 'h3', ...data }))

vi.mock('../hooks/useSession', () => {
  const getSessions = async () => sessions
  return { useSession: () => ({ getSessions }) }
})

vi.mock('../hooks/useHandLog', () => {
  const getHandLogs = async () => logs
  return { useHandLog: () => ({ getHandLogs, createHandLog, deleteHandLog: vi.fn() }) }
})

// Recharts needs real layout; the chart isn't under test here
vi.mock('../components/PLChart', () => ({ default: () => null }))

const renderReports = () =>
  render(
    <MemoryRouter>
      <Reports />
    </MemoryRouter>
  )

const stat = label => within(screen.getByText(label, { selector: '.stat p' }).closest('.stat')).getByText(/./, { selector: '.stat__value' })

describe('Reports by hand range', () => {
  beforeEach(() => createHandLog.mockClear())

  it('shows lifetime hands and reports on a range of hands', async () => {
    const user = userEvent.setup()
    renderReports()

    expect(await screen.findByText('150,000', { selector: '.hand-log__total' })).toBeInTheDocument()
    expect(stat('Sessions')).toHaveTextContent('3')

    await user.type(screen.getByLabelText('From hand'), '100000')
    await user.type(screen.getByLabelText('To hand'), '150000')

    expect(screen.getByText(/Hands 100,000 – 150,000/)).toBeInTheDocument()
    expect(stat('Sessions')).toHaveTextContent('1')
    expect(stat('Hands')).toHaveTextContent('50,000')
    // $50 over 50,000 hands
    expect(stat('Per 100 Hands')).toHaveTextContent('$0.10')
  })

  it('applies the all-hands preset up to the last checkpoint', async () => {
    const user = userEvent.setup()
    renderReports()

    await user.click(await screen.findByRole('button', { name: 'All Hands' }))
    expect(stat('Sessions')).toHaveTextContent('2')
    // $150 over 150,000 hands
    expect(stat('Per 100 Hands')).toHaveTextContent('$0.10')
  })

  it('records a new lifetime total as the hands played since', async () => {
    const user = userEvent.setup()
    renderReports()

    await user.click(await screen.findByRole('button', { name: '+ Log Hands' }))
    await user.click(screen.getByRole('button', { name: 'New lifetime total' }))
    await user.type(screen.getByLabelText('Lifetime hands'), '160000')
    await user.click(screen.getByRole('button', { name: 'Log Hands' }))

    expect(createHandLog).toHaveBeenCalledWith(expect.objectContaining({ hands: 10000 }))
    expect(await screen.findByText('160,000', { selector: '.hand-log__total' })).toBeInTheDocument()
  })
})

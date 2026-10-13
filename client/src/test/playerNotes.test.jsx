import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayerNoteCard from '../components/players/PlayerNoteCard'
import { CategoryPicker } from '../components/players/PlayerBadges'
import { initials, playerCategory, sortPlayerNotes } from '../utils/playerCategories'

const note = {
  _id: 'n1',
  name: 'Fishy Fred',
  notes: 'Limps every button',
  category: 'rec',
  pinned: false,
  updatedAt: new Date().toISOString(),
}

describe('player category helpers', () => {
  it('falls back to unknown for missing or legacy categories', () => {
    expect(playerCategory(undefined).key).toBe('unknown')
    expect(playerCategory('shark').key).toBe('unknown')
    expect(playerCategory('reg').label).toBe('Reg')
  })

  it('builds initials from screen names', () => {
    expect(initials('Fishy Fred')).toBe('FF')
    expect(initials('nit_lord99')).toBe('NL')
    expect(initials('x')).toBe('X')
  })

  it('sorts pinned players first, then most recently updated', () => {
    const sorted = sortPlayerNotes([
      { _id: 'old', pinned: false, updatedAt: '2026-01-01' },
      { _id: 'pin', pinned: true, updatedAt: '2025-01-01' },
      { _id: 'new', pinned: false, updatedAt: '2026-02-01' },
    ])
    expect(sorted.map(n => n._id)).toEqual(['pin', 'new', 'old'])
  })
})

describe('PlayerNoteCard', () => {
  it('shows the player type and toggles the pin', async () => {
    const onTogglePin = vi.fn()
    render(<PlayerNoteCard note={note} onEdit={vi.fn()} onDelete={vi.fn()} onTogglePin={onTogglePin} />)

    expect(screen.getByText('Fishy Fred')).toBeInTheDocument()
    expect(screen.getByText('Rec')).toBeInTheDocument()

    const pin = screen.getByRole('button', { name: 'Pin Fishy Fred' })
    expect(pin).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(pin)
    expect(onTogglePin).toHaveBeenCalledWith(note)
  })

  it('labels a pinned player as unpinnable', () => {
    render(
      <PlayerNoteCard note={{ ...note, pinned: true }} onEdit={vi.fn()} onDelete={vi.fn()} onTogglePin={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: 'Unpin Fishy Fred' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('CategoryPicker', () => {
  const Harness = () => {
    const [value, setValue] = useState('unknown')
    return <CategoryPicker value={value} onChange={setValue} idPrefix='test' />
  }

  it('selects a category as a radio group', async () => {
    render(<Harness />)
    const reg = screen.getByRole('radio', { name: 'Reg' })
    await userEvent.click(reg)
    expect(reg).toBeChecked()
    expect(screen.getByText(/Solid regular/)).toBeInTheDocument()
  })
})

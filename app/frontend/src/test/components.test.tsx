import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import StatusBadge from '../components/ui/StatusBadge'
import { formatEnum } from '../lib/format'
import { getErrorMessage } from '../api/client'
import { AxiosError } from 'axios'

describe('StatusBadge', () => {
  it('renders a human readable label', () => {
    render(<StatusBadge status="MAINTENANCE" />)
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  it('calls onConfirm and onCancel', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog open title="Delete?" message="Sure?" onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('renders nothing when closed', () => {
    render(<ConfirmDialog open={false} title="x" message="y" onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})

describe('helpers', () => {
  it('formats enum labels', () => {
    expect(formatEnum('CI_SERVER')).toBe('CI Server')
    expect(formatEnum('AZURE')).toBe('Azure')
    expect(formatEnum(null)).toBe('—')
  })

  it('maps network failures to a friendly message', () => {
    expect(getErrorMessage(new AxiosError('Network Error'))).toMatch(/Cannot reach the server/)
  })
})

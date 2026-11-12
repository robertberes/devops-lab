import { describe, expect, it } from 'vitest'
import { emptyValues, toServerInput, validateServerForm } from '../components/servers/serverFormModel'

describe('validateServerForm', () => {
  it('requires a hostname', () => {
    expect(validateServerForm(emptyValues).hostname).toBe('Hostname is required')
  })

  it('accepts a minimal valid server', () => {
    expect(validateServerForm({ ...emptyValues, hostname: 'web-01' })).toEqual({})
  })

  it('rejects invalid IP addresses and accepts IPv4/IPv6', () => {
    const base = { ...emptyValues, hostname: 'web-01' }
    expect(validateServerForm({ ...base, ipAddress: '999.1.1.1' }).ipAddress).toBeDefined()
    expect(validateServerForm({ ...base, ipAddress: '10.0.0.1' }).ipAddress).toBeUndefined()
    expect(validateServerForm({ ...base, ipAddress: 'fe80::1' }).ipAddress).toBeUndefined()
  })

  it('rejects negative or non-numeric resources', () => {
    const errors = validateServerForm({ ...emptyValues, hostname: 'a', cpuCores: '-2', memoryGb: 'abc', diskGb: '10' })
    expect(errors.cpuCores).toBeDefined()
    expect(errors.memoryGb).toBeDefined()
    expect(errors.diskGb).toBeUndefined()
  })
})

describe('toServerInput', () => {
  it('converts blanks to null and numbers to integers', () => {
    const input = toServerInput({ ...emptyValues, hostname: ' web-01 ', cpuCores: '8', osVersion: ' ' })
    expect(input.hostname).toBe('web-01')
    expect(input.cpuCores).toBe(8)
    expect(input.memoryGb).toBeNull()
    expect(input.osVersion).toBeNull()
  })
})

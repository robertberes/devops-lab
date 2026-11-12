import type { Server, ServerInput } from '../../types/server'

/** Form state keeps everything as strings so inputs stay controlled; converted to ServerInput on submit. */
export interface ServerFormValues {
  hostname: string
  ipAddress: string
  operatingSystem: string
  osVersion: string
  environment: string
  location: string
  organization: string
  ecuFamily: string
  slavePool: string
  purpose: string
  cpuCores: string
  memoryGb: string
  diskGb: string
  status: string
  description: string
}

export type FormErrors = Partial<Record<keyof ServerFormValues, string>>

const IPV4 = /^((25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3})$/
const IPV6 = /^([0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}$/
const HOSTNAME = /^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?$/

export const emptyValues: ServerFormValues = {
  hostname: '', ipAddress: '', operatingSystem: 'UBUNTU', osVersion: '', environment: 'DEV', location: 'AWS',
  organization: '', ecuFamily: '', slavePool: '', purpose: 'WORKER', cpuCores: '', memoryGb: '', diskGb: '',
  status: 'ACTIVE', description: '',
}

export function toFormValues(server: Server): ServerFormValues {
  return {
    hostname: server.hostname,
    ipAddress: server.ipAddress ?? '',
    operatingSystem: server.operatingSystem,
    osVersion: server.osVersion ?? '',
    environment: server.environment,
    location: server.location,
    organization: server.organization ?? '',
    ecuFamily: server.ecuFamily ?? '',
    slavePool: server.slavePool ?? '',
    purpose: server.purpose,
    cpuCores: server.cpuCores?.toString() ?? '',
    memoryGb: server.memoryGb?.toString() ?? '',
    diskGb: server.diskGb?.toString() ?? '',
    status: server.status,
    description: server.description ?? '',
  }
}

function validateNumber(value: string, label: string): string | undefined {
  if (value.trim() === '') return undefined
  if (!/^\d+$/.test(value.trim())) return `${label} must be a whole number of 0 or more`
  return undefined
}

export function validateServerForm(v: ServerFormValues): FormErrors {
  const errors: FormErrors = {}
  const hostname = v.hostname.trim()
  if (!hostname) errors.hostname = 'Hostname is required'
  else if (hostname.length > 255) errors.hostname = 'Hostname must be at most 255 characters'
  else if (!HOSTNAME.test(hostname)) errors.hostname = "Use only letters, digits, '.', '-' and '_'"

  const ip = v.ipAddress.trim()
  if (ip && !IPV4.test(ip) && !IPV6.test(ip)) errors.ipAddress = 'Enter a valid IPv4 or IPv6 address'

  if (!v.operatingSystem) errors.operatingSystem = 'Operating system is required'
  if (!v.environment) errors.environment = 'Environment is required'
  if (!v.location) errors.location = 'Location is required'
  if (!v.purpose) errors.purpose = 'Purpose is required'
  if (!v.status) errors.status = 'Status is required'

  errors.cpuCores = validateNumber(v.cpuCores, 'CPU cores')
  errors.memoryGb = validateNumber(v.memoryGb, 'Memory')
  errors.diskGb = validateNumber(v.diskGb, 'Disk')
  if (v.description.length > 2000) errors.description = 'Description must be at most 2000 characters'

  return Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg)) as FormErrors
}

const optional = (s: string): string | null => (s.trim() === '' ? null : s.trim())
const optionalInt = (s: string): number | null => (s.trim() === '' ? null : Number.parseInt(s, 10))

export function toServerInput(v: ServerFormValues): ServerInput {
  return {
    hostname: v.hostname.trim(),
    ipAddress: optional(v.ipAddress),
    operatingSystem: v.operatingSystem as ServerInput['operatingSystem'],
    osVersion: optional(v.osVersion),
    environment: v.environment as ServerInput['environment'],
    location: v.location as ServerInput['location'],
    organization: optional(v.organization),
    ecuFamily: optional(v.ecuFamily),
    slavePool: optional(v.slavePool),
    purpose: v.purpose as ServerInput['purpose'],
    cpuCores: optionalInt(v.cpuCores),
    memoryGb: optionalInt(v.memoryGb),
    diskGb: optionalInt(v.diskGb),
    status: v.status as ServerInput['status'],
    description: optional(v.description),
  }
}

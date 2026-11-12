export type Environment = 'DEV' | 'TEST' | 'UAT' | 'PROD'
export type Location = 'AWS' | 'AZURE'
export type OperatingSystem = 'UBUNTU' | 'WINDOWS' | 'OTHER'
export type ServerStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
export type ServerPurpose =
  | 'CI_SERVER' | 'PROXY' | 'STORAGE' | 'CACHE' | 'MQ' | 'WORKER'
  | 'MONITORING' | 'ARTIFACTORY' | 'TOOLS_STORAGE' | 'SYSTEM_TESTS' | 'OTHER'

export interface Server {
  id: string
  hostname: string
  ipAddress: string | null
  operatingSystem: OperatingSystem
  osVersion: string | null
  environment: Environment
  location: Location
  organization: string | null
  ecuFamily: string | null
  slavePool: string | null
  purpose: ServerPurpose
  cpuCores: number | null
  memoryGb: number | null
  diskGb: number | null
  status: ServerStatus
  description: string | null
  createdAt: string
  updatedAt: string
}

/** Payload for create/update (everything except server-managed fields). */
export type ServerInput = Omit<Server, 'id' | 'createdAt' | 'updatedAt'>

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CountItem {
  label: string
  count: number
}

export interface ServerStats {
  total: number
  active: number
  inactive: number
  maintenance: number
  byEnvironment: CountItem[]
  byOperatingSystem: CountItem[]
  byLocation: CountItem[]
  byPurpose: CountItem[]
}

export interface FilterOptions {
  operatingSystems: OperatingSystem[]
  environments: Environment[]
  locations: Location[]
  purposes: ServerPurpose[]
  statuses: ServerStatus[]
}

export interface ServerQuery {
  search?: string
  operatingSystem?: string
  environment?: string
  location?: string
  purpose?: string
  status?: string
  page?: number
  size?: number
  sort?: string
}

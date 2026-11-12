import { apiClient } from './client'
import type {
  FilterOptions, PageResponse, Server, ServerInput, ServerQuery, ServerStats,
} from '../types/server'

export async function listServers(query: ServerQuery = {}): Promise<PageResponse<Server>> {
  // Drop empty values so they are not sent as blank query parameters.
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== ''),
  )
  return (await apiClient.get<PageResponse<Server>>('/servers', { params })).data
}

export async function getServer(id: string): Promise<Server> {
  return (await apiClient.get<Server>(`/servers/${id}`)).data
}

export async function createServer(input: ServerInput): Promise<Server> {
  return (await apiClient.post<Server>('/servers', input)).data
}

export async function updateServer(id: string, input: ServerInput): Promise<Server> {
  return (await apiClient.put<Server>(`/servers/${id}`, input)).data
}

export async function deleteServer(id: string): Promise<void> {
  await apiClient.delete(`/servers/${id}`)
}

export async function getStats(): Promise<ServerStats> {
  return (await apiClient.get<ServerStats>('/servers/stats')).data
}

export async function getFilterOptions(): Promise<FilterOptions> {
  return (await apiClient.get<FilterOptions>('/servers/filters')).data
}

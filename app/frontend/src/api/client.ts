import axios, { AxiosError } from 'axios'

/** Single configured HTTP client. Base URL is build-time configurable; default is same-origin (proxied). */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

interface ApiErrorBody {
  message?: string
  fieldErrors?: Record<string, string>
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'Cannot reach the server. Check your connection and try again.'
    }
    const body = error.response.data as ApiErrorBody | undefined
    if (body?.message) return body.message
    return `Request failed (HTTP ${error.response.status})`
  }
  return error instanceof Error ? error.message : 'Unexpected error'
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorBody | undefined)?.fieldErrors ?? {}
  }
  return {}
}

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { deleteServer, listServers } from '../api/servers'
import PageHeader from '../components/layout/PageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Pagination from '../components/ui/Pagination'
import Spinner from '../components/ui/Spinner'
import StatusBadge from '../components/ui/StatusBadge'
import Tag from '../components/ui/Tag'
import { useToast } from '../components/ui/Toast'
import { useApi } from '../hooks/useApi'
import { useFilterOptions } from '../hooks/useFilterOptions'
import { formatEnum, formatGb, orDash } from '../lib/format'
import type { Server } from '../types/server'

const PAGE_SIZE = 15
const FILTER_KEYS = ['operatingSystem', 'environment', 'location', 'purpose', 'status'] as const

const COLUMNS: { key: string; label: string; sortField?: string }[] = [
  { key: 'hostname', label: 'Hostname', sortField: 'hostname' },
  { key: 'ip', label: 'IP Address', sortField: 'ipAddress' },
  { key: 'os', label: 'Operating System', sortField: 'operatingSystem' },
  { key: 'env', label: 'Environment', sortField: 'environment' },
  { key: 'loc', label: 'Location', sortField: 'location' },
  { key: 'purpose', label: 'Purpose', sortField: 'purpose' },
  { key: 'cpu', label: 'CPU', sortField: 'cpuCores' },
  { key: 'mem', label: 'Memory', sortField: 'memoryGb' },
  { key: 'status', label: 'Status', sortField: 'status' },
  { key: 'actions', label: 'Actions' },
]

/** List state (search, filters, sort, page) lives in the URL so it survives navigating to details and back. */
export default function ServersPage() {
  const [params, setParams] = useSearchParams()
  const options = useFilterOptions()
  const toast = useToast()

  const search = params.get('search') ?? ''
  const page = Number(params.get('page') ?? 0)
  const sort = params.get('sort') ?? 'hostname,asc'
  const [sortField, sortDir] = sort.split(',')

  const [searchInput, setSearchInput] = useState(search)
  const [toDelete, setToDelete] = useState<Server | null>(null)
  const [deleting, setDeleting] = useState(false)

  const update = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (resetPage) next.delete('page')
    setParams(next, { replace: true })
  }

  // Debounce typing into the search box.
  useEffect(() => {
    if (searchInput === search) return
    const t = setTimeout(() => update({ search: searchInput.trim() || null }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? '']))
  const hasFilters = !!search || FILTER_KEYS.some((k) => filters[k])

  const { data, loading, error, reload } = useApi(
    () => listServers({ search, ...filters, page, size: PAGE_SIZE, sort }),
    [params.toString()],
  )

  const toggleSort = (field: string) => {
    const dir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc'
    update({ sort: `${field},${dir}` }, false)
  }

  const clearFilters = () => {
    setSearchInput('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteServer(toDelete.id)
      toast.success(`Server "${toDelete.hostname}" deleted`)
      setToDelete(null)
      // Stepping back a page if the last row of the final page was removed.
      if (data && data.content.length === 1 && page > 0) update({ page: String(page - 1) }, false)
      else reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const filterSelects: { key: (typeof FILTER_KEYS)[number]; label: string; values?: string[] }[] = [
    { key: 'environment', label: 'Environment', values: options?.environments },
    { key: 'location', label: 'Location', values: options?.locations },
    { key: 'operatingSystem', label: 'OS', values: options?.operatingSystems },
    { key: 'purpose', label: 'Purpose', values: options?.purposes },
    { key: 'status', label: 'Status', values: options?.statuses },
  ]

  return (
    <>
      <PageHeader
        title="Servers"
        subtitle="Inventory of virtual machines and servers across AWS and Azure."
        breadcrumbs={[{ label: 'Servers' }]}
        actions={<Link to="/servers/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" />Add Server</Link>}
      />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
            <input type="search" aria-label="Search by hostname or IP address" className="input pl-9!"
                   placeholder="Search hostname or IP…" value={searchInput}
                   onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {filterSelects.map(({ key, label, values }) => (
              <select key={key} aria-label={`Filter by ${label}`} className="input w-auto!" value={filters[key]}
                      onChange={(e) => update({ [key]: e.target.value || null })}>
                <option value="">{label}: All</option>
                {(values ?? []).map((v) => <option key={v} value={v}>{formatEnum(v)}</option>)}
              </select>
            ))}
            {hasFilters && (
              <button type="button" className="btn text-zinc-400 hover:text-zinc-100" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        {loading && !data ? <Spinner />
          : error ? <ErrorState message={error} onRetry={reload} />
          : data && data.content.length === 0 ? (
            <EmptyState
              title={hasFilters ? 'No servers match your filters' : 'No servers yet'}
              description={hasFilters ? 'Try a different search or clear the filters.' : 'Add your first server to start the inventory.'}
              action={hasFilters
                ? <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>
                : <Link to="/servers/new" className="btn-primary">Add Server</Link>} />
          ) : data && (
            <div className={loading ? 'opacity-60 transition-opacity' : ''}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      {COLUMNS.map((c) => (
                        <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-3 font-medium"
                            aria-sort={c.sortField && sortField === c.sortField ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                          {c.sortField ? (
                            <button type="button" onClick={() => toggleSort(c.sortField!)}
                                    className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-zinc-200">
                              {c.label}
                              {sortField === c.sortField
                                ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />)
                                : <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />}
                            </button>
                          ) : <span className="sr-only">{c.label}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {data.content.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-3">
                          <Link to={`/servers/${s.id}`} className="font-medium text-indigo-300 hover:text-indigo-200 hover:underline">{s.hostname}</Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-300">{orDash(s.ipAddress)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatEnum(s.operatingSystem)}{s.osVersion && <span className="text-zinc-500"> {s.osVersion}</span>}</td>
                        <td className="px-4 py-3"><Tag highlight={s.environment === 'PROD'}>{s.environment}</Tag></td>
                        <td className="px-4 py-3">{formatEnum(s.location)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatEnum(s.purpose)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{s.cpuCores == null ? '—' : `${s.cpuCores} vCPU`}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatGb(s.memoryGb)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/servers/${s.id}/edit`} aria-label={`Edit ${s.hostname}`}
                                  className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button type="button" aria-label={`Delete ${s.hostname}`} onClick={() => setToDelete(s)}
                                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} size={data.size} totalElements={data.totalElements}
                          totalPages={data.totalPages} onPageChange={(p) => update({ page: p ? String(p) : null }, false)} />
            </div>
          )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete server?"
        message={toDelete ? `"${toDelete.hostname}" will be permanently removed from the inventory. This cannot be undone.` : ''}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}

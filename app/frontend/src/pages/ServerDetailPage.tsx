import { useState, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { deleteServer, getServer } from '../api/servers'
import PageHeader from '../components/layout/PageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorState from '../components/ui/ErrorState'
import Spinner from '../components/ui/Spinner'
import StatusBadge from '../components/ui/StatusBadge'
import Tag from '../components/ui/Tag'
import { useToast } from '../components/ui/Toast'
import { useApi } from '../hooks/useApi'
import { formatDateTime, formatEnum, formatGb, orDash } from '../lib/format'

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-100">{children}</dd>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-zinc-100">{title}</h2>
      <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  )
}

export default function ServerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: server, loading, error, reload } = useApi(() => getServer(id), [id])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!server) return
    setDeleting(true)
    try {
      await deleteServer(server.id)
      toast.success(`Server "${server.hostname}" deleted`)
      navigate('/servers')
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (loading) return <Spinner />
  if (error || !server) {
    return (
      <>
        <PageHeader title="Server" breadcrumbs={[{ label: 'Servers', to: '/servers' }, { label: 'Details' }]} />
        <div className="card"><ErrorState message={error ?? 'Server not found'} onRetry={reload} /></div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={server.hostname}
        subtitle={server.description ?? undefined}
        breadcrumbs={[{ label: 'Servers', to: '/servers' }, { label: server.hostname }]}
        actions={
          <>
            <Link to={`/servers/${server.id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" aria-hidden="true" />Edit</Link>
            <button type="button" className="btn-danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />Delete
            </button>
          </>
        }
      />

      <div className="space-y-6">
        <Group title="General">
          <Item label="Hostname"><span className="font-mono">{server.hostname}</span></Item>
          <Item label="IP address"><span className="font-mono">{orDash(server.ipAddress)}</span></Item>
          <Item label="Status"><StatusBadge status={server.status} /></Item>
          <Item label="Organization">{orDash(server.organization)}</Item>
          <Item label="Purpose"><Tag>{formatEnum(server.purpose)}</Tag></Item>
        </Group>
        <Group title="Infrastructure">
          <Item label="Environment"><Tag highlight={server.environment === 'PROD'}>{server.environment}</Tag></Item>
          <Item label="Location"><Tag>{formatEnum(server.location)}</Tag></Item>
          <Item label="Operating system">
            {formatEnum(server.operatingSystem)}{server.osVersion ? ` ${server.osVersion}` : ''}
          </Item>
          <Item label="ECU family">{orDash(server.ecuFamily)}</Item>
          <Item label="Slave pool">{orDash(server.slavePool)}</Item>
        </Group>
        <Group title="Resources">
          <Item label="CPU">{server.cpuCores == null ? '—' : `${server.cpuCores} cores`}</Item>
          <Item label="Memory">{formatGb(server.memoryGb)}</Item>
          <Item label="Disk">{formatGb(server.diskGb)}</Item>
        </Group>
        <Group title="Additional information">
          <div className="sm:col-span-2 lg:col-span-3">
            <Item label="Description"><span className="whitespace-pre-wrap">{orDash(server.description)}</span></Item>
          </div>
          <Item label="Created">{formatDateTime(server.createdAt)}</Item>
          <Item label="Last updated">{formatDateTime(server.updatedAt)}</Item>
        </Group>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete server?"
        message={`"${server.hostname}" will be permanently removed from the inventory. This cannot be undone.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

import { useNavigate, useParams } from 'react-router-dom'
import { createServer, getServer, updateServer } from '../api/servers'
import PageHeader from '../components/layout/PageHeader'
import ServerForm from '../components/servers/ServerForm'
import ErrorState from '../components/ui/ErrorState'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { useApi } from '../hooks/useApi'
import type { ServerInput } from '../types/server'

export default function ServerFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()
  const toast = useToast()

  const { data: server, loading, error, reload } = useApi(
    () => (isEdit ? getServer(id) : Promise.resolve(null)),
    [id],
  )

  const handleSubmit = async (input: ServerInput) => {
    const saved = isEdit ? await updateServer(id, input) : await createServer(input)
    toast.success(isEdit ? `Server "${saved.hostname}" updated` : `Server "${saved.hostname}" created`)
    navigate(`/servers/${saved.id}`)
  }

  const crumbs = [
    { label: 'Servers', to: '/servers' },
    ...(isEdit && server ? [{ label: server.hostname, to: `/servers/${server.id}` }] : []),
    { label: isEdit ? 'Edit' : 'New server' },
  ]

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit server' : 'Add server'}
        subtitle={isEdit ? 'Update the server record.' : 'Register a new server in the inventory.'}
        breadcrumbs={crumbs}
      />
      {loading ? <Spinner />
        : error ? <div className="card"><ErrorState message={error} onRetry={reload} /></div>
        : <ServerForm initial={server ?? undefined} submitLabel={isEdit ? 'Save changes' : 'Create server'}
                      onSubmit={handleSubmit} onCancel={() => navigate(isEdit ? `/servers/${id}` : '/servers')} />}
    </>
  )
}

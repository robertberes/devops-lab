import PageHeader from '../components/layout/PageHeader'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Application preferences" />
      <div className="card px-6 py-14 text-center">
        <p className="font-medium text-zinc-100">Nothing to configure yet</p>
        <p className="mt-1 text-sm text-zinc-400">Settings will appear here in a future release.</p>
      </div>
    </>
  )
}

import type { ReactNode } from 'react'
import { Activity, PauseCircle, Server as ServerIcon, Wrench, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getStats, listServers } from '../api/servers'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Spinner from '../components/ui/Spinner'
import StatusBadge from '../components/ui/StatusBadge'
import { useApi } from '../hooks/useApi'
import { formatEnum, formatRelative } from '../lib/format'
import type { CountItem, Server } from '../types/server'

// One hue family (indigo → slate) keeps the charts calm; the first series is the accent.
const CHART_COLORS = ['#818cf8', '#38bdf8', '#2dd4bf', '#a1a1aa', '#c084fc']
const TOOLTIP_STYLE = {
  backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12, color: '#e4e4e7',
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) {
  return (
    <div className="card flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">{value}</p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  )
}

function toChartData(items: CountItem[], hideZero = false) {
  return items.filter((i) => !hideZero || i.count > 0).map((i) => ({ name: formatEnum(i.label), value: i.count }))
}

function BarsChart({ items }: { items: CountItem[] }) {
  const data = toChartData(items)
  return (
    <div className="h-56" role="img" aria-label={`Bar chart: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 8, top: 4 }}>
          <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#27272a' }} contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="value" name="Servers" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DonutChart({ items }: { items: CountItem[] }) {
  const data = toChartData(items, true)
  if (data.length === 0) return <p className="py-16 text-center text-sm text-zinc-500">No data</p>
  return (
    <div>
      <div className="h-44" role="img" aria-label={`Donut chart: ${data.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#e4e4e7' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
            {d.name} <span className="text-zinc-200">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PurposeBreakdown({ items }: { items: CountItem[] }) {
  const sorted = items.filter((i) => i.count > 0).sort((a, b) => b.count - a.count)
  const max = Math.max(1, ...sorted.map((i) => i.count))
  return (
    <ul className="space-y-2.5">
      {sorted.map((i) => (
        <li key={i.label} className="text-sm">
          <div className="mb-1 flex justify-between text-zinc-300">
            <span>{formatEnum(i.label)}</span><span className="text-zinc-400">{i.count}</span>
          </div>
          <div className="h-1.5 rounded bg-zinc-800">
            <div className="h-1.5 rounded bg-indigo-400" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ServerList({ title, servers, timeOf }: { title: string; servers: Server[]; timeOf: (s: Server) => string }) {
  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        <Link to="/servers" className="text-xs text-indigo-300 hover:underline">View all</Link>
      </div>
      {servers.length === 0 ? <EmptyState title="No servers yet" /> : (
        <ul className="divide-y divide-zinc-800/70">
          {servers.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <Link to={`/servers/${s.id}`} className="block truncate text-sm font-medium text-indigo-300 hover:underline">{s.hostname}</Link>
                <p className="text-xs text-zinc-500">{s.environment} · {formatEnum(s.location)} · {formatEnum(s.purpose)}</p>
              </div>
              <div className="shrink-0 text-right">
                <StatusBadge status={s.status} />
                <p className="mt-0.5 text-xs text-zinc-500">{formatRelative(timeOf(s))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useApi(async () => {
    const [stats, added, changed] = await Promise.all([
      getStats(),
      listServers({ size: 5, sort: 'createdAt,desc' }),
      listServers({ size: 5, sort: 'updatedAt,desc' }),
    ])
    return { stats, added: added.content, changed: changed.content }
  }, [])

  return (
    <>
      <PageHeader title="Overview" subtitle="Current state of the server inventory." breadcrumbs={[{ label: 'Overview' }]} />
      {loading ? <Spinner />
        : error || !data ? <div className="card"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        : data.stats.total === 0 ? (
          <div className="card">
            <EmptyState title="The inventory is empty" description="Add servers to see statistics here."
                        action={<Link to="/servers/new" className="btn-primary">Add Server</Link>} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Total Servers" value={data.stats.total} icon={ServerIcon} tone="text-indigo-300" />
              <KpiCard label="Active Servers" value={data.stats.active} icon={Activity} tone="text-emerald-400" />
              <KpiCard label="Inactive Servers" value={data.stats.inactive} icon={PauseCircle} tone="text-zinc-400" />
              <KpiCard label="Maintenance" value={data.stats.maintenance} icon={Wrench} tone="text-amber-400" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="Servers by environment"><BarsChart items={data.stats.byEnvironment} /></ChartCard>
              <ChartCard title="Servers by operating system"><DonutChart items={data.stats.byOperatingSystem} /></ChartCard>
              <ChartCard title="Servers by location"><DonutChart items={data.stats.byLocation} /></ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="Servers by purpose"><PurposeBreakdown items={data.stats.byPurpose} /></ChartCard>
              <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                <ServerList title="Recently added" servers={data.added} timeOf={(s) => s.createdAt} />
                <ServerList title="Recently changed" servers={data.changed} timeOf={(s) => s.updatedAt} />
              </div>
            </div>
          </div>
        )}
    </>
  )
}

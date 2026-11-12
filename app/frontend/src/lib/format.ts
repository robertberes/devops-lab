const SPECIAL_LABELS: Record<string, string> = {
  AWS: 'AWS',
  MQ: 'MQ',
  CI_SERVER: 'CI Server',
  DEV: 'DEV',
  UAT: 'UAT',
  PROD: 'PROD',
  TEST: 'TEST',
}

/** "CI_SERVER" -> "CI Server", with a few acronym exceptions. */
export function formatEnum(value: string | null | undefined): string {
  if (!value) return '—'
  if (SPECIAL_LABELS[value]) return SPECIAL_LABELS[value]
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatRelative(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400], ['hour', 3600], ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(seconds, 'second')
}

export function formatGb(value: number | null | undefined): string {
  return value == null ? '—' : `${value} GB`
}

export function orDash(value: string | number | null | undefined): string {
  return value == null || value === '' ? '—' : String(value)
}

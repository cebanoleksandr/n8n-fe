const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "5 days ago", "3 months ago", "just now" (in the given language). */
export function formatRelative(date: string | Date, lng: string): string {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000
  const format = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(0, 'second')
}

/** "12 June"; the year is added when it is not the current one. */
export function formatDay(date: string | Date, lng: string): string {
  const value = new Date(date)
  const sameYear = value.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat(lng, {
    day: 'numeric',
    month: 'long',
    year: sameYear ? undefined : 'numeric',
  }).format(value)
}

/** "Oct 13, 10:00:00": the date and time of a run, to the second. */
export function formatDateTime(date: string | Date, lng: string): string {
  const value = new Date(date)
  const sameYear = value.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat(lng, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(value)
}

/** "75ms", "31.644s", "1m 2.506s", "2h 5m": n8n's run time format. */
export function formatDuration(ms: number): string {
  // Rounded first, so 999.6ms reads "1s", not "1000ms".
  const rounded = Math.max(0, Math.round(ms))
  if (rounded < 1000) return `${rounded}ms`
  const seconds = rounded / 1000
  if (seconds < 60) return `${+seconds.toFixed(3)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${+(seconds % 60).toFixed(3)}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

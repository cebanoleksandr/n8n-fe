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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatDateTime, formatDay, formatDuration, formatRelative } from './formatDate'

describe('formatDuration', () => {
  it('reads like n8n’s run time', () => {
    expect(formatDuration(75)).toBe('75ms')
    expect(formatDuration(31644)).toBe('31.644s')
    expect(formatDuration(62506)).toBe('1m 2.506s')
    expect(formatDuration(7_500_000)).toBe('2h 5m')
  })

  it('rounds before choosing the unit, and never goes negative', () => {
    expect(formatDuration(999.6)).toBe('1s')
    expect(formatDuration(-5)).toBe('0ms')
  })
})

describe('dates relative to now', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('says how long ago, in the given language', () => {
    expect(formatRelative('2026-10-11T12:00:00Z', 'en')).toBe('5 days ago')
    expect(formatRelative('2026-10-16T09:00:00Z', 'ru')).toBe('3 часа назад')
    expect(formatRelative('2026-10-16T11:59:50Z', 'en')).toBe('now')
  })

  it('adds the year only when it is not this one', () => {
    expect(formatDay('2026-06-12T10:00:00Z', 'en')).toBe('June 12')
    expect(formatDay('2025-06-12T10:00:00Z', 'ru')).toBe('12 июня 2025 г.')
  })

  it('formats a run start to the second', () => {
    expect(formatDateTime(new Date(2026, 9, 13, 10, 0, 5), 'en')).toBe('Oct 13, 10:00:05')
  })
})

import { describe, expect, it } from 'vitest'
import { sortItems } from './sorting'

const items = [
  { name: 'beta', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { name: 'Alpha', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
  { name: 'gamma', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
]
const names = (list: typeof items) => list.map((item) => item.name)

describe('sortItems', () => {
  it('sorts by date, newest first', () => {
    expect(names(sortItems(items, 'updatedAt:desc'))).toEqual(['gamma', 'beta', 'Alpha'])
    expect(names(sortItems(items, 'createdAt:desc'))).toEqual(['Alpha', 'beta', 'gamma'])
  })

  it('sorts by name regardless of case', () => {
    expect(names(sortItems(items, 'name:asc'))).toEqual(['Alpha', 'beta', 'gamma'])
    expect(names(sortItems(items, 'name:desc'))).toEqual(['gamma', 'beta', 'Alpha'])
  })

  it('leaves the original list alone', () => {
    sortItems(items, 'name:asc')
    expect(names(items)).toEqual(['beta', 'Alpha', 'gamma'])
  })
})

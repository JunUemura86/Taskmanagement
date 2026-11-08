import { describe, expect, test } from 'vitest'
import { formatDueDate, getDueStatus } from './dueDate'

// 「今日」を 2026-11-10 の夜（日付がずれやすい時間）に決めて確かめる
const today = new Date(2026, 10, 10, 23, 30)

describe('getDueStatus：期限の状態', () => {
  test('今日より前は期限切れ', () => {
    expect(getDueStatus('2026-11-09', today)).toBe('overdue')
    expect(getDueStatus('2025-12-31', today)).toBe('overdue')
  })

  test('今日と明日は期限が近い', () => {
    expect(getDueStatus('2026-11-10', today)).toBe('soon')
    expect(getDueStatus('2026-11-11', today)).toBe('soon')
  })

  test('明後日以降は通常', () => {
    expect(getDueStatus('2026-11-12', today)).toBe('normal')
    expect(getDueStatus('2027-01-10', today)).toBe('normal')
  })

  test('月をまたいでも正しく判断する', () => {
    const endOfMonth = new Date(2026, 10, 30)
    expect(getDueStatus('2026-12-01', endOfMonth)).toBe('soon')
    expect(getDueStatus('2026-12-02', endOfMonth)).toBe('normal')
  })
})

describe('formatDueDate：期限の表示', () => {
  test('今年なら「月/日」', () => {
    expect(formatDueDate('2026-11-10', today)).toBe('11/10')
    expect(formatDueDate('2026-01-05', today)).toBe('1/5')
  })

  test('今年以外なら「年/月/日」', () => {
    expect(formatDueDate('2027-01-10', today)).toBe('2027/1/10')
    expect(formatDueDate('2025-12-31', today)).toBe('2025/12/31')
  })
})

import { expect, test } from 'vitest'
import { getPriority } from './priority'

test('優先度ごとに矢印と文字を返す', () => {
  expect(getPriority(1).text).toBe('↑ 高')
  expect(getPriority(2).text).toBe('→ 中')
  expect(getPriority(3).text).toBe('↓ 低')
})

test('高だけ濃い色（白い文字）にする', () => {
  expect(getPriority(1).className).toContain('text-white')
  expect(getPriority(2).className).not.toContain('text-white')
  expect(getPriority(3).className).not.toContain('text-white')
})

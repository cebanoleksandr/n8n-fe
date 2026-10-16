import { defineConfig } from 'vitest/config'

// Unit tests of pure logic (graph edits, expressions, formatting…): plain
// Node, no DOM. Browser flows are covered by Playwright in e2e/.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_THEME, LEGACY_THEME, normalizeTheme, newProjectSettings } from './theme'

test('projects without a saved theme keep the legacy look (published sites must not shift)', () => {
  assert.deepEqual(normalizeTheme(undefined), LEGACY_THEME)
  assert.deepEqual(normalizeTheme({}), LEGACY_THEME)
  assert.equal(LEGACY_THEME.colorPrimary, '#06b6d4')
})

test('new projects start on the current default, as a copy', () => {
  const s = newProjectSettings()
  assert.deepEqual(s.theme, DEFAULT_THEME)
  assert.notEqual(s.theme, DEFAULT_THEME)
  assert.deepEqual(normalizeTheme(s.theme), DEFAULT_THEME)
})

// WCAG relative luminance contrast, for white text on .bam-btn.
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('default theme is readable: white on primary and muted on background pass AA', () => {
  assert.ok(contrast('#ffffff', DEFAULT_THEME.colorPrimary) >= 4.5)
  assert.ok(contrast(DEFAULT_THEME.colorMuted, DEFAULT_THEME.colorBg) >= 4.5)
  assert.ok(contrast(DEFAULT_THEME.colorText, DEFAULT_THEME.colorSurface) >= 4.5)
})

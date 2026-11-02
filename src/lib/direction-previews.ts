/**
 * Visual preview swatches for each BEYOND DESIGN direction, mirroring the
 * briefs in beyond-design.ts. Used by the landing page and the Site Wizard.
 * Illustrative styling only, never presented as customer sites.
 */

export interface DirectionPreview {
  bg: string
  fg: string
  accent: string
  font: string
}

export const DIRECTION_PREVIEW: Record<string, DirectionPreview> = {
  auto: { bg: '#0b0d14', fg: '#ffffff', accent: '#1f8fff', font: '"Inter Tight", system-ui, sans-serif' },
  editorial: { bg: '#FAF7F2', fg: '#1A1815', accent: '#C2532F', font: 'Georgia, "Times New Roman", serif' },
  'luxe-dark': { bg: '#0A0A0B', fg: '#F5F5F4', accent: '#C9A96A', font: '"Inter Tight", system-ui, sans-serif' },
  brutalist: { bg: '#F2F2F2', fg: '#000000', accent: '#FF3B00', font: 'ui-monospace, "SF Mono", Menlo, monospace' },
  'soft-organic': { bg: '#FDF9F3', fg: '#3D3A36', accent: '#D08C60', font: '"Nunito Sans", system-ui, sans-serif' },
  'glass-tech': { bg: '#06080D', fg: '#F8FAFC', accent: '#22D3EE', font: '"Inter Tight", system-ui, sans-serif' },
  swiss: { bg: '#FFFFFF', fg: '#000000', accent: '#E30613', font: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  'retro-print': { bg: '#F4E9D8', fg: '#2B2118', accent: '#D9480F', font: 'Georgia, serif' },
  'minimal-mono': { bg: '#FFFFFF', fg: '#111111', accent: '#111111', font: 'ui-monospace, Menlo, monospace' },
}

export function previewFor(key: string): DirectionPreview {
  return DIRECTION_PREVIEW[key] ?? DIRECTION_PREVIEW.swiss
}

// WCAG relative luminance / contrast, to pick legible text on any accent.
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4]
    .map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** White or black, whichever reads better on `bg`. */
export function readableOn(bg: string): string {
  return contrast('#ffffff', bg) >= contrast('#000000', bg) ? '#ffffff' : '#000000'
}

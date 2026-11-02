/**
 * Global site theme — fonts, colors, and radius applied across every page of a
 * project. Stored on `projects.settings.theme` and rendered as CSS custom
 * properties, so changing the theme restyles the whole site at once.
 */

export interface SiteTheme {
  fontHeading: string
  fontBody: string
  colorPrimary: string
  colorBg: string
  colorSurface: string
  colorText: string
  colorMuted: string
  radius: number
  maxWidth: number
}

/** Theme for new projects. Saved on the project at creation (newProjectSettings). */
export const DEFAULT_THEME: SiteTheme = {
  fontHeading: 'Sora',
  fontBody: 'DM Sans',
  colorPrimary: '#2563eb',
  colorBg: '#ffffff',
  colorSurface: '#f5f7fa',
  colorText: '#111827',
  colorMuted: '#5b6472',
  radius: 10,
  maxWidth: 1120,
}

/**
 * Fallback for projects that never saved a theme. Frozen: existing sites were
 * built (and published) against it, so changing it would silently recolor them.
 */
export const LEGACY_THEME: SiteTheme = {
  fontHeading: 'Inter',
  fontBody: 'Inter',
  colorPrimary: '#06b6d4',
  colorBg: '#ffffff',
  colorSurface: '#f8fafc',
  colorText: '#0f172a',
  colorMuted: '#64748b',
  radius: 12,
  maxWidth: 1100,
}

/** `settings` for a newly created project, so it starts on the current default theme. */
export function newProjectSettings(): { theme: SiteTheme } {
  return { theme: { ...DEFAULT_THEME } }
}

/** Google Fonts available in the theme editor (paired with the design directions). */
export const FONT_OPTIONS = [
  'Inter', 'Playfair Display', 'Cormorant Garamond', 'DM Sans', 'Nunito Sans',
  'Archivo Black', 'Space Grotesk', 'JetBrains Mono', 'IBM Plex Mono',
  'Libre Baskerville', 'Manrope', 'Outfit', 'Sora', 'Fraunces',
]

/** Curated one-click theme presets. */
export const THEME_PRESETS: Array<{ name: string; theme: SiteTheme }> = [
  { name: 'Clean Light', theme: DEFAULT_THEME },
  {
    name: 'Editorial',
    theme: { fontHeading: 'Playfair Display', fontBody: 'Inter', colorPrimary: '#c2532f', colorBg: '#faf7f2', colorSurface: '#f5f1ea', colorText: '#1a1815', colorMuted: '#7a736a', radius: 4, maxWidth: 1040 },
  },
  {
    name: 'Luxe Dark',
    theme: { fontHeading: 'Inter', fontBody: 'Inter', colorPrimary: '#c9a96a', colorBg: '#0a0a0b', colorSurface: '#111113', colorText: '#f5f5f4', colorMuted: '#a1a1a0', radius: 2, maxWidth: 1120 },
  },
  {
    name: 'Soft Organic',
    theme: { fontHeading: 'Nunito Sans', fontBody: 'Nunito Sans', colorPrimary: '#d08c60', colorBg: '#fdf9f3', colorSurface: '#f1f4f0', colorText: '#3d3a36', colorMuted: '#8a8378', radius: 28, maxWidth: 1080 },
  },
  {
    name: 'Glass Tech',
    theme: { fontHeading: 'Inter', fontBody: 'Inter', colorPrimary: '#22d3ee', colorBg: '#06080d', colorSurface: '#0b0e16', colorText: '#f8fafc', colorMuted: '#94a3b8', radius: 16, maxWidth: 1200 },
  },
  {
    name: 'Swiss',
    theme: { fontHeading: 'Inter', fontBody: 'Inter', colorPrimary: '#e30613', colorBg: '#ffffff', colorSurface: '#f4f4f5', colorText: '#000000', colorMuted: '#71717a', radius: 0, maxWidth: 1280 },
  },
]

export function normalizeTheme(raw: unknown): SiteTheme {
  const t = (raw ?? {}) as Partial<SiteTheme>
  return {
    fontHeading: typeof t.fontHeading === 'string' ? t.fontHeading : LEGACY_THEME.fontHeading,
    fontBody: typeof t.fontBody === 'string' ? t.fontBody : LEGACY_THEME.fontBody,
    colorPrimary: typeof t.colorPrimary === 'string' ? t.colorPrimary : LEGACY_THEME.colorPrimary,
    colorBg: typeof t.colorBg === 'string' ? t.colorBg : LEGACY_THEME.colorBg,
    colorSurface: typeof t.colorSurface === 'string' ? t.colorSurface : LEGACY_THEME.colorSurface,
    colorText: typeof t.colorText === 'string' ? t.colorText : LEGACY_THEME.colorText,
    colorMuted: typeof t.colorMuted === 'string' ? t.colorMuted : LEGACY_THEME.colorMuted,
    radius: typeof t.radius === 'number' ? t.radius : LEGACY_THEME.radius,
    maxWidth: typeof t.maxWidth === 'number' ? t.maxWidth : LEGACY_THEME.maxWidth,
  }
}

/** Google Fonts stylesheet URL for the theme's two families. */
export function themeFontUrl(theme: SiteTheme): string {
  const families = [...new Set([theme.fontHeading, theme.fontBody])]
    .map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

/**
 * The theme's CSS. Custom properties are the contract — generated pages and
 * blocks can reference var(--bam-*) and will follow the theme automatically.
 * Base element rules give sensible defaults without overriding explicit styles.
 */
export function themeCss(theme: SiteTheme): string {
  return `:root{
  --bam-font-heading:'${theme.fontHeading}',system-ui,sans-serif;
  --bam-font-body:'${theme.fontBody}',system-ui,sans-serif;
  --bam-primary:${theme.colorPrimary};
  --bam-bg:${theme.colorBg};
  --bam-surface:${theme.colorSurface};
  --bam-text:${theme.colorText};
  --bam-muted:${theme.colorMuted};
  --bam-radius:${theme.radius}px;
  --bam-max-width:${theme.maxWidth}px;
}
body{background:var(--bam-bg);color:var(--bam-text);font-family:var(--bam-font-body);margin:0}
h1,h2,h3,h4,h5,h6{font-family:var(--bam-font-heading);color:var(--bam-text)}
a{color:var(--bam-primary)}
.bam-container{max-width:var(--bam-max-width);margin:0 auto;padding:0 24px}
.bam-btn{background:var(--bam-primary);color:#fff;border-radius:var(--bam-radius);padding:14px 28px;display:inline-block;text-decoration:none;font-weight:600;transition:all .25s ease}
.bam-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.bam-card{background:var(--bam-surface);border-radius:var(--bam-radius);padding:28px}
.bam-muted{color:var(--bam-muted)}`
}

/** Full <link> + <style> head snippet for published pages. */
export function themeHead(theme: SiteTheme): string {
  return `<link href="${themeFontUrl(theme)}" rel="stylesheet" /><style>${themeCss(theme)}</style>`
}

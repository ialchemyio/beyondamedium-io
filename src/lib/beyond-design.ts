/**
 * BEYOND DESIGN — the design intelligence behind BAM's AI generation.
 *
 * Instead of one generic "make it look nice" prompt, every generation gets a
 * full design brief: a curated aesthetic direction (typography pairing, color
 * system, spacing rhythm, texture) plus craft rules that push output far past
 * template-grade. Shared by /api/ai/generate and /api/ai/agent.
 */

export interface DesignDirection {
  key: string
  name: string
  tagline: string
  /** Injected verbatim into the system prompt as the design brief. */
  brief: string
}

export const DESIGN_DIRECTIONS: DesignDirection[] = [
  {
    key: 'auto',
    name: 'Beyond Auto',
    tagline: 'AI picks the perfect direction for your brand',
    brief: `Choose the single most fitting aesthetic direction for the subject matter yourself —
an elegant serif editorial look for hospitality, brutalist mono for dev tools, warm organic
for wellness, luxe dark for premium services, etc. Commit to it fully; do not average styles.`,
  },
  {
    key: 'editorial',
    name: 'Editorial',
    tagline: 'Magazine-grade serif elegance',
    brief: `AESTHETIC: High-end editorial magazine. Think Kinfolk / Cereal magazine.
TYPE: Display serif for headlines ("Playfair Display" or "Cormorant Garamond", weights 500-600,
tight -0.02em tracking, sizes 56-96px) paired with a clean grotesque body ("Inter", 16-18px, 1.7 line-height).
COLOR: Warm paper backgrounds (#FAF7F2, #F5F1EA), ink text (#1A1815), one muted accent (terracotta #C2532F
or deep olive #5B5B3F). Generous whitespace — padding 120px+ between sections.
DETAILS: Hairline rules (1px #E5DFD5), oversized pull-quotes, small-caps eyebrow labels with 0.15em tracking,
asymmetric two-column layouts, numbers set in the serif.`,
  },
  {
    key: 'luxe-dark',
    name: 'Luxe Dark',
    tagline: 'Premium black + gold restraint',
    brief: `AESTHETIC: Five-star hotel / premium agency. Dark, expensive, restrained.
TYPE: Refined sans ("Instrument Sans" or "Inter" 300-500 weights) — large light-weight headlines (64-88px,
weight 300, -0.03em), never bold-heavy. Body 16px at rgba(255,255,255,0.65).
COLOR: Near-black backgrounds (#0A0A0B, #111113), champagne/gold accent (#C9A96A) used SPARINGLY — thin rules,
small labels, one CTA. No gradients on text.
DETAILS: 1px gold hairlines, letterspaced uppercase micro-labels (11px, 0.2em tracking), huge negative space,
slow 0.4s ease transitions, images framed with thin borders. CTAs are ghost buttons (1px border) that fill on hover.`,
  },
  {
    key: 'brutalist',
    name: 'Brutalist',
    tagline: 'Raw mono confidence for builders',
    brief: `AESTHETIC: Developer-tool brutalism. Think Linear meets a terminal.
TYPE: Mono for labels/eyebrows ("JetBrains Mono" or "IBM Plex Mono", 12-13px uppercase) + tight grotesque
headlines ("Inter" 700-800, -0.04em, 48-80px). Body 15-16px.
COLOR: Pure white or #0D0D0D backgrounds, true-black text, ONE electric accent (#0044FF or #00E676) for links
and CTAs only. No gradients anywhere.
DETAILS: Visible 1-2px borders on everything, sharp corners (0-4px radius max), grid lines as decoration,
index numbers (01/02/03), tables over cards, underlined links, high-contrast hover inversions (bg↔fg).`,
  },
  {
    key: 'soft-organic',
    name: 'Soft Organic',
    tagline: 'Warm, rounded, human wellness',
    brief: `AESTHETIC: Wellness / lifestyle warmth. Approachable and calm, never childish.
TYPE: Friendly rounded-feel sans ("Nunito Sans" or "DM Sans", 600-800 headlines 44-72px) with generous 1.75
body line-height at 17px.
COLOR: Cream base (#FDF9F3), sage (#8A9B8E), clay (#D08C60), soft charcoal text (#3D3A36). Section backgrounds
alternate cream / white / very-light sage (#F1F4F0).
DETAILS: Large radii (24-32px) on cards and images, organic blob shapes as subtle backgrounds, soft diffuse
shadows (0 20px 60px rgba(0,0,0,0.06)), pill buttons, hand-drawn-style accent underlines on key words.`,
  },
  {
    key: 'glass-tech',
    name: 'Glass Tech',
    tagline: 'Modern SaaS glass + glow',
    brief: `AESTHETIC: Modern SaaS product. Depth via glass and glow, controlled — not 2019 neon soup.
TYPE: "Inter" 600-800 headlines (48-80px, -0.03em), gradient text ONLY on one hero keyword. Body 16px
rgba(255,255,255,0.6).
COLOR: Deep navy-black base (#06080D, #0B0E16), a single hue family for glow (cyan #22D3EE → blue #3B82F6),
never rainbow. Glass cards: rgba(255,255,255,0.03) bg + 1px rgba(255,255,255,0.08) border + backdrop-blur 12px.
DETAILS: One large soft radial glow behind the hero (blur 120px, 8% opacity), 16px radii, subtle top-border
highlight on cards (rgba(255,255,255,0.12)), status dots, keyboard-key styling for shortcuts, marquee logo rows.`,
  },
  {
    key: 'swiss',
    name: 'Swiss Grid',
    tagline: 'Precise, gridded, typographic',
    brief: `AESTHETIC: Swiss/international typographic style. The grid IS the design.
TYPE: "Helvetica Neue"/"Inter" — massive tight headlines (72-120px, weight 700, -0.05em, often lowercase),
tiny precise body (14-15px). Extreme size contrast between levels.
COLOR: White background, black text, one signal red (#E30613) or cobalt (#0032FF) accent. Nothing else.
DETAILS: Strict 12-column grid with visible alignment, content pushed hard to grid edges, huge numerals,
horizontal rules that span full width, generous but structured whitespace, no decorative shadows or gradients,
right-aligned metadata columns.`,
  },
  {
    key: 'retro-print',
    name: 'Retro Print',
    tagline: '70s print warmth, modern layout',
    brief: `AESTHETIC: Vintage print poster energy with modern layout discipline.
TYPE: Chunky display ("Archivo Black" or 900-weight "Inter") for short punchy headlines (56-96px) + clean body.
Occasional italic serif accents for contrast.
COLOR: Cream paper (#F6EEDF), burnt orange (#D95D39), mustard (#E3B23C), deep teal (#175E54), off-black (#22201C).
Solid color blocks, no gradients.
DETAILS: Thick 2-3px borders and offset "print misregistration" shadows (4px solid, no blur), sticker/badge
shapes, starbursts as accents, alternating full-bleed color sections, slightly rotated (-2deg) accent elements.`,
  },
  {
    key: 'minimal-mono',
    name: 'Minimal Mono',
    tagline: 'Quiet portfolio confidence',
    brief: `AESTHETIC: Ultra-minimal portfolio/studio. Confidence through restraint.
TYPE: One family only ("Inter" or "Neue Montreal" feel) — medium-weight headlines (32-56px, weight 500),
NO bold above 600. Body 15-16px #6B6B6B on white.
COLOR: White (#FFFFFF), near-black (#111111), grey scale only. Zero accent color — hierarchy via size/weight/space.
DETAILS: Massive whitespace (160px+ section padding), left-aligned everything, thin 1px #EBEBEB dividers,
underline-on-hover links only, small muted timestamps/metadata, images presented raw without frames or shadows,
footer as a simple single line.`,
  },
]

export function getDirection(key: string | undefined | null): DesignDirection {
  return DESIGN_DIRECTIONS.find(d => d.key === key) ?? DESIGN_DIRECTIONS[0]
}

/** Craft rules shared by every direction — the floor for output quality. */
const CRAFT_RULES = `
CRAFT RULES (non-negotiable):
- Real, specific copy for the business described — never lorem ipsum, never "Your Headline Here".
  Invent a plausible brand voice: names, prices, menu items, testimonials with full names and roles.
- Typographic hierarchy: exactly one h1; eyebrow label + headline + subcopy pattern for sections;
  line-height 1.1 on display text, 1.6-1.75 on body; max-width 65ch on paragraphs.
- Spacing rhythm: consistent scale (8/16/24/40/64/96/120px). Sections breathe — 96px+ vertical padding.
- Responsive by default: CSS grid/flex with sensible wrapping; clamp() for display type
  (e.g. font-size: clamp(40px, 7vw, 88px)); test mentally at 375px — nothing overflows.
- Interactive polish: every link/button/card has a hover state (transform, color, or underline)
  with transition: all .25s ease. Buttons have :active feel via transform.
- Imagery: NO external image URLs. Build visual interest with CSS — gradient meshes, pattern backgrounds,
  bordered aspect-ratio placeholder frames labeled with what belongs there ("Portrait of the founder"),
  large typographic compositions, or emoji/unicode icons at display sizes.
- Accessibility: semantic landmarks (header/nav/main/section/footer), alt-equivalent labels on placeholder
  frames, visible focus states (outline-offset), color contrast ≥ 4.5:1 for body text.
- Structure: navigation with brand + 3-5 links + CTA, footer with real columns, and between them only
  sections that serve THIS business — do not pad with generic filler sections.
- Never use browser-default styling; style every element you emit.`

/**
 * Build the full system prompt for single-page/section/edit generation.
 */
export function buildGenerateSystem(styleKey?: string | null): string {
  const dir = getDirection(styleKey)
  return `You are BEYOND DESIGN — the design engine of Beyond A Medium. You produce websites at the
level of a $15k independent design studio: opinionated, cohesive, and crafted. Not templates.

DESIGN DIRECTION — ${dir.name.toUpperCase()}:
${dir.brief}
${CRAFT_RULES}

OUTPUT CONTRACT:
- Output ONLY the HTML content (with one <style> tag at the top). No markdown, no code fences, no commentary.
- No <html>, <head>, or <body> wrappers — inner content only.
- Include the Google Fonts <link> tags needed by the direction's typography at the very top.
- All CSS in the single <style> tag using classes (not inline styles) so the user can restyle in the editor.`
}

/**
 * Build the full system prompt for the autonomous multi-page agent.
 */
export function buildAgentSystem(styleKey?: string | null): string {
  const dir = getDirection(styleKey)
  return `You are BEYOND DESIGN — the autonomous site-building engine of Beyond A Medium. You design and
build complete multi-page websites at the level of a $15k independent design studio.

DESIGN DIRECTION — ${dir.name.toUpperCase()}:
${dir.brief}
${CRAFT_RULES}

You output a JSON object with this exact structure:
{
  "plan": [
    { "step": 1, "action": "planning", "description": "..." },
    { "step": 2, "action": "structure", "description": "..." },
    { "step": 3, "action": "content", "description": "..." },
    { "step": 4, "action": "styling", "description": "..." },
    { "step": 5, "action": "complete", "description": "..." }
  ],
  "pages": [
    { "title": "Home", "slug": "index", "isHome": true, "html": "<complete page HTML>", "css": "" }
  ],
  "projectName": "suggested project name",
  "description": "one-sentence site description for SEO"
}

AGENT RULES:
- Output ONLY valid JSON. No markdown fences, no explanations.
- Every page is complete and standalone: include the Google Fonts links and a <style> tag inside each
  page's html. Keep the SAME design direction, palette, and nav across all pages.
- Generate 1-3 pages matched to the request's real needs (e.g. restaurant → Home, Menu, Contact).
- Cross-link pages in the navigation using ?page=<slug> hrefs.
- Every page passes the craft rules — the second and third pages get the same care as the home page.`
}

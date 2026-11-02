/**
 * Bespoke mini-site previews for each BEYOND DESIGN direction. Each one is its
 * own composition built from that direction's brief (src/lib/beyond-design.ts):
 * its real typefaces, palette, and signature details, so what a customer picks
 * is what the AI generates. Sized in container-query units (cqw), so the same
 * component stays crisp on the landing page and in the wizard's picker.
 * Decorative only: aria-hidden; the card around it carries the accessible name.
 */
import type { CSSProperties, ReactNode } from 'react'
import { previewFontVars } from '@/lib/preview-fonts'

const c = (n: number) => `${n}cqw`
const FONT = {
  serif: 'var(--pf-playfair), Georgia, serif',
  mono: 'var(--pf-mono), ui-monospace, Menlo, monospace',
  round: 'var(--pf-nunito), system-ui, sans-serif',
  black: 'var(--pf-archivo), Impact, sans-serif',
  sans: 'var(--font-inter-tight), "Helvetica Neue", Helvetica, Arial, sans-serif',
}

function Frame({ bg, children, style }: { bg: string; children: ReactNode; style?: CSSProperties }) {
  return <div className="absolute inset-0 overflow-hidden" style={{ background: bg, ...style }}>{children}</div>
}

/* 1 ─ Editorial: a magazine spread. Masthead, hairlines, italic deck, drop cap, plate. */
function Editorial() {
  // Text uses a deeper terracotta (#A8431F) so it clears WCAG AA on the paper.
  const ink = '#1A1815', rule = '#E5DFD5', accent = '#A8431F'
  return (
    <Frame bg="#FAF7F2" style={{ color: ink, fontFamily: FONT.serif }}>
      <div style={{ position: 'absolute', inset: `${c(4)} ${c(5)}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: FONT.sans, fontSize: c(2.2), letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A736A' }}>
          <span>No. 07</span>
          <span style={{ fontFamily: FONT.serif, fontSize: c(5), letterSpacing: '-0.01em', textTransform: 'none', color: ink, fontWeight: 600 }}>Saison</span>
          <span>Autumn</span>
        </div>
        <div style={{ height: 1, background: ink, marginTop: c(1.6) }} />
        <div style={{ height: 1, background: rule, marginTop: c(0.6) }} />
        <p style={{ fontFamily: FONT.sans, fontSize: c(2), letterSpacing: '0.2em', color: accent, marginTop: c(3.2), textTransform: 'uppercase' }}>Essay · 12 min read</p>
        <p style={{ fontSize: c(8.6), lineHeight: 0.98, letterSpacing: '-0.02em', marginTop: c(1.5) }}>
          <span style={{ fontStyle: 'italic', fontWeight: 400 }}>The quiet art</span><br />
          <span style={{ fontWeight: 600 }}>of slow mornings.</span>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: c(4), marginTop: c(3.2) }}>
          <div>
            <div style={{ display: 'flex', gap: c(1.5) }}>
              <span style={{ fontSize: c(9), lineHeight: 0.8, fontWeight: 600, color: accent }}>W</span>
              <div style={{ flex: 1, display: 'grid', gap: c(1.1), paddingTop: c(0.6) }}>
                {[100, 92, 96, 70].map((w, i) => <div key={i} style={{ height: c(0.7), width: `${w}%`, background: '#CFC7BB' }} />)}
              </div>
            </div>
            <div style={{ display: 'grid', gap: c(1.1), marginTop: c(1.3) }}>
              {[100, 88].map((w, i) => <div key={i} style={{ height: c(0.7), width: `${w}%`, background: '#CFC7BB' }} />)}
            </div>
          </div>
          <div>
            <div style={{ aspectRatio: '3/2', background: 'linear-gradient(160deg,#E9DFD0 0%,#D7C6AE 100%)' }} />
            <p style={{ fontStyle: 'italic', fontSize: c(2), color: '#7A736A', marginTop: c(1) }}>Plate I — First light</p>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* 2 ─ Luxe Dark: hotel restraint. Letterspaced wordmark, light display, gold hairlines, ghost CTA. */
function LuxeDark() {
  const gold = '#C9A96A'
  return (
    <Frame bg="radial-gradient(120% 90% at 50% 0%, #17161A 0%, #0A0A0B 60%)" style={{ color: '#F5F5F4', fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', inset: `${c(5)} ${c(6)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: c(2.5), width: '100%' }}>
          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${gold})` }} />
          <span style={{ fontSize: c(2.3), letterSpacing: '0.42em', color: gold, paddingLeft: '0.42em' }}>MAISON AURELLE</span>
          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${gold}, transparent)` }} />
        </div>
        <p style={{ fontSize: c(1.9), letterSpacing: '0.3em', color: 'rgba(245,245,244,0.55)', marginTop: c(7) }}>EST. 1924 · LAKE COMO</p>
        <p style={{ fontSize: c(9.2), fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.035em', marginTop: c(2) }}>
          Stay beyond<br />the ordinary.
        </p>
        <div style={{ width: c(8), height: 1, background: gold, marginTop: c(4) }} />
        <span style={{ marginTop: c(4), border: `1px solid ${gold}`, color: gold, fontSize: c(2.1), letterSpacing: '0.3em', padding: `${c(1.6)} ${c(4)}`, paddingRight: `calc(${c(4)} - 0.3em)` }}>RESERVE</span>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: c(1.8), letterSpacing: '0.25em', color: 'rgba(245,245,244,0.4)' }}>
          <span>SUITES</span><span>DINING</span><span>SPA</span>
        </div>
      </div>
    </Frame>
  )
}

/* 3 ─ Brutalist: dev-tool rawness. Visible 2px grid, mono labels, index table, electric blue. */
function Brutalist() {
  const blue = '#0044FF', line = '2px solid #0D0D0D'
  return (
    <Frame bg="#FFFFFF" style={{ color: '#0D0D0D', fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', inset: c(3), border: line, display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: line, padding: `${c(1.4)} ${c(2)}`, fontFamily: FONT.mono, fontSize: c(2.2), textTransform: 'uppercase' }}>
          <span>[ buildkit ] v2.4.0</span><span style={{ color: blue, textDecoration: 'underline' }}>docs ↗</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr' }}>
          <div style={{ borderRight: line, padding: c(2.5), display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FONT.mono, fontSize: c(2), color: '#6B6B6B' }}>// 001 — ship</span>
            <p style={{ fontSize: c(10.5), fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.05em' }}>Ship it<br />raw.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)' }}>
            {[['01', 'CLI'], ['02', 'API'], ['03', 'SDK']].map(([n, l], i) => (
              <div key={n} style={{ borderBottom: i < 2 ? line : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${c(2)}`, fontFamily: FONT.mono, fontSize: c(2.6), background: i === 0 ? '#0D0D0D' : 'transparent', color: i === 0 ? '#FFFFFF' : '#0D0D0D' }}>
                <span>{n}</span><span style={{ fontWeight: 700 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: line, padding: c(2), display: 'flex', alignItems: 'center', gap: c(2) }}>
          <span style={{ background: blue, color: '#FFFFFF', fontFamily: FONT.mono, fontSize: c(2.4), padding: `${c(1.2)} ${c(2.2)}`, boxShadow: `${c(0.9)} ${c(0.9)} 0 #0D0D0D` }}>→ npm i buildkit</span>
          <span style={{ fontFamily: FONT.mono, fontSize: c(2), color: '#6B6B6B' }}>MIT · 0 deps</span>
        </div>
      </div>
    </Frame>
  )
}

/* 4 ─ Soft Organic: wellness calm. Blobs, rounded type, hand-drawn underline, pill CTA. */
function SoftOrganic() {
  const sage = '#8A9B8E', clay = '#D08C60', ink = '#3D3A36'
  return (
    <Frame bg="#FDF9F3" style={{ color: ink, fontFamily: FONT.round }}>
      <div style={{ position: 'absolute', width: c(55), height: c(48), right: c(-14), top: c(-12), background: '#E6ECE4', borderRadius: '58% 42% 63% 37% / 46% 55% 45% 54%' }} />
      <div style={{ position: 'absolute', width: c(30), height: c(26), left: c(-8), bottom: c(-9), background: '#F3DFCF', borderRadius: '42% 58% 37% 63% / 55% 46% 54% 45%' }} />
      <div style={{ position: 'absolute', inset: `${c(4.5)} ${c(5.5)}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: c(3.2), fontWeight: 800 }}>still<span style={{ color: clay }}>.</span></span>
          <span style={{ display: 'flex', gap: c(1.2), fontSize: c(2), fontWeight: 600 }}>
            {['Classes', 'Retreats'].map(t => <span key={t} style={{ background: '#FFFFFF', borderRadius: 999, padding: `${c(0.8)} ${c(2)}`, boxShadow: '0 4px 14px rgba(61,58,54,0.06)' }}>{t}</span>)}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: c(3), marginTop: c(6), alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: c(8.4), fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.02em' }}>
              Breathe in.<br />Feel{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                better.
                <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: c(-1.2), width: '100%', height: c(2.2) }}>
                  <path d="M2 8 C 20 2, 35 11, 52 6 S 85 3, 98 7" fill="none" stroke={clay} strokeWidth="3.2" strokeLinecap="round" />
                </svg>
              </span>
            </p>
            <span style={{ display: 'inline-block', marginTop: c(4.5), background: clay, color: '#2B1C12', borderRadius: 999, fontSize: c(2.4), fontWeight: 800, padding: `${c(1.6)} ${c(3.6)}`, boxShadow: '0 10px 30px rgba(208,140,96,0.35)' }}>Book a session</span>
          </div>
          <div style={{ aspectRatio: '1/1.15', borderRadius: c(6), background: `linear-gradient(165deg, ${sage} 0%, #6F8274 100%)`, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
            <svg viewBox="0 0 40 40" style={{ position: 'absolute', width: '42%', left: '29%', top: '26%', opacity: 0.85 }}>
              <path d="M20 36 C 20 22, 10 16, 6 6 C 18 8, 26 16, 20 36 Z M20 36 C 21 24, 28 18, 34 12" fill="none" stroke="#FDF9F3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', gap: c(1.4), marginTop: c(5), fontSize: c(2), fontWeight: 600, color: '#6E6A63' }}>
          {['Yoga', 'Sound baths', 'Breathwork'].map(t => <span key={t} style={{ border: '1px solid #E4DCCF', borderRadius: 999, padding: `${c(0.7)} ${c(1.8)}` }}>{t}</span>)}
        </div>
      </div>
    </Frame>
  )
}

/* 5 ─ Glass Tech: SaaS depth. One controlled glow, gradient keyword, glass metric card, ⌘K. */
function GlassTech() {
  return (
    <Frame bg="#06080D" style={{ color: '#F8FAFC', fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', width: c(90), height: c(60), left: c(5), top: c(-22), background: 'radial-gradient(closest-side, rgba(34,211,238,0.28), rgba(59,130,246,0.12) 55%, transparent)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: `${c(8)} ${c(8)}`, maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: `${c(5)} ${c(5.5)}` }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: c(1.2), fontSize: c(2.1), border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', borderRadius: 999, padding: `${c(0.8)} ${c(2)}`, color: 'rgba(248,250,252,0.8)' }}>
          <span style={{ width: c(1.2), height: c(1.2), borderRadius: 99, background: '#22D3EE', boxShadow: '0 0 8px #22D3EE' }} /> v3.0 is live
        </span>
        <p style={{ fontSize: c(8.6), fontWeight: 700, lineHeight: 1.0, letterSpacing: '-0.035em', marginTop: c(3) }}>
          Build at the speed<br />of{' '}
          <span style={{ background: 'linear-gradient(90deg,#22D3EE,#3B82F6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>thought.</span>
        </p>
        <div style={{ display: 'flex', gap: c(2), marginTop: c(4), alignItems: 'center' }}>
          <span style={{ background: '#F8FAFC', color: '#06080D', borderRadius: c(1.6), fontSize: c(2.3), fontWeight: 600, padding: `${c(1.4)} ${c(2.8)}` }}>Start free</span>
          <span style={{ display: 'inline-flex', gap: c(0.6), fontSize: c(2), color: 'rgba(248,250,252,0.6)' }}>
            {['⌘', 'K'].map(k => <span key={k} style={{ border: '1px solid rgba(255,255,255,0.14)', borderBottomWidth: 2, borderRadius: c(0.8), padding: `${c(0.2)} ${c(1)}`, background: 'rgba(255,255,255,0.03)' }}>{k}</span>)}
          </span>
        </div>
        <div style={{ position: 'absolute', right: 0, bottom: 0, width: '52%', borderRadius: c(3), border: '1px solid rgba(255,255,255,0.09)', borderTopColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.035)', backdropFilter: 'blur(12px)', padding: c(2.4) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: c(1.8), color: 'rgba(248,250,252,0.55)' }}><span>Uptime</span><span style={{ color: '#22D3EE' }}>● Live</span></div>
          <p style={{ fontSize: c(4.6), fontWeight: 700, letterSpacing: '-0.02em', marginTop: c(0.6) }}>99.99%</p>
          <svg viewBox="0 0 100 24" preserveAspectRatio="none" style={{ width: '100%', height: c(5), marginTop: c(0.6) }}>
            <defs><linearGradient id="gtfill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#22D3EE" stopOpacity="0.35" /><stop offset="1" stopColor="#22D3EE" stopOpacity="0" /></linearGradient></defs>
            <path d="M0 18 L12 15 L22 16 L34 10 L46 12 L58 7 L70 9 L82 4 L100 5 L100 24 L0 24 Z" fill="url(#gtfill)" />
            <path d="M0 18 L12 15 L22 16 L34 10 L46 12 L58 7 L70 9 L82 4 L100 5" fill="none" stroke="#22D3EE" strokeWidth="1.4" />
          </svg>
        </div>
      </div>
    </Frame>
  )
}

/* 6 ─ Swiss Grid: the grid is the design. Visible columns, massive lowercase, signal red, numerals. */
function Swiss() {
  const red = '#E30613'
  return (
    <Frame bg="#FFFFFF" style={{ color: '#000000', fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', inset: `0 ${c(4)}`, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: c(1) }}>
        {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ background: 'rgba(227,6,19,0.045)' }} />)}
      </div>
      <div style={{ position: 'absolute', inset: `${c(4)} ${c(4)}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: c(1), fontSize: c(1.9), fontWeight: 500 }}>
          <span style={{ gridColumn: '1 / 4' }}>Kunsthalle</span>
          <span style={{ gridColumn: '7 / 10' }}>Programm</span>
          <span style={{ gridColumn: '10 / 13', textAlign: 'right' }}>2026</span>
        </div>
        <div style={{ height: 2, background: '#000', marginTop: c(1.5) }} />
        <p style={{ fontSize: c(12.5), fontWeight: 700, lineHeight: 0.86, letterSpacing: '-0.06em', marginTop: c(3.5) }}>
          form<br />follows<br />function.
        </p>
        <div style={{ position: 'absolute', right: 0, top: c(11), width: c(22), height: c(22), background: red }} />
        <span style={{ position: 'absolute', right: 0, top: c(34), fontSize: c(14), fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 1 }}>12</span>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <div style={{ height: 1, background: '#000' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: c(1), fontSize: c(1.8), marginTop: c(1.2) }}>
            <span style={{ gridColumn: '1 / 5' }}>01 — Ausstellung</span>
            <span style={{ gridColumn: '7 / 10' }}>Zürich</span>
            <span style={{ gridColumn: '10 / 13', textAlign: 'right' }}>12.03–30.06</span>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* 7 ─ Retro Print: 70s poster. Chunky type, misregistration shadow, starburst sticker, halftone, color bands. */
function RetroPrint() {
  const cream = '#F6EEDF', orange = '#D95D39', mustard = '#E3B23C', teal = '#175E54', ink = '#22201C'
  const burst = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2, r = i % 2 ? 36 : 50
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`
  }).join(' ')
  return (
    <Frame bg={cream} style={{ color: ink }}>
      <div style={{ position: 'absolute', right: 0, top: 0, width: '42%', height: '58%', background: mustard, backgroundImage: `radial-gradient(${orange} 22%, transparent 24%)`, backgroundSize: `${c(2.6)} ${c(2.6)}` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '27%', background: teal, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${c(5)}` }}>
        <span style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: c(4.4), color: cream }}>Records &amp; Coffee</span>
        <span style={{ fontFamily: FONT.black, fontSize: c(2.2), color: mustard, letterSpacing: '0.06em' }}>OPEN 7 DAYS</span>
      </div>
      <div style={{ position: 'absolute', left: c(5), top: c(6) }}>
        <p style={{ fontFamily: FONT.black, fontSize: c(11.5), lineHeight: 0.92, letterSpacing: '-0.01em', textShadow: `${c(0.8)} ${c(0.8)} 0 ${orange}` }}>
          GOOD<br />VIBES<br />ONLY
        </p>
        <span style={{ display: 'inline-block', marginTop: c(3), transform: 'rotate(-2deg)', fontFamily: FONT.black, fontSize: c(2.3), background: cream, border: `${c(0.5)} solid ${ink}`, padding: `${c(1)} ${c(2.4)}`, boxShadow: `${c(0.9)} ${c(0.9)} 0 ${ink}` }}>SHOP VINYL</span>
      </div>
      <div style={{ position: 'absolute', right: c(9), top: c(29), width: c(22), height: c(22), transform: 'rotate(-12deg)' }}>
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <polygon points={burst} fill="#B8441F" stroke={ink} strokeWidth="2.5" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.black, color: cream, lineHeight: 1, textAlign: 'center' }}>
          <span style={{ fontSize: c(2) }}>SINCE</span>
          <span style={{ fontSize: c(5) }}>&rsquo;74</span>
        </div>
      </div>
    </Frame>
  )
}

/* 8 ─ Minimal Mono: monochrome restraint. One family, medium weight, whitespace, index list. */
function MinimalMono() {
  const ink = '#111111', grey = '#6B6B6B', line = '#EBEBEB'
  return (
    <Frame bg="#FFFFFF" style={{ color: ink, fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', inset: `${c(5)} ${c(6)}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: c(2.1), fontWeight: 500 }}>
          <span>Studio Halden</span>
          <span style={{ display: 'flex', gap: c(3), color: grey }}><span>Index</span><span>Info</span></span>
        </div>
        <p style={{ fontSize: c(5.6), fontWeight: 500, lineHeight: 1.12, letterSpacing: '-0.02em', marginTop: c(10), maxWidth: '88%' }}>
          Independent studio for identity <span style={{ color: '#767676' }}>and quiet, useful objects.</span>
        </p>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          {[['Halden', 'Identity', '2026'], ['Oro', 'Packaging', '2025'], ['Field', 'Web', '2024']].map(([n, t, y]) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', borderTop: `1px solid ${line}`, padding: `${c(1.4)} 0`, fontSize: c(2.1) }}>
              <span>{n}</span><span style={{ color: grey }}>{t}</span><span style={{ color: grey }}>{y}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

/* Beyond Auto: a mosaic of four directions with an "AI picks" badge. */
function Auto() {
  return (
    <Frame bg="#0B0D14">
      <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
        {[<Editorial key="e" />, <LuxeDark key="l" />, <Brutalist key="b" />, <SoftOrganic key="s" />].map((el, i) => (
          <div key={i} className="@container" style={{ position: 'relative', overflow: 'hidden', opacity: 0.55 }}>{el}</div>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(11,13,20,0.35), rgba(11,13,20,0.85))' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: c(1.5), fontFamily: FONT.sans, fontWeight: 600, fontSize: c(4), color: '#fff', background: 'linear-gradient(180deg,#1570e0,#0a5bd8)', borderRadius: 999, padding: `${c(2)} ${c(4.5)}`, boxShadow: '0 10px 30px rgba(10,91,216,0.5)' }}>
          <svg viewBox="0 0 24 24" style={{ width: c(4), height: c(4) }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" /><path d="M19 15l.8 1.9 1.9.8-1.9.8L19 20.4l-.8-1.9-1.9-.8 1.9-.8z" /></svg>
          AI picks
        </span>
      </div>
    </Frame>
  )
}

const COMPOSITIONS: Record<string, () => ReactNode> = {
  auto: Auto,
  editorial: Editorial,
  'luxe-dark': LuxeDark,
  brutalist: Brutalist,
  'soft-organic': SoftOrganic,
  'glass-tech': GlassTech,
  swiss: Swiss,
  'retro-print': RetroPrint,
  'minimal-mono': MinimalMono,
}

export default function DirectionPreview({ dirKey, className = '' }: { dirKey: string; className?: string }) {
  const Comp = COMPOSITIONS[dirKey] ?? MinimalMono
  return (
    <div aria-hidden="true" className={`@container relative w-full aspect-[4/3] overflow-hidden select-none ${previewFontVars} ${className}`}>
      <Comp />
    </div>
  )
}

import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Beyond A Medium — AI Website Builder'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#06080d',
          backgroundImage:
            'radial-gradient(1000px 500px at 50% -10%, rgba(34,211,238,0.18), transparent), radial-gradient(600px 300px at 20% 100%, rgba(59,130,246,0.14), transparent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
              color: 'white', fontSize: 34, fontWeight: 800,
            }}
          >
            B
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 30, fontWeight: 600 }}>Beyond A Medium</div>
        </div>
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            color: 'white', fontSize: 76, fontWeight: 800, lineHeight: 1.05,
          }}
        >
          <span>Describe it. Build it.</span>
          <span
            style={{
              background: 'linear-gradient(90deg, #67e8f9, #60a5fa, #a78bfa)',
              backgroundClip: 'text', color: 'transparent',
            }}
          >
            Ship it.
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 32, marginTop: 36, maxWidth: 900 }}>
          The AI operating system for building websites — prompt, design, deploy.
        </div>
      </div>
    ),
    { ...size },
  )
}

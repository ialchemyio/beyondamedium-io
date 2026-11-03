import { ImageResponse } from 'next/og'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

export const runtime = 'nodejs'
export const alt = 'Beyond A Medium — AI Website Builder'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/brand/bam-lockup.png'), 'base64')

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
            'radial-gradient(1000px 500px at 50% -10%, rgba(31,143,255,0.22), transparent), radial-gradient(600px 300px at 20% 100%, rgba(21,112,224,0.16), transparent)',
        }}
      >
        <img src={`data:image/png;base64,${logo}`} alt="BAM | Beyond A Medium" width={389} height={90} style={{ marginBottom: 48 }} />
        <div
          style={{
            display: 'flex', flexDirection: 'column',
            color: 'white', fontSize: 76, fontWeight: 800, lineHeight: 1.05,
          }}
        >
          <span>Describe it. Build it.</span>
          <span
            style={{
              background: 'linear-gradient(90deg, #8ec5ff, #4aa8ff, #1f8fff)',
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

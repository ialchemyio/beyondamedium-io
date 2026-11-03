import { ImageResponse } from 'next/og'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

export const runtime = 'nodejs'
export const alt = 'BAM | Beyond A Medium. AI website builder: describe it, build it, ship it.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BLUE = '#4aa8ff'

export default async function OpenGraphImage() {
  const [logo, extraBold, medium] = await Promise.all([
    readFile(join(process.cwd(), 'public/brand/bam-logo.png'), 'base64'),
    // Inter Tight (OFL, assets/fonts/OFL.txt): the site's display face.
    readFile(join(process.cwd(), 'assets/fonts/InterTight-ExtraBold.woff')),
    readFile(join(process.cwd(), 'assets/fonts/InterTight-Medium.woff')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#05070c',
          fontFamily: 'Inter Tight',
          backgroundImage:
            'radial-gradient(900px 520px at 85% 45%, rgba(31,143,255,0.20), transparent), radial-gradient(700px 360px at 0% 110%, rgba(21,112,224,0.16), transparent)',
        }}
      >
        {/* Left: message */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 80px', width: 620 }}>
          <div style={{ display: 'flex', color: BLUE, fontSize: 19, fontWeight: 500, letterSpacing: 6, marginBottom: 26 }}>AI WEBSITE BUILDER</div>
          <div style={{ display: 'flex', flexDirection: 'column', color: 'white', fontSize: 84, fontWeight: 800, lineHeight: 1.0, letterSpacing: -3 }}>
            <span>Describe it.</span>
            <span>Build it.</span>
            <span style={{ color: BLUE }}>Ship it.</span>
          </div>
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.55)', fontSize: 27, fontWeight: 500, lineHeight: 1.4, marginTop: 30, maxWidth: 380 }}>
            The AI operating system for building websites.
          </div>
        </div>

        {/* Right: logo on a soft glow */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', paddingRight: 56 }}>
          <img src={`data:image/png;base64,${logo}`} alt="BAM | Beyond A Medium" width={500} height={211} />
        </div>

        {/* Footer: URL + accent rule */}
        <div style={{ position: 'absolute', left: 80, bottom: 44, display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: 500 }}>
          <div style={{ width: 10, height: 10, borderRadius: 10, background: BLUE }} />
          beyondamedium.io
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, display: 'flex', backgroundImage: 'linear-gradient(90deg, #0a5bd8, #1f8fff, #8ec5ff)' }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter Tight', data: extraBold, weight: 800, style: 'normal' },
        { name: 'Inter Tight', data: medium, weight: 500, style: 'normal' },
      ],
    },
  )
}

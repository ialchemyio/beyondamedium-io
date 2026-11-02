/**
 * Typefaces named in the BEYOND DESIGN briefs, used only by the direction
 * previews so each one is rendered in its real type, not a system fallback.
 * preload: false — they load when a preview is on screen, not on every page.
 */
import { Playfair_Display, JetBrains_Mono, Nunito_Sans, Archivo_Black } from 'next/font/google'

export const playfair = Playfair_Display({
  subsets: ['latin'], weight: ['400', '600', '700'], style: ['normal', 'italic'],
  variable: '--pf-playfair', display: 'swap', preload: false,
})

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'], weight: ['400', '700'],
  variable: '--pf-mono', display: 'swap', preload: false,
})

export const nunito = Nunito_Sans({
  subsets: ['latin'], weight: ['600', '800'],
  variable: '--pf-nunito', display: 'swap', preload: false,
})

export const archivoBlack = Archivo_Black({
  subsets: ['latin'], weight: '400',
  variable: '--pf-archivo', display: 'swap', preload: false,
})

export const previewFontVars = [playfair.variable, jetbrains.variable, nunito.variable, archivoBlack.variable].join(' ')

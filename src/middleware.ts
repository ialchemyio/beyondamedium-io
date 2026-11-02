import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPlatformHost, customDomainRewrite } from '@/lib/custom-domains'
import { resolveCustomDomain } from '@/lib/domain-routing'

export async function middleware(request: NextRequest) {
  // Customer domains: serve that project's published site. BAM app routes and
  // Supabase session handling never run on a tenant domain.
  const host = request.headers.get('host')
  if (!isPlatformHost(host)) {
    const slug = await resolveCustomDomain(host!)
    if (slug) {
      const headers = new Headers(request.headers)
      headers.set('x-bam-custom-domain', host!.toLowerCase())
      const target = customDomainRewrite(slug, request.nextUrl.pathname, request.nextUrl.search)
      if (!target) return NextResponse.next({ request: { headers } })
      return NextResponse.rewrite(new URL(target, request.url), { request: { headers } })
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import type { MetadataRoute } from 'next'

const SITE_URL = 'https://beyondamedium.io'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep the authenticated app, API, and published-site subtrees out of the index.
        disallow: ['/dashboard', '/app', '/api/', '/auth/', '/login', '/p/', '/r/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

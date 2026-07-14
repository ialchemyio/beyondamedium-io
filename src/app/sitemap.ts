import type { MetadataRoute } from 'next'

const SITE_URL = 'https://beyondamedium.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = ['', '/login', '/signup', '/privacy', '/terms', '/cookies', '/refund']
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.6,
  }))
}

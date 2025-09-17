export type SEOHandle = {
	getSitemapEntries?: (
		request: Request,
	) =>
		| Array<{ route: string; priority?: number; changefreq?: string }>
		| null
		| undefined
}

export function generateRobotsTxt(
	entries: Array<{ type: string; value: string }>,
) {
	const lines = entries.map((entry) => {
		if (entry.type === 'sitemap') {
			return `Sitemap: ${entry.value}`
		}
		if (entry.type === 'allow') {
			return `Allow: ${entry.value}`
		}
		if (entry.type === 'disallow') {
			return `Disallow: ${entry.value}`
		}
		if (entry.type === 'userAgent') {
			return `User-agent: ${entry.value}`
		}
		return ''
	})

	const content = lines.join('\n')

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=7200',
		},
	})
}

export function generateSitemap(
	request: Request,
	routes: any,
	options: {
		siteUrl: string
		headers?: Record<string, string>
	},
) {
	const { siteUrl, headers = {} } = options

	// Basic sitemap generation - you can enhance this based on your routes
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/signup</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Content-Length': String(Buffer.byteLength(xml)),
			...headers,
		},
	})
}

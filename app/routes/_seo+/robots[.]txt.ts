import { generateRobotsTxt } from '#app/utils/seo.server.ts'
import { getDomainUrl } from '#app/utils/misc.tsx'
import { type Route } from './+types/robots[.]txt.ts'

export function loader({ request }: Route.LoaderArgs) {
	return generateRobotsTxt([
		{ type: 'sitemap', value: `${getDomainUrl(request)}/sitemap.xml` },
	])
}

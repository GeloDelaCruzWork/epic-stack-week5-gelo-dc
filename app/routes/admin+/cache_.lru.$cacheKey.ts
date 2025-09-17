import { invariantResponse } from '@epic-web/invariant'
import { lruCache } from '#app/utils/cache.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { type Route } from './+types/cache_.lru.$cacheKey.ts'

// Mock functions for non-LiteFS environments
async function getInstanceInfo() {
	return {
		currentInstance: 'local',
		primaryInstance: 'local',
	}
}

async function getAllInstances() {
	return { local: 'local' } as Record<string, string>
}

async function ensureInstance(instance: string) {
	// No-op for non-LiteFS environments
}

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserWithRole(request, 'admin')
	const searchParams = new URL(request.url).searchParams
	const currentInstanceInfo = await getInstanceInfo()
	const allInstances = await getAllInstances()
	const instance =
		searchParams.get('instance') ?? currentInstanceInfo.currentInstance
	await ensureInstance(instance)

	const { cacheKey } = params
	invariantResponse(cacheKey, 'cacheKey is required')
	return {
		instance: {
			hostname: instance,
			region: allInstances[instance],
			isPrimary: currentInstanceInfo.primaryInstance === instance,
		},
		cacheKey,
		value: lruCache.get(cacheKey),
	}
}

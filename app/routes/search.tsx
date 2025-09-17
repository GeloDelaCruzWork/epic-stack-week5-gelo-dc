import { useEffect, useRef } from 'react'
import { useFetcher, type LoaderFunctionArgs } from 'react-router'
import { requireUserId } from '#app/utils/auth.server'
import { Input } from '#app/components/ui/input'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)
	return null
}

export default function SearchPage() {
	const fetcher = useFetcher<{
		results: Array<{
			id: string
			title: string
			type: string
			description: string
		}>
	}>()
	const inputRef = useRef<HTMLInputElement>(null)

	// Use effect to trigger search when form is submitted
	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			// Results are loaded
		}
	}, [fetcher.state, fetcher.data])

	const handleSearch = () => {
		const query = inputRef.current?.value
		if (query?.trim()) {
			fetcher.load(`/api/search?q=${encodeURIComponent(query)}`)
		}
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">Search</h1>

			<div className="mb-8">
				<div className="flex gap-4">
					<Input
						ref={inputRef}
						type="text"
						placeholder="Search for notes or users..."
						className="flex-1"
						data-testid="search-input"
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault()
								handleSearch()
							}
						}}
					/>
					<Button
						type="button"
						onClick={handleSearch}
						data-testid="search-button"
					>
						<Icon name="magnifying-glass" className="mr-2" />
						Search
					</Button>
				</div>
			</div>

			{fetcher.state === 'loading' && (
				<div className="py-4 text-center">Searching...</div>
			)}

			{fetcher.data && (
				<div className="space-y-4" data-testid="search-results">
					{!fetcher.data?.results || fetcher.data.results.length === 0 ? (
						<div className="text-muted-foreground py-8 text-center">
							No results found
						</div>
					) : (
						<>
							<h2 className="mb-4 text-xl font-semibold">
								Search Results ({fetcher.data.results.length})
							</h2>
							{fetcher.data.results.map((result) => (
								<div
									key={`${result.type}-${result.id}`}
									className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
									data-testid="search-result"
								>
									<div className="flex items-start justify-between">
										<div>
											<h3 className="text-lg font-semibold">{result.title}</h3>
											<p className="text-muted-foreground mt-1 text-sm">
												{result.description}
											</p>
										</div>
										<span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">
											{result.type}
										</span>
									</div>
								</div>
							))}
						</>
					)}
				</div>
			)}
		</div>
	)
}

import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { parseWithZod } from '@conform-to/zod'

// Export the schema for testing
export const ProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.max(100, 'Name must be 100 characters or less'),
	description: z
		.string()
		.trim()
		.max(500, 'Description must be 500 characters or less')
		.optional(),
})

describe('Project validation schema', () => {
	describe('name field validation', () => {
		test('accepts valid project name', () => {
			const formData = new FormData()
			formData.append('name', 'My Awesome Project')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.name).toBe('My Awesome Project')
			}
		})

		test('trims whitespace from project name', () => {
			const formData = new FormData()
			formData.append('name', '  Project Name  ')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.name).toBe('Project Name')
			}
		})

		test('rejects empty project name', () => {
			const formData = new FormData()
			formData.append('name', '')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.name).toBeDefined()
				expect(result.error?.name?.[0]).toMatch(/required/i)
			}
		})

		test('rejects whitespace-only project name', () => {
			const formData = new FormData()
			formData.append('name', '   ')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			// After trimming, whitespace becomes empty string which should fail validation
			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.name).toBeDefined()
				expect(result.error?.name?.[0]).toMatch(/required/i)
			}
		})

		test('rejects project name longer than 100 characters', () => {
			const formData = new FormData()
			formData.append('name', 'a'.repeat(101))

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.name).toContain(
					'Name must be 100 characters or less',
				)
			}
		})

		test('accepts project name exactly 100 characters', () => {
			const formData = new FormData()
			formData.append('name', 'a'.repeat(100))

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.name).toHaveLength(100)
			}
		})

		test('rejects missing name field', () => {
			const formData = new FormData()
			// Don't append name field at all

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.name).toBeDefined()
			}
		})
	})

	describe('description field validation', () => {
		test('accepts valid description', () => {
			const formData = new FormData()
			formData.append('name', 'Project Name')
			formData.append('description', 'This is a great project description')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.description).toBe(
					'This is a great project description',
				)
			}
		})

		test('trims whitespace from description', () => {
			const formData = new FormData()
			formData.append('name', 'Project Name')
			formData.append('description', '  Description with spaces  ')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.description).toBe('Description with spaces')
			}
		})

		test('accepts empty description', () => {
			const formData = new FormData()
			formData.append('name', 'Project Name')
			formData.append('description', '')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				// Empty string descriptions may be treated as undefined after trim
				expect(
					result.value.description === '' ||
						result.value.description === undefined,
				).toBe(true)
			}
		})

		test('accepts missing description field', () => {
			const formData = new FormData()
			formData.append('name', 'Project Name')
			// Don't append description

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.description).toBeUndefined()
			}
		})

		test('rejects description longer than 500 characters', () => {
			const formData = new FormData()
			formData.append('name', 'Project Name')
			formData.append('description', 'a'.repeat(501))

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.description).toContain(
					'Description must be 500 characters or less',
				)
			}
		})

		test('accepts description exactly 500 characters', () => {
			const formData = new FormData()
			formData.append('name', 'Project Name')
			formData.append('description', 'a'.repeat(500))

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.description).toHaveLength(500)
			}
		})

		test('converts whitespace-only description to empty string', () => {
			const formData = new FormData()
			formData.append('name', 'Project Name')
			formData.append('description', '   ')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.description).toBe('')
			}
		})
	})

	describe('combined field validation', () => {
		test('accepts valid project with all fields', () => {
			const formData = new FormData()
			formData.append('name', 'Complete Project')
			formData.append('description', 'A comprehensive project description')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value).toEqual({
					name: 'Complete Project',
					description: 'A comprehensive project description',
				})
			}
		})

		test('accepts project with only required fields', () => {
			const formData = new FormData()
			formData.append('name', 'Minimal Project')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value).toEqual({
					name: 'Minimal Project',
					description: undefined,
				})
			}
		})

		test('rejects when only optional fields are provided', () => {
			const formData = new FormData()
			formData.append('description', 'Description without name')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.name).toBeDefined()
				expect(result.error?.description).toBeUndefined()
			}
		})

		test('validates multiple errors simultaneously', () => {
			const formData = new FormData()
			formData.append('name', '') // Empty name
			formData.append('description', 'a'.repeat(501)) // Too long description

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.name).toBeDefined()
				expect(result.error?.name?.[0]).toMatch(/required/i)
				expect(result.error?.description).toBeDefined()
				expect(result.error?.description?.[0]).toMatch(
					/500 characters or less/i,
				)
			}
		})
	})

	describe('edge cases and special characters', () => {
		test('accepts project name with special characters', () => {
			const formData = new FormData()
			formData.append('name', 'Project #1: Testing & Development @ 2024!')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.name).toBe(
					'Project #1: Testing & Development @ 2024!',
				)
			}
		})

		test('accepts project name with unicode characters', () => {
			const formData = new FormData()
			formData.append('name', 'Проект 项目 プロジェクト')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.name).toBe('Проект 项目 プロジェクト')
			}
		})

		test('accepts project name with emoji', () => {
			const formData = new FormData()
			formData.append('name', '🚀 Awesome Project 💡')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.name).toBe('🚀 Awesome Project 💡')
			}
		})

		test('handles multi-line description', () => {
			const formData = new FormData()
			formData.append('name', 'Multi-line Project')
			formData.append('description', 'Line 1\nLine 2\nLine 3')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.description).toBe('Line 1\nLine 2\nLine 3')
			}
		})

		test('handles HTML-like content in fields', () => {
			const formData = new FormData()
			formData.append('name', '<script>alert("test")</script>')
			formData.append('description', '<b>Bold</b> and <i>italic</i>')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				// Schema doesn't sanitize HTML - that should be done at render time
				expect(result.value.name).toBe('<script>alert("test")</script>')
				expect(result.value.description).toBe('<b>Bold</b> and <i>italic</i>')
			}
		})

		test('handles very short valid name', () => {
			const formData = new FormData()
			formData.append('name', 'X')

			const result = parseWithZod(formData, { schema: ProjectSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.name).toBe('X')
			}
		})
	})
})

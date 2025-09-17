import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { parseWithZod } from '@conform-to/zod'
import {
	NoteEditorSchema,
	MAX_UPLOAD_SIZE,
} from '#app/routes/users+/$username_+/__note-editor.tsx'

// Re-create the ImageFieldsetSchema since it's not exported
const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine((file) => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File size must be less than 3MB'),
	altText: z.string().optional(),
})

describe('Note validation schema', () => {
	describe('title field validation', () => {
		test('accepts valid note title', () => {
			const formData = new FormData()
			formData.append('title', 'My Important Note')
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.title).toBe('My Important Note')
			}
		})

		test('rejects empty title', () => {
			const formData = new FormData()
			formData.append('title', '')
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.title).toBeDefined()
			}
		})

		test('rejects title longer than 100 characters', () => {
			const formData = new FormData()
			formData.append('title', 'a'.repeat(101))
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.title).toBeDefined()
			}
		})

		test('accepts title exactly 100 characters', () => {
			const formData = new FormData()
			formData.append('title', 'a'.repeat(100))
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.title).toHaveLength(100)
			}
		})

		test('accepts single character title', () => {
			const formData = new FormData()
			formData.append('title', 'X')
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.title).toBe('X')
			}
		})
	})

	describe('content field validation', () => {
		test('accepts valid note content', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'This is the content of my note.')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.content).toBe('This is the content of my note.')
			}
		})

		test('rejects empty content', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', '')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.content).toBeDefined()
			}
		})

		test('rejects content longer than 10000 characters', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'a'.repeat(10001))

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.content).toBeDefined()
			}
		})

		test('accepts content exactly 10000 characters', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'a'.repeat(10000))

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.content).toHaveLength(10000)
			}
		})

		test('accepts single character content', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'X')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.content).toBe('X')
			}
		})

		test('accepts multi-line content', () => {
			const multilineContent = 'Line 1\nLine 2\n\nLine 4 with more text'
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', multilineContent)

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.content).toBe(multilineContent)
			}
		})
	})

	describe('id field validation', () => {
		test('accepts note with id', () => {
			const formData = new FormData()
			formData.append('id', 'note123')
			formData.append('title', 'Note Title')
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.id).toBe('note123')
			}
		})

		test('accepts note without id', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.id).toBeUndefined()
			}
		})
	})

	describe('images field validation', () => {
		test('accepts note without images', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'Note content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.images).toBeUndefined()
			}
		})

		test('rejects more than 5 images', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'Note content')

			// Add 6 images (exceeds the limit)
			for (let i = 0; i < 6; i++) {
				formData.append(`images[${i}].id`, `image${i}`)
			}

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.images).toBeDefined()
			}
		})

		test('accepts exactly 5 images', () => {
			const formData = new FormData()
			formData.append('title', 'Note Title')
			formData.append('content', 'Note content')

			// Add 5 images (at the limit)
			for (let i = 0; i < 5; i++) {
				formData.append(`images[${i}].id`, `image${i}`)
			}

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.images).toHaveLength(5)
			}
		})
	})

	describe('combined field validation', () => {
		test('accepts valid note with all fields', () => {
			const formData = new FormData()
			formData.append('id', 'note123')
			formData.append('title', 'Complete Note')
			formData.append(
				'content',
				'This is a comprehensive note with all fields.',
			)
			formData.append('images[0].id', 'img1')
			formData.append('images[0].altText', 'First image')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value).toEqual({
					id: 'note123',
					title: 'Complete Note',
					content: 'This is a comprehensive note with all fields.',
					images: [
						{
							id: 'img1',
							altText: 'First image',
							file: undefined,
						},
					],
				})
			}
		})

		test('accepts note with only required fields', () => {
			const formData = new FormData()
			formData.append('title', 'Minimal Note')
			formData.append('content', 'Just the basics')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value).toEqual({
					id: undefined,
					title: 'Minimal Note',
					content: 'Just the basics',
					images: undefined,
				})
			}
		})

		test('validates multiple errors simultaneously', () => {
			const formData = new FormData()
			formData.append('title', '') // Empty title
			formData.append('content', 'a'.repeat(10001)) // Too long content

			// Add too many images
			for (let i = 0; i < 6; i++) {
				formData.append(`images[${i}].id`, `image${i}`)
			}

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.title).toBeDefined()
				expect(result.error?.content).toBeDefined()
				expect(result.error?.images).toBeDefined()
			}
		})

		test('rejects when only optional fields are provided', () => {
			const formData = new FormData()
			formData.append('id', 'note123')
			// Missing required title and content

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('error')
			if (result.status === 'error') {
				expect(result.error?.title).toBeDefined()
				expect(result.error?.content).toBeDefined()
			}
		})
	})

	describe('edge cases and special characters', () => {
		test('accepts note title with special characters', () => {
			const formData = new FormData()
			formData.append('title', 'Note #1: Testing & Development @ 2024!')
			formData.append('content', 'Content')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.title).toBe(
					'Note #1: Testing & Development @ 2024!',
				)
			}
		})

		test('accepts note with unicode characters', () => {
			const formData = new FormData()
			formData.append('title', '笔记 Заметка ノート')
			formData.append(
				'content',
				'Unicode content: 你好世界 Привет мир こんにちは世界',
			)

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.title).toBe('笔记 Заметка ノート')
				expect(result.value.content).toContain('你好世界')
			}
		})

		test('accepts note with emoji', () => {
			const formData = new FormData()
			formData.append('title', '📝 Important Note 🔥')
			formData.append('content', 'Remember to 🚀 launch the project! 💡')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				expect(result.value.title).toBe('📝 Important Note 🔥')
				expect(result.value.content).toContain('🚀')
			}
		})

		test('handles HTML-like content in fields', () => {
			const formData = new FormData()
			formData.append('title', '<script>alert("test")</script>')
			formData.append('content', '<b>Bold</b> and <i>italic</i> text')

			const result = parseWithZod(formData, { schema: NoteEditorSchema })

			expect(result.status).toBe('success')
			if (result.status === 'success') {
				// Schema doesn't sanitize HTML - that should be done at render time
				expect(result.value.title).toBe('<script>alert("test")</script>')
				expect(result.value.content).toBe('<b>Bold</b> and <i>italic</i> text')
			}
		})
	})
})

describe('ImageFieldset validation', () => {
	test('accepts image with id only', () => {
		const formData = new FormData()
		formData.append('id', 'img123')

		const result = parseWithZod(formData, { schema: ImageFieldsetSchema })

		expect(result.status).toBe('success')
		if (result.status === 'success') {
			expect(result.value.id).toBe('img123')
			expect(result.value.file).toBeUndefined()
			expect(result.value.altText).toBeUndefined()
		}
	})

	test('accepts image with altText', () => {
		const formData = new FormData()
		formData.append('altText', 'A beautiful sunset')

		const result = parseWithZod(formData, { schema: ImageFieldsetSchema })

		expect(result.status).toBe('success')
		if (result.status === 'success') {
			expect(result.value.altText).toBe('A beautiful sunset')
		}
	})

	test('accepts image with file under size limit', () => {
		const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
		Object.defineProperty(file, 'size', { value: 1024 * 1024 * 2 }) // 2MB

		const formData = new FormData()
		formData.append('file', file)

		const result = parseWithZod(formData, { schema: ImageFieldsetSchema })

		expect(result.status).toBe('success')
		if (result.status === 'success') {
			expect(result.value.file).toBeDefined()
		}
	})

	test('rejects image file over 3MB size limit', () => {
		const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
		Object.defineProperty(file, 'size', { value: MAX_UPLOAD_SIZE + 1 }) // Over 3MB

		const formData = new FormData()
		formData.append('file', file)

		const result = parseWithZod(formData, { schema: ImageFieldsetSchema })

		expect(result.status).toBe('error')
		if (result.status === 'error') {
			expect(result.error?.file).toBeDefined()
			expect(result.error?.file?.[0]).toMatch(/less than 3MB/i)
		}
	})

	test('accepts image file exactly at 3MB limit', () => {
		const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
		Object.defineProperty(file, 'size', { value: MAX_UPLOAD_SIZE }) // Exactly 3MB

		const formData = new FormData()
		formData.append('file', file)

		const result = parseWithZod(formData, { schema: ImageFieldsetSchema })

		expect(result.status).toBe('success')
		if (result.status === 'success') {
			expect(result.value.file).toBeDefined()
		}
	})

	test('accepts complete image fieldset', () => {
		const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
		Object.defineProperty(file, 'size', { value: 1024 * 100 }) // 100KB

		const formData = new FormData()
		formData.append('id', 'img456')
		formData.append('file', file)
		formData.append('altText', 'Test image description')

		const result = parseWithZod(formData, { schema: ImageFieldsetSchema })

		expect(result.status).toBe('success')
		if (result.status === 'success') {
			expect(result.value.id).toBe('img456')
			expect(result.value.file).toBeDefined()
			expect(result.value.altText).toBe('Test image description')
		}
	})

	test('accepts empty image fieldset', () => {
		const formData = new FormData()

		const result = parseWithZod(formData, { schema: ImageFieldsetSchema })

		expect(result.status).toBe('success')
		if (result.status === 'success') {
			expect(result.value.id).toBeUndefined()
			expect(result.value.file).toBeUndefined()
			expect(result.value.altText).toBeUndefined()
		}
	})
})

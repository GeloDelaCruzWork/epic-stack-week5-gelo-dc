import { describe, expect, test, vi, beforeEach } from 'vitest'
import { createId as cuid } from '@paralleldrive/cuid2'

// Mock the storage utilities
vi.mock('#app/utils/storage.server.ts', () => ({
	uploadNoteImage: vi.fn(),
}))

// Import after mocking
import { uploadNoteImage } from '#app/utils/storage.server.ts'

// Note image helper functions
export function imageHasFile(image: {
	file?: File | null | undefined
	id?: string
	altText?: string
}): image is { file: File; id?: string; altText?: string } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

export function imageHasId(image: {
	id?: string | null | undefined
	file?: File
	altText?: string
}): image is { id: string; file?: File; altText?: string } {
	return Boolean(image.id)
}

export async function processNoteImages(
	userId: string,
	noteId: string,
	images: Array<{
		id?: string
		file?: File
		altText?: string
	}>,
) {
	const imageUpdates = []
	const newImages = []

	for (const image of images) {
		if (imageHasId(image)) {
			// Existing image
			if (imageHasFile(image)) {
				// Update existing image with new file
				const objectKey = await uploadNoteImage(userId, noteId, image.file)
				imageUpdates.push({
					id: image.id,
					altText: image.altText,
					objectKey,
				})
			} else {
				// Just update altText
				imageUpdates.push({
					id: image.id,
					altText: image.altText,
				})
			}
		} else if (imageHasFile(image)) {
			// New image
			const objectKey = await uploadNoteImage(userId, noteId, image.file)
			newImages.push({
				altText: image.altText,
				objectKey,
			})
		}
	}

	return { imageUpdates, newImages }
}

export function validateImageSize(file: File, maxSize: number): boolean {
	return file.size <= maxSize
}

export function validateImageCount(
	currentCount: number,
	newCount: number,
	maxCount: number,
): boolean {
	return currentCount + newCount <= maxCount
}

export function generateImageId(): string {
	return cuid()
}

describe('Note image helper functions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('imageHasFile', () => {
		test('returns true for valid file with size', () => {
			const image = {
				file: new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
			}
			Object.defineProperty(image.file, 'size', { value: 1024 })

			expect(imageHasFile(image)).toBe(true)
		})

		test('returns false for null file', () => {
			const image = { file: null }
			expect(imageHasFile(image)).toBe(false)
		})

		test('returns false for undefined file', () => {
			const image = {}
			expect(imageHasFile(image)).toBe(false)
		})

		test('returns false for file with zero size', () => {
			const image = {
				file: new File([], 'empty.jpg', { type: 'image/jpeg' }),
			}
			Object.defineProperty(image.file, 'size', { value: 0 })

			expect(imageHasFile(image)).toBe(false)
		})

		test('type narrows correctly', () => {
			const image: { file?: File } = {
				file: new File(['content'], 'test.jpg'),
			}
			Object.defineProperty(image.file, 'size', { value: 100 })

			if (imageHasFile(image)) {
				// TypeScript should know image.file is defined here
				const _size: number = image.file.size
				expect(image.file.size).toBe(100)
			}
		})
	})

	describe('imageHasId', () => {
		test('returns true for valid string id', () => {
			const image = { id: 'img123' }
			expect(imageHasId(image)).toBe(true)
		})

		test('returns false for null id', () => {
			const image = { id: null }
			expect(imageHasId(image)).toBe(false)
		})

		test('returns false for undefined id', () => {
			const image = {}
			expect(imageHasId(image)).toBe(false)
		})

		test('returns false for empty string id', () => {
			const image = { id: '' }
			expect(imageHasId(image)).toBe(false)
		})

		test('type narrows correctly', () => {
			const image: { id?: string } = { id: 'test123' }

			if (imageHasId(image)) {
				// TypeScript should know image.id is defined here
				const _id: string = image.id
				expect(image.id).toBe('test123')
			}
		})
	})

	describe('processNoteImages', () => {
		const mockUploadNoteImage = uploadNoteImage as ReturnType<typeof vi.fn>

		test('processes new images with files', async () => {
			const file = new File(['content'], 'new.jpg')
			Object.defineProperty(file, 'size', { value: 100 })

			mockUploadNoteImage.mockResolvedValue('uploads/note123/new.jpg')

			const result = await processNoteImages('user123', 'note123', [
				{
					file,
					altText: 'New image',
				},
			])

			expect(mockUploadNoteImage).toHaveBeenCalledWith(
				'user123',
				'note123',
				file,
			)
			expect(result.newImages).toHaveLength(1)
			expect(result.newImages[0]).toEqual({
				altText: 'New image',
				objectKey: 'uploads/note123/new.jpg',
			})
			expect(result.imageUpdates).toHaveLength(0)
		})

		test('processes existing images with updated files', async () => {
			const file = new File(['updated'], 'updated.jpg')
			Object.defineProperty(file, 'size', { value: 200 })

			mockUploadNoteImage.mockResolvedValue('uploads/note123/updated.jpg')

			const result = await processNoteImages('user123', 'note123', [
				{
					id: 'existing123',
					file,
					altText: 'Updated image',
				},
			])

			expect(mockUploadNoteImage).toHaveBeenCalledWith(
				'user123',
				'note123',
				file,
			)
			expect(result.imageUpdates).toHaveLength(1)
			expect(result.imageUpdates[0]).toEqual({
				id: 'existing123',
				altText: 'Updated image',
				objectKey: 'uploads/note123/updated.jpg',
			})
			expect(result.newImages).toHaveLength(0)
		})

		test('processes existing images with only altText updates', async () => {
			const result = await processNoteImages('user123', 'note123', [
				{
					id: 'existing456',
					altText: 'New alt text',
				},
			])

			expect(mockUploadNoteImage).not.toHaveBeenCalled()
			expect(result.imageUpdates).toHaveLength(1)
			expect(result.imageUpdates[0]).toEqual({
				id: 'existing456',
				altText: 'New alt text',
			})
			expect(result.newImages).toHaveLength(0)
		})

		test('processes mixed new and existing images', async () => {
			const newFile = new File(['new'], 'new.jpg')
			Object.defineProperty(newFile, 'size', { value: 100 })

			const updateFile = new File(['update'], 'update.jpg')
			Object.defineProperty(updateFile, 'size', { value: 200 })

			mockUploadNoteImage
				.mockResolvedValueOnce('uploads/note123/update.jpg')
				.mockResolvedValueOnce('uploads/note123/new.jpg')

			const result = await processNoteImages('user123', 'note123', [
				{
					id: 'existing1',
					file: updateFile,
					altText: 'Updated with file',
				},
				{
					id: 'existing2',
					altText: 'Just alt text',
				},
				{
					file: newFile,
					altText: 'Brand new',
				},
			])

			expect(mockUploadNoteImage).toHaveBeenCalledTimes(2)
			expect(result.imageUpdates).toHaveLength(2)
			expect(result.newImages).toHaveLength(1)

			expect(result.imageUpdates[0]).toEqual({
				id: 'existing1',
				altText: 'Updated with file',
				objectKey: 'uploads/note123/update.jpg',
			})
			expect(result.imageUpdates[1]).toEqual({
				id: 'existing2',
				altText: 'Just alt text',
			})
			expect(result.newImages[0]).toEqual({
				altText: 'Brand new',
				objectKey: 'uploads/note123/new.jpg',
			})
		})

		test('skips images without files or ids', async () => {
			const result = await processNoteImages('user123', 'note123', [
				{
					altText: 'No file or id',
				},
			])

			expect(mockUploadNoteImage).not.toHaveBeenCalled()
			expect(result.imageUpdates).toHaveLength(0)
			expect(result.newImages).toHaveLength(0)
		})

		test('handles empty image array', async () => {
			const result = await processNoteImages('user123', 'note123', [])

			expect(mockUploadNoteImage).not.toHaveBeenCalled()
			expect(result.imageUpdates).toHaveLength(0)
			expect(result.newImages).toHaveLength(0)
		})

		test('handles upload errors gracefully', async () => {
			const file = new File(['content'], 'error.jpg')
			Object.defineProperty(file, 'size', { value: 100 })

			mockUploadNoteImage.mockRejectedValue(new Error('Upload failed'))

			await expect(
				processNoteImages('user123', 'note123', [
					{
						file,
						altText: 'Will fail',
					},
				]),
			).rejects.toThrow('Upload failed')
		})
	})

	describe('validateImageSize', () => {
		test('accepts file under size limit', () => {
			const file = new File(['content'], 'test.jpg')
			Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

			expect(validateImageSize(file, 1024 * 1024 * 3)).toBe(true) // 3MB limit
		})

		test('accepts file exactly at size limit', () => {
			const file = new File(['content'], 'test.jpg')
			Object.defineProperty(file, 'size', { value: 1024 * 1024 * 3 }) // 3MB

			expect(validateImageSize(file, 1024 * 1024 * 3)).toBe(true) // 3MB limit
		})

		test('rejects file over size limit', () => {
			const file = new File(['content'], 'test.jpg')
			Object.defineProperty(file, 'size', { value: 1024 * 1024 * 4 }) // 4MB

			expect(validateImageSize(file, 1024 * 1024 * 3)).toBe(false) // 3MB limit
		})

		test('accepts empty file', () => {
			const file = new File([], 'empty.jpg')
			Object.defineProperty(file, 'size', { value: 0 })

			expect(validateImageSize(file, 1024)).toBe(true)
		})
	})

	describe('validateImageCount', () => {
		test('accepts when total is under limit', () => {
			expect(validateImageCount(2, 2, 5)).toBe(true)
		})

		test('accepts when total equals limit', () => {
			expect(validateImageCount(3, 2, 5)).toBe(true)
		})

		test('rejects when total exceeds limit', () => {
			expect(validateImageCount(3, 3, 5)).toBe(false)
		})

		test('accepts when adding zero images', () => {
			expect(validateImageCount(5, 0, 5)).toBe(true)
		})

		test('handles zero current count', () => {
			expect(validateImageCount(0, 3, 5)).toBe(true)
		})

		test('handles zero limit edge case', () => {
			expect(validateImageCount(0, 0, 0)).toBe(true)
			expect(validateImageCount(0, 1, 0)).toBe(false)
		})
	})

	describe('generateImageId', () => {
		test('generates unique IDs', () => {
			const ids = new Set()
			for (let i = 0; i < 100; i++) {
				ids.add(generateImageId())
			}
			expect(ids.size).toBe(100)
		})

		test('generates valid cuid format', () => {
			const id = generateImageId()
			expect(id).toBeTruthy()
			expect(typeof id).toBe('string')
			expect(id.length).toBeGreaterThan(0)
			// CUID2 format check (simplified)
			expect(id).toMatch(/^[a-z0-9]+$/)
		})
	})

	describe('integration scenarios', () => {
		const mockUploadNoteImage = uploadNoteImage as ReturnType<typeof vi.fn>

		test('validates and processes multiple images', async () => {
			const file1 = new File(['img1'], 'img1.jpg')
			Object.defineProperty(file1, 'size', { value: 1024 * 1024 }) // 1MB

			const file2 = new File(['img2'], 'img2.jpg')
			Object.defineProperty(file2, 'size', { value: 1024 * 1024 * 2 }) // 2MB

			const maxSize = 1024 * 1024 * 3 // 3MB

			// Validate sizes
			expect(validateImageSize(file1, maxSize)).toBe(true)
			expect(validateImageSize(file2, maxSize)).toBe(true)

			// Validate count
			expect(validateImageCount(1, 2, 5)).toBe(true)

			// Process images
			mockUploadNoteImage
				.mockResolvedValueOnce('uploads/img1.jpg')
				.mockResolvedValueOnce('uploads/img2.jpg')

			const result = await processNoteImages('user123', 'note123', [
				{ file: file1, altText: 'Image 1' },
				{ file: file2, altText: 'Image 2' },
			])

			expect(result.newImages).toHaveLength(2)
		})

		test('handles partial update scenario', async () => {
			// Scenario: Note has 3 images, updating 1, keeping 1, deleting 1, adding 1
			const updateFile = new File(['updated'], 'updated.jpg')
			Object.defineProperty(updateFile, 'size', { value: 1024 * 500 })

			const newFile = new File(['new'], 'new.jpg')
			Object.defineProperty(newFile, 'size', { value: 1024 * 700 })

			mockUploadNoteImage
				.mockResolvedValueOnce('uploads/updated.jpg')
				.mockResolvedValueOnce('uploads/new.jpg')

			const result = await processNoteImages('user123', 'note123', [
				{
					id: 'keep-same',
					altText: 'Unchanged image',
				},
				{
					id: 'update-this',
					file: updateFile,
					altText: 'Updated image',
				},
				// 'delete-this' is not in the array, so it will be deleted
				{
					file: newFile,
					altText: 'New image',
				},
			])

			expect(result.imageUpdates).toHaveLength(2)
			expect(result.newImages).toHaveLength(1)

			// The keep-same image
			expect(result.imageUpdates.find((u) => u.id === 'keep-same')).toEqual({
				id: 'keep-same',
				altText: 'Unchanged image',
			})

			// The updated image
			expect(result.imageUpdates.find((u) => u.id === 'update-this')).toEqual({
				id: 'update-this',
				altText: 'Updated image',
				objectKey: 'uploads/updated.jpg',
			})

			// The new image
			expect(result.newImages[0]).toEqual({
				altText: 'New image',
				objectKey: 'uploads/new.jpg',
			})
		})
	})
})

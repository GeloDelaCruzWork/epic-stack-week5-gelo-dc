import { faker } from '@faker-js/faker'
import { describe, expect, test, beforeEach } from 'vitest'
import { prisma } from '#app/utils/db.server.ts'
import { type Note, type NoteImage, type User } from '@prisma/client'

// Helper function to create a test user
async function createTestUser() {
	return prisma.user.create({
		data: {
			email: faker.internet.email(),
			username: faker.internet.username(), // Changed from userName to username
			name: faker.person.fullName(),
		},
	})
}

// Note service functions (these would typically be in a separate file)
export async function createNote(data: {
	title: string
	content: string
	ownerId: string
	images?: Array<{ objectKey: string; altText?: string | null }>
}) {
	return prisma.note.create({
		data: {
			title: data.title,
			content: data.content,
			ownerId: data.ownerId,
			images: data.images
				? {
						create: data.images,
					}
				: undefined,
		},
		include: {
			images: {
				select: {
					id: true,
					objectKey: true,
					altText: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	})
}

export async function getNotes(ownerId: string) {
	return prisma.note.findMany({
		where: { ownerId },
		orderBy: { updatedAt: 'desc' },
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
			updatedAt: true,
			images: {
				select: {
					id: true,
					objectKey: true,
					altText: true,
				},
			},
		},
	})
}

export async function getNoteById(id: string, ownerId: string) {
	return prisma.note.findUnique({
		where: { id, ownerId },
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
			updatedAt: true,
			images: {
				select: {
					id: true,
					objectKey: true,
					altText: true,
					createdAt: true,
					updatedAt: true,
				},
			},
		},
	})
}

export async function updateNote(
	id: string,
	ownerId: string,
	data: {
		title?: string
		content?: string
	},
) {
	return prisma.note.update({
		where: { id, ownerId },
		data,
		include: {
			images: {
				select: {
					id: true,
					objectKey: true,
					altText: true,
				},
			},
		},
	})
}

export async function deleteNote(id: string, ownerId: string) {
	return prisma.note.delete({
		where: { id, ownerId },
	})
}

export async function addImageToNote(
	noteId: string,
	ownerId: string,
	imageData: { objectKey: string; altText?: string | null },
) {
	// Verify note ownership first
	const note = await prisma.note.findUnique({
		where: { id: noteId, ownerId },
	})

	if (!note) {
		throw new Error('Note not found or access denied')
	}

	return prisma.noteImage.create({
		data: {
			...imageData,
			noteId,
		},
	})
}

export async function updateNoteImage(
	imageId: string,
	noteId: string,
	ownerId: string,
	data: { objectKey?: string; altText?: string | null },
) {
	// Verify note ownership first
	const note = await prisma.note.findUnique({
		where: { id: noteId, ownerId },
		include: { images: { where: { id: imageId } } },
	})

	if (!note || note.images.length === 0) {
		throw new Error('Image not found or access denied')
	}

	return prisma.noteImage.update({
		where: { id: imageId },
		data,
	})
}

export async function deleteNoteImage(
	imageId: string,
	noteId: string,
	ownerId: string,
) {
	// Verify note ownership first
	const note = await prisma.note.findUnique({
		where: { id: noteId, ownerId },
		include: { images: { where: { id: imageId } } },
	})

	if (!note || note.images.length === 0) {
		throw new Error('Image not found or access denied')
	}

	return prisma.noteImage.delete({
		where: { id: imageId },
	})
}

describe('Note database operations', () => {
	let testUser: User

	beforeEach(async () => {
		// Clean up any existing test data and create fresh user
		await prisma.noteImage.deleteMany()
		await prisma.note.deleteMany()
		await prisma.user.deleteMany()
		testUser = await createTestUser()
	})

	describe('createNote', () => {
		test('creates note with title and content only', async () => {
			const noteData = {
				title: faker.lorem.sentence(),
				content: faker.lorem.paragraphs(),
				ownerId: testUser.id,
			}

			const note = await createNote(noteData)

			expect(note).toBeDefined()
			expect(note.id).toBeTruthy()
			expect(note.title).toBe(noteData.title)
			expect(note.content).toBe(noteData.content)
			expect(note.ownerId).toBe(testUser.id)
			expect(note.images).toEqual([])
			expect(note.createdAt).toBeInstanceOf(Date)
			expect(note.updatedAt).toBeInstanceOf(Date)
		})

		test('creates note with images', async () => {
			const noteData = {
				title: faker.lorem.sentence(),
				content: faker.lorem.paragraphs(),
				ownerId: testUser.id,
				images: [
					{ objectKey: 'image1.jpg', altText: 'First image' },
					{ objectKey: 'image2.png', altText: 'Second image' },
				],
			}

			const note = await createNote(noteData)

			expect(note.images).toHaveLength(2)
			expect(note.images[0]?.objectKey).toBe('image1.jpg')
			expect(note.images[0]?.altText).toBe('First image')
			expect(note.images[1]?.objectKey).toBe('image2.png')
			expect(note.images[1]?.altText).toBe('Second image')
		})

		test('creates note with image without altText', async () => {
			const noteData = {
				title: faker.lorem.sentence(),
				content: faker.lorem.paragraphs(),
				ownerId: testUser.id,
				images: [{ objectKey: 'image.jpg', altText: null }],
			}

			const note = await createNote(noteData)

			expect(note.images).toHaveLength(1)
			expect(note.images[0]?.altText).toBeNull()
		})

		test('generates unique IDs for each note', async () => {
			const note1 = await createNote({
				title: 'Note 1',
				content: 'Content 1',
				ownerId: testUser.id,
			})
			const note2 = await createNote({
				title: 'Note 2',
				content: 'Content 2',
				ownerId: testUser.id,
			})

			expect(note1.id).not.toBe(note2.id)
		})

		test('sets createdAt and updatedAt to same value on creation', async () => {
			const note = await createNote({
				title: 'Test Note',
				content: 'Test Content',
				ownerId: testUser.id,
			})

			expect(note.createdAt.getTime()).toBe(note.updatedAt.getTime())
		})
	})

	describe('getNotes', () => {
		test('returns empty array when user has no notes', async () => {
			const notes = await getNotes(testUser.id)

			expect(notes).toEqual([])
		})

		test('returns all notes for a user', async () => {
			const note1 = await createNote({
				title: 'Note 1',
				content: 'Content 1',
				ownerId: testUser.id,
			})
			const note2 = await createNote({
				title: 'Note 2',
				content: 'Content 2',
				ownerId: testUser.id,
			})
			const note3 = await createNote({
				title: 'Note 3',
				content: 'Content 3',
				ownerId: testUser.id,
			})

			const notes = await getNotes(testUser.id)

			expect(notes).toHaveLength(3)
			expect(notes.map((n) => n.id)).toContain(note1.id)
			expect(notes.map((n) => n.id)).toContain(note2.id)
			expect(notes.map((n) => n.id)).toContain(note3.id)
		})

		test('does not return notes from other users', async () => {
			const otherUser = await createTestUser()

			await createNote({
				title: 'My Note',
				content: 'My Content',
				ownerId: testUser.id,
			})
			await createNote({
				title: 'Other Note',
				content: 'Other Content',
				ownerId: otherUser.id,
			})

			const notes = await getNotes(testUser.id)

			expect(notes).toHaveLength(1)
			expect(notes[0]?.title).toBe('My Note')
		})

		test('returns notes in descending order by updatedAt', async () => {
			// Create notes with specific timestamps
			const oldNote = await prisma.note.create({
				data: {
					title: 'Old Note',
					content: 'Old Content',
					ownerId: testUser.id,
					updatedAt: new Date('2024-01-01'),
				},
			})
			const newNote = await prisma.note.create({
				data: {
					title: 'New Note',
					content: 'New Content',
					ownerId: testUser.id,
					updatedAt: new Date('2024-01-10'),
				},
			})
			const middleNote = await prisma.note.create({
				data: {
					title: 'Middle Note',
					content: 'Middle Content',
					ownerId: testUser.id,
					updatedAt: new Date('2024-01-05'),
				},
			})

			const notes = await getNotes(testUser.id)

			expect(notes[0]?.id).toBe(newNote.id)
			expect(notes[1]?.id).toBe(middleNote.id)
			expect(notes[2]?.id).toBe(oldNote.id)
		})

		test('includes images with notes', async () => {
			await createNote({
				title: 'Note with Images',
				content: 'Content',
				ownerId: testUser.id,
				images: [
					{ objectKey: 'img1.jpg', altText: 'Image 1' },
					{ objectKey: 'img2.jpg', altText: 'Image 2' },
				],
			})

			const notes = await getNotes(testUser.id)

			expect(notes[0]?.images).toHaveLength(2)
			expect(notes[0]?.images[0]?.objectKey).toBe('img1.jpg')
			expect(notes[0]?.images[1]?.objectKey).toBe('img2.jpg')
		})
	})

	describe('getNoteById', () => {
		test('returns note when it exists and user owns it', async () => {
			const created = await createNote({
				title: 'Test Note',
				content: 'Test Content',
				ownerId: testUser.id,
				images: [{ objectKey: 'test.jpg', altText: 'Test' }],
			})

			const note = await getNoteById(created.id, testUser.id)

			expect(note).toBeDefined()
			expect(note?.id).toBe(created.id)
			expect(note?.title).toBe(created.title)
			expect(note?.content).toBe(created.content)
			expect(note?.images).toHaveLength(1)
		})

		test('returns null when note does not exist', async () => {
			const fakeId = faker.string.uuid()
			const note = await getNoteById(fakeId, testUser.id)

			expect(note).toBeNull()
		})

		test('returns null when user does not own the note', async () => {
			const otherUser = await createTestUser()
			const note = await createNote({
				title: 'Other User Note',
				content: 'Content',
				ownerId: otherUser.id,
			})

			const result = await getNoteById(note.id, testUser.id)

			expect(result).toBeNull()
		})
	})

	describe('updateNote', () => {
		test('updates note title only', async () => {
			const note = await createNote({
				title: 'Original Title',
				content: 'Original Content',
				ownerId: testUser.id,
			})

			const updated = await updateNote(note.id, testUser.id, {
				title: 'Updated Title',
			})

			expect(updated.title).toBe('Updated Title')
			expect(updated.content).toBe('Original Content')
			expect(updated.updatedAt.getTime()).toBeGreaterThan(
				note.updatedAt.getTime(),
			)
		})

		test('updates note content only', async () => {
			const note = await createNote({
				title: 'Original Title',
				content: 'Original Content',
				ownerId: testUser.id,
			})

			const updated = await updateNote(note.id, testUser.id, {
				content: 'Updated Content',
			})

			expect(updated.title).toBe('Original Title')
			expect(updated.content).toBe('Updated Content')
		})

		test('updates both title and content', async () => {
			const note = await createNote({
				title: 'Original Title',
				content: 'Original Content',
				ownerId: testUser.id,
			})

			const updated = await updateNote(note.id, testUser.id, {
				title: 'New Title',
				content: 'New Content',
			})

			expect(updated.title).toBe('New Title')
			expect(updated.content).toBe('New Content')
		})

		test('preserves images when updating note', async () => {
			const note = await createNote({
				title: 'Note with Images',
				content: 'Content',
				ownerId: testUser.id,
				images: [
					{ objectKey: 'img1.jpg', altText: 'Image 1' },
					{ objectKey: 'img2.jpg', altText: 'Image 2' },
				],
			})

			const updated = await updateNote(note.id, testUser.id, {
				title: 'Updated Title',
			})

			expect(updated.images).toHaveLength(2)
			expect(updated.images[0]?.objectKey).toBe('img1.jpg')
			expect(updated.images[1]?.objectKey).toBe('img2.jpg')
		})

		test('throws error when updating non-existent note', async () => {
			const fakeId = faker.string.uuid()

			await expect(
				updateNote(fakeId, testUser.id, { title: 'New Title' }),
			).rejects.toThrow()
		})

		test('throws error when user does not own the note', async () => {
			const otherUser = await createTestUser()
			const note = await createNote({
				title: 'Other User Note',
				content: 'Content',
				ownerId: otherUser.id,
			})

			await expect(
				updateNote(note.id, testUser.id, { title: 'New Title' }),
			).rejects.toThrow()
		})
	})

	describe('deleteNote', () => {
		test('deletes existing note owned by user', async () => {
			const note = await createNote({
				title: 'To Be Deleted',
				content: 'Content',
				ownerId: testUser.id,
			})

			await deleteNote(note.id, testUser.id)

			const found = await getNoteById(note.id, testUser.id)
			expect(found).toBeNull()
		})

		test('deletes note with images (cascade)', async () => {
			const note = await createNote({
				title: 'Note with Images',
				content: 'Content',
				ownerId: testUser.id,
				images: [
					{ objectKey: 'img1.jpg', altText: 'Image 1' },
					{ objectKey: 'img2.jpg', altText: 'Image 2' },
				],
			})

			await deleteNote(note.id, testUser.id)

			const found = await getNoteById(note.id, testUser.id)
			expect(found).toBeNull()

			// Verify images are also deleted
			const images = await prisma.noteImage.findMany({
				where: { noteId: note.id },
			})
			expect(images).toHaveLength(0)
		})

		test('returns deleted note data', async () => {
			const note = await createNote({
				title: 'To Be Deleted',
				content: 'Will be gone',
				ownerId: testUser.id,
			})

			const deleted = await deleteNote(note.id, testUser.id)

			expect(deleted.id).toBe(note.id)
			expect(deleted.title).toBe(note.title)
			expect(deleted.content).toBe(note.content)
		})

		test('throws error when deleting non-existent note', async () => {
			const fakeId = faker.string.uuid()

			await expect(deleteNote(fakeId, testUser.id)).rejects.toThrow()
		})

		test('throws error when user does not own the note', async () => {
			const otherUser = await createTestUser()
			const note = await createNote({
				title: 'Other User Note',
				content: 'Content',
				ownerId: otherUser.id,
			})

			await expect(deleteNote(note.id, testUser.id)).rejects.toThrow()
		})
	})

	describe('image operations', () => {
		describe('addImageToNote', () => {
			test('adds image to existing note', async () => {
				const note = await createNote({
					title: 'Note',
					content: 'Content',
					ownerId: testUser.id,
				})

				const image = await addImageToNote(note.id, testUser.id, {
					objectKey: 'new-image.jpg',
					altText: 'New Image',
				})

				expect(image.noteId).toBe(note.id)
				expect(image.objectKey).toBe('new-image.jpg')
				expect(image.altText).toBe('New Image')
			})

			test('adds image without altText', async () => {
				const note = await createNote({
					title: 'Note',
					content: 'Content',
					ownerId: testUser.id,
				})

				const image = await addImageToNote(note.id, testUser.id, {
					objectKey: 'image.jpg',
					altText: null,
				})

				expect(image.altText).toBeNull()
			})

			test('throws error when note does not exist', async () => {
				const fakeId = faker.string.uuid()

				await expect(
					addImageToNote(fakeId, testUser.id, {
						objectKey: 'image.jpg',
						altText: 'Image',
					}),
				).rejects.toThrow('Note not found or access denied')
			})

			test('throws error when user does not own the note', async () => {
				const otherUser = await createTestUser()
				const note = await createNote({
					title: 'Other User Note',
					content: 'Content',
					ownerId: otherUser.id,
				})

				await expect(
					addImageToNote(note.id, testUser.id, {
						objectKey: 'image.jpg',
						altText: 'Image',
					}),
				).rejects.toThrow('Note not found or access denied')
			})
		})

		describe('updateNoteImage', () => {
			test('updates image objectKey', async () => {
				const note = await createNote({
					title: 'Note',
					content: 'Content',
					ownerId: testUser.id,
					images: [{ objectKey: 'old.jpg', altText: 'Old Image' }],
				})

				const updated = await updateNoteImage(
					note.images[0]!.id,
					note.id,
					testUser.id,
					{ objectKey: 'new.jpg' },
				)

				expect(updated.objectKey).toBe('new.jpg')
				expect(updated.altText).toBe('Old Image')
			})

			test('updates image altText', async () => {
				const note = await createNote({
					title: 'Note',
					content: 'Content',
					ownerId: testUser.id,
					images: [{ objectKey: 'image.jpg', altText: 'Old Text' }],
				})

				const updated = await updateNoteImage(
					note.images[0]!.id,
					note.id,
					testUser.id,
					{ altText: 'New Text' },
				)

				expect(updated.objectKey).toBe('image.jpg')
				expect(updated.altText).toBe('New Text')
			})

			test('throws error when image does not exist', async () => {
				const note = await createNote({
					title: 'Note',
					content: 'Content',
					ownerId: testUser.id,
				})

				const fakeImageId = faker.string.uuid()

				await expect(
					updateNoteImage(fakeImageId, note.id, testUser.id, {
						altText: 'New Text',
					}),
				).rejects.toThrow('Image not found or access denied')
			})

			test('throws error when user does not own the note', async () => {
				const otherUser = await createTestUser()
				const note = await createNote({
					title: 'Other User Note',
					content: 'Content',
					ownerId: otherUser.id,
					images: [{ objectKey: 'image.jpg', altText: 'Image' }],
				})

				await expect(
					updateNoteImage(note.images[0]!.id, note.id, testUser.id, {
						altText: 'New Text',
					}),
				).rejects.toThrow('Image not found or access denied')
			})
		})

		describe('deleteNoteImage', () => {
			test('deletes image from note', async () => {
				const note = await createNote({
					title: 'Note',
					content: 'Content',
					ownerId: testUser.id,
					images: [
						{ objectKey: 'img1.jpg', altText: 'Image 1' },
						{ objectKey: 'img2.jpg', altText: 'Image 2' },
					],
				})

				await deleteNoteImage(note.images[0]!.id, note.id, testUser.id)

				const updatedNote = await getNoteById(note.id, testUser.id)
				expect(updatedNote?.images).toHaveLength(1)
				expect(updatedNote?.images[0]?.objectKey).toBe('img2.jpg')
			})

			test('throws error when image does not exist', async () => {
				const note = await createNote({
					title: 'Note',
					content: 'Content',
					ownerId: testUser.id,
				})

				const fakeImageId = faker.string.uuid()

				await expect(
					deleteNoteImage(fakeImageId, note.id, testUser.id),
				).rejects.toThrow('Image not found or access denied')
			})

			test('throws error when user does not own the note', async () => {
				const otherUser = await createTestUser()
				const note = await createNote({
					title: 'Other User Note',
					content: 'Content',
					ownerId: otherUser.id,
					images: [{ objectKey: 'image.jpg', altText: 'Image' }],
				})

				await expect(
					deleteNoteImage(note.images[0]!.id, note.id, testUser.id),
				).rejects.toThrow('Image not found or access denied')
			})
		})
	})

	describe('concurrent operations', () => {
		test('handles concurrent note creation', async () => {
			const notePromises = Array.from({ length: 10 }, (_, i) =>
				createNote({
					title: `Note ${i}`,
					content: `Content ${i}`,
					ownerId: testUser.id,
				}),
			)

			const notes = await Promise.all(notePromises)
			const noteIds = notes.map((n) => n.id)
			const uniqueIds = new Set(noteIds)

			expect(uniqueIds.size).toBe(10)
			expect(notes.every((n) => n.title.startsWith('Note'))).toBe(true)
		})

		test('handles concurrent updates to different notes', async () => {
			const note1 = await createNote({
				title: 'Note 1',
				content: 'Content 1',
				ownerId: testUser.id,
			})
			const note2 = await createNote({
				title: 'Note 2',
				content: 'Content 2',
				ownerId: testUser.id,
			})

			const [updated1, updated2] = await Promise.all([
				updateNote(note1.id, testUser.id, { title: 'Updated 1' }),
				updateNote(note2.id, testUser.id, { title: 'Updated 2' }),
			])

			expect(updated1.title).toBe('Updated 1')
			expect(updated2.title).toBe('Updated 2')
		})
	})

	describe('data integrity', () => {
		test('preserves special characters in note content', async () => {
			const specialContent =
				'Note & Co. <tag> "quoted" \'apostrophe\' @2024\nLine 2'
			const note = await createNote({
				title: 'Special Note',
				content: specialContent,
				ownerId: testUser.id,
			})

			expect(note.content).toBe(specialContent)
		})

		test('preserves unicode characters', async () => {
			const unicodeTitle = '笔记 заметка ノート 📝'
			const unicodeContent = '你好世界 Привет мир こんにちは世界'
			const note = await createNote({
				title: unicodeTitle,
				content: unicodeContent,
				ownerId: testUser.id,
			})

			expect(note.title).toBe(unicodeTitle)
			expect(note.content).toBe(unicodeContent)
		})

		test('handles maximum length values', async () => {
			const maxTitle = 'a'.repeat(100)
			const maxContent = 'b'.repeat(10000)

			const note = await createNote({
				title: maxTitle,
				content: maxContent,
				ownerId: testUser.id,
			})

			expect(note.title).toBe(maxTitle)
			expect(note.content).toBe(maxContent)
		})

		test('handles minimum length values', async () => {
			const note = await createNote({
				title: 'X',
				content: 'Y',
				ownerId: testUser.id,
			})

			expect(note.title).toBe('X')
			expect(note.content).toBe('Y')
		})
	})
})

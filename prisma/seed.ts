import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	createPassword,
	createUser,
	getNoteImages,
	getUserImages,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'
import { seedEmployees } from './seed_employees';

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

    await seedEmployees();

	console.time('🔐 Created permissions...')
	const entities = ['user', 'note']
	const actions = ['create', 'read', 'update', 'delete']
	const accesses = ['own', 'any'] as const

	for (const entity of entities) {
		for (const action of actions) {
			for (const access of accesses) {
				await prisma.permission.upsert({
					where: {
						action_entity_access: { action, entity, access },
					},
					create: { entity, action, access },
					update: {},
				})
			}
		}
	}
	console.timeEnd('🔐 Created permissions...')

	console.time('👑 Created roles...')
	await prisma.role.upsert({
		where: { name: 'admin' },
		update: {},
		create: {
			name: 'admin',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'any' },
				}),
			},
		},
	})

	await prisma.role.upsert({
		where: { name: 'user' },
		update: {},
		create: {
			name: 'user',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'own' },
				}),
			},
		},
	})
	console.timeEnd('👑 Created roles...')

	const totalUsers = 5
	console.time(`👤 Created ${totalUsers} users...`)
	const noteImages = await getNoteImages()
	const userImages = await getUserImages()

	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		const user = await prisma.user.upsert({
			select: { id: true },
			where: { email: userData.email },
			update: {},
			create: {
				...userData,
				password: { create: await createPassword(userData.username) },
				roles: { connect: { name: 'user' } },
			},
		})

		// Upload user profile image
		const userImage = userImages[index % userImages.length]
		if (userImage) {
			await prisma.userImage.create({
				data: {
					userId: user.id,
					objectKey: userImage.objectKey,
				},
			})
		}

		// Create notes with images
		const notesCount = faker.number.int({ min: 1, max: 3 })
		for (let noteIndex = 0; noteIndex < notesCount; noteIndex++) {
			const note = await prisma.note.create({
				select: { id: true },
				data: {
					title: faker.lorem.sentence(),
					content: faker.lorem.paragraphs(),
					ownerId: user.id,
				},
			})

			// Add images to note
			const noteImageCount = faker.number.int({ min: 1, max: 3 })
			for (let imageIndex = 0; imageIndex < noteImageCount; imageIndex++) {
				const imgNumber = faker.number.int({ min: 0, max: 9 })
				const noteImage = noteImages[imgNumber]
				if (noteImage) {
					await prisma.noteImage.create({
						data: {
							noteId: note.id,
							altText: noteImage.altText,
							objectKey: noteImage.objectKey,
						},
					})
				}
			}
		}
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(`🐨 Created admin user "kody"`)

	const kodyImages = {
		kodyUser: { objectKey: 'user/kody.png' },
		cuteKoala: {
			altText: 'an adorable koala cartoon illustration',
			objectKey: 'kody-notes/cute-koala.png',
		},
		koalaEating: {
			altText: 'a cartoon illustration of a koala in a tree eating',
			objectKey: 'kody-notes/koala-eating.png',
		},
		koalaCuddle: {
			altText: 'a cartoon illustration of koalas cuddling',
			objectKey: 'kody-notes/koala-cuddle.png',
		},
		mountain: {
			altText: 'a beautiful mountain covered in snow',
			objectKey: 'kody-notes/mountain.png',
		},
		koalaCoder: {
			altText: 'a koala coding at the computer',
			objectKey: 'kody-notes/koala-coder.png',
		},
		koalaMentor: {
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			objectKey: 'kody-notes/koala-mentor.png',
		},
		koalaSoccer: {
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			objectKey: 'kody-notes/koala-soccer.png',
		},
	}

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	const kody = await prisma.user.upsert({
		select: { id: true },
		where: { email: 'kody@kcd.dev' },
		update: {
			name: 'Kody',
			roles: {
				set: [],
				connect: [{ name: 'admin' }, { name: 'user' }],
			},
		},
		create: {
			email: 'kody@kcd.dev',
			username: 'kody',
			name: 'Kody',
			password: { create: await createPassword('kodylovesyou') },
			connections: {
				create: {
					providerName: 'github',
					providerId: String(githubUser.profile.id),
				},
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
		},
	})

	// Delete existing user images for Kody and create new one
	await prisma.userImage.deleteMany({
		where: { userId: kody.id },
	})

	await prisma.userImage.create({
		data: {
			userId: kody.id,
			objectKey: kodyImages.kodyUser.objectKey,
		},
	})

	// Create Kody's notes
	const kodyNotes = [
		{
			id: 'd27a197e',
			title: 'Basic Koala Facts',
			content:
				'Koalas are found in the eucalyptus forests of eastern Australia. They have grey fur with a cream-coloured chest, and strong, clawed feet, perfect for living in the branches of trees!',
			images: [kodyImages.cuteKoala, kodyImages.koalaEating],
		},
		{
			id: '414f0c09',
			title: 'Koalas like to cuddle',
			content:
				'Cuddly critters, koalas measure about 60cm to 85cm long, and weigh about 14kg.',
			images: [kodyImages.koalaCuddle],
		},
		{
			id: '260366b1',
			title: 'Not bears',
			content:
				"Although you may have heard people call them koala 'bears', these awesome animals aren't bears at all – they are in fact marsupials. A group of mammals, most marsupials have pouches where their newborns develop.",
			images: [],
		},
		{
			id: 'bb79cf45',
			title: 'Snowboarding Adventure',
			content:
				"Today was an epic day on the slopes! Shredded fresh powder with my friends, caught some sick air, and even attempted a backflip. Can't wait for the next snowy adventure!",
			images: [kodyImages.mountain],
		},
		{
			id: '9f4308be',
			title: 'Onewheel Tricks',
			content:
				"Mastered a new trick on my Onewheel today called '180 Spin'. It's exhilarating to carve through the streets while pulling off these rad moves. Time to level up and learn more!",
			images: [],
		},
		{
			id: '306021fb',
			title: 'Coding Dilemma',
			content:
				"Stuck on a bug in my latest coding project. Need to figure out why my function isn't returning the expected output. Time to dig deep, debug, and conquer this challenge!",
			images: [kodyImages.koalaCoder],
		},
		{
			id: '16d4912a',
			title: 'Coding Mentorship',
			content:
				"Had a fantastic coding mentoring session today with Sarah. Helped her understand the concept of recursion, and she made great progress. It's incredibly fulfilling to help others improve their coding skills.",
			images: [kodyImages.koalaMentor],
		},
		{
			id: '3199199e',
			title: 'Koala Fun Facts',
			content:
				"Did you know that koalas sleep for up to 20 hours a day? It's because their diet of eucalyptus leaves doesn't provide much energy. But when I'm awake, I enjoy munching on leaves, chilling in trees, and being the cuddliest koala around!",
			images: [],
		},
		{
			id: '2030ffd3',
			title: 'Skiing Adventure',
			content:
				'Spent the day hitting the slopes on my skis. The fresh powder made for some incredible runs and breathtaking views. Skiing down the mountain at top speed is an adrenaline rush like no other!',
			images: [kodyImages.mountain],
		},
		{
			id: 'f375a804',
			title: 'Code Jam Success',
			content:
				'Participated in a coding competition today and secured the first place! The adrenaline, the challenging problems, and the satisfaction of finding optimal solutions—it was an amazing experience. Feeling proud and motivated to keep pushing my coding skills further!',
			images: [kodyImages.koalaCoder],
		},
		{
			id: '562c541b',
			title: 'Koala Conservation Efforts',
			content:
				"Joined a local conservation group to protect koalas and their habitats. Together, we're planting more eucalyptus trees, raising awareness about their endangered status, and working towards a sustainable future for these adorable creatures. Every small step counts!",
			images: [],
		},
		{
			id: 'f67ca40b',
			title: 'Game day',
			content:
				"Just got back from the most amazing game. I've been playing soccer for a long time, but I've not once scored a goal. Well, today all that changed! I finally scored my first ever goal.\n\nI'm in an indoor league, and my team's not the best, but we're pretty good and I have fun, that's all that really matters. Anyway, I found myself at the other end of the field with the ball. It was just me and the goalie. I normally just kick the ball and hope it goes in, but the ball was already rolling toward the goal. The goalie was about to get the ball, so I had to charge. I managed to get possession of the ball just before the goalie got it. I brought it around the goalie and had a perfect shot. I screamed so loud in excitement. After all these years playing, I finally scored a goal!\n\nI know it's not a lot for most folks, but it meant a lot to me. We did end up winning the game by one. It makes me feel great that I had a part to play in that.\n\nIn this team, I'm the captain. I'm constantly cheering my team on. Even after getting injured, I continued to come and watch from the side-lines. I enjoy yelling (encouragingly) at my team mates and helping them be the best they can. I'm definitely not the best player by a long stretch. But I really enjoy the game. It's a great way to get exercise and have good social interactions once a week.\n\nThat said, it can be hard to keep people coming and paying dues and stuff. If people don't show up it can be really hard to find subs. I have a list of people I can text, but sometimes I can't find anyone.\n\nBut yeah, today was awesome. I felt like more than just a player that gets in the way of the opposition, but an actual asset to the team. Really great feeling.\n\nAnyway, I'm rambling at this point and really this is just so we can have a note that's pretty long to test things out. I think it's long enough now... Cheers!",
			images: [kodyImages.koalaSoccer],
		},
	]

	for (const noteData of kodyNotes) {
		// Delete existing note images first if note exists
		await prisma.noteImage.deleteMany({
			where: { noteId: noteData.id },
		})

		const note = await prisma.note.upsert({
			select: { id: true },
			where: { id: noteData.id },
			update: {
				title: noteData.title,
				content: noteData.content,
			},
			create: {
				id: noteData.id,
				title: noteData.title,
				content: noteData.content,
				ownerId: kody.id,
			},
		})

		for (const image of noteData.images) {
			await prisma.noteImage.create({
				data: {
					noteId: note.id,
					altText: image.altText,
					objectKey: image.objectKey,
				},
			})
		}
	}

	console.timeEnd(`🐨 Created admin user "kody"`)

	console.time(`📊 Created timesheet records and DTRs`)

	// Helper function to generate DTR dates for a pay period
	function getPayPeriodDates(payPeriod: string): Date[] {
		const dates: Date[] = []
		const year = new Date().getFullYear()

		if (payPeriod === 'January 1 to 15') {
			for (let day = 1; day <= 15; day++) {
				// Skip weekends (simplified - just skip day 6, 7, 13, 14)
				if (![6, 7, 13, 14].includes(day)) {
					dates.push(new Date(year, 0, day))
				}
			}
		} else if (payPeriod === 'January 16 to 31') {
			for (let day = 16; day <= 31; day++) {
				// Skip weekends (simplified - just skip day 20, 21, 27, 28)
				if (![20, 21, 27, 28].includes(day)) {
					dates.push(new Date(year, 0, day))
				}
			}
		}

		return dates
	}

	const timesheetData = [
		{
			employeeName: 'Dela Cruz, Juan',
			payPeriod: 'January 1 to 15',
			detachment: 'Diliman',
			shift: 'Day Shift',
			hasOvertime: true,
			nightDiff: false,
		},
		{
			employeeName: 'Santos, Maria',
			payPeriod: 'January 1 to 15',
			detachment: 'Makati',
			shift: 'Night Shift',
			hasOvertime: true,
			nightDiff: true,
		},
		{
			employeeName: 'Reyes, Pedro',
			payPeriod: 'January 1 to 15',
			detachment: 'Diliman',
			shift: 'Day Shift',
			hasOvertime: false,
			nightDiff: false,
		},
		{
			employeeName: 'Garcia, Ana',
			payPeriod: 'January 1 to 15',
			detachment: 'Quezon City',
			shift: 'Mid Shift',
			hasOvertime: true,
			nightDiff: true,
		},
		{
			employeeName: 'Bautista, Carlos',
			payPeriod: 'January 16 to 31',
			detachment: 'Diliman',
			shift: 'Day Shift',
			hasOvertime: true,
			nightDiff: false,
		},
		{
			employeeName: 'Lopez, Elena',
			payPeriod: 'January 16 to 31',
			detachment: 'Pasig',
			shift: 'Night Shift',
			hasOvertime: true,
			nightDiff: true,
		},
	]

	for (const data of timesheetData) {
		const dates = getPayPeriodDates(data.payPeriod)
		const dtrs = []
		let totalRegular = 0
		let totalOvertime = 0
		let totalNightDiff = 0

		// Create DTR records for each working day
		for (const date of dates) {
			const regularHours = 8
			// Add overtime for some days if employee has overtime
			const overtimeHours = data.hasOvertime && Math.random() > 0.7 ? 4 : 0
			// Add night differential if night shift
			const nightDifferential = data.nightDiff ? regularHours * 0.1 : 0

			totalRegular += regularHours
			totalOvertime += overtimeHours
			totalNightDiff += nightDifferential

			// Generate time-in and time-out based on shift
			let timeInHour = 6 // Default for day shift
			let timeOutHour = 18 // 6 PM for day shift (with regular 8 hours + overtime)

			if (data.shift === 'Night Shift') {
				timeInHour = 22 // 10 PM
				timeOutHour = 6 // 6 AM next day
			} else if (data.shift === 'Mid Shift') {
				timeInHour = 14 // 2 PM
				timeOutHour = 22 // 10 PM
			}

			// Add random seconds for variation
			const timeInMinutes = Math.floor(Math.random() * 5) - 2 // -2 to +2 minutes
			const timeInSeconds = Math.floor(Math.random() * 60)
			const timeOutMinutes = Math.floor(Math.random() * 5) - 2 // -2 to +2 minutes
			const timeOutSeconds = Math.floor(Math.random() * 60)

			// Create time-in timestamp
			const timeIn = new Date(date)
			timeIn.setHours(timeInHour, timeInMinutes, timeInSeconds)

			// Create time-out timestamp
			const timeOut = new Date(date)
			if (data.shift === 'Night Shift' && timeOutHour < timeInHour) {
				// Night shift ends next day
				timeOut.setDate(timeOut.getDate() + 1)
			}
			timeOut.setHours(
				timeOutHour + (overtimeHours > 0 ? 4 : 0),
				timeOutMinutes,
				timeOutSeconds,
			)

			// Create timelogs with clock events for this DTR
			const timelogs = [
				{
					mode: 'in',
					timestamp: timeIn,
					clockEvents: {
						create: [
							{
								clockTime: timeIn, // Clock event has same time as timelog
							},
						],
					},
				},
				{
					mode: 'out',
					timestamp: timeOut,
					clockEvents: {
						create: [
							{
								clockTime: timeOut, // Clock event has same time as timelog
							},
						],
					},
				},
			]

			dtrs.push({
				date,
				regularHours,
				overtimeHours,
				nightDifferential,
				timelogs: {
					create: timelogs,
				},
			})
		}

		// Create timesheet with calculated totals and related DTRs
		await prisma.timesheet.create({
			data: {
				employeeName: data.employeeName,
				payPeriod: data.payPeriod,
				detachment: data.detachment,
				shift: data.shift,
				regularHours: totalRegular,
				overtimeHours: totalOvertime,
				nightDifferential: totalNightDiff,
				dtrs: {
					create: dtrs,
				},
			},
		})
	}
	console.timeEnd(`📊 Created timesheet records and DTRs`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// we're ok to import from the test directory in this file
/*
eslint
	no-restricted-imports: "off",
*/

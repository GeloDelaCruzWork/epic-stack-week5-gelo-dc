const Mocha = require('mocha')
const path = require('path')

// Create a Mocha instance
const mocha = new Mocha({
	timeout: 60000,
	reporter: 'spec',
	bail: false,
})

// Add test files
mocha.addFile(path.join(__dirname, 'dist/specs/notes.test.js'))

// Run the tests
mocha.run((failures) => {
	process.exitCode = failures ? 1 : 0
})

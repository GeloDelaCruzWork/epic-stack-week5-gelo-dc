const { Builder, By } = require('selenium-webdriver')
const fs = require('fs')
const path = require('path')

async function visualRegressionTest() {
	console.log('🚀 Exercise 7: Visual Testing')
	console.log('==============================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		// Navigate to page
		console.log('📍 Navigating to homepage...')
		await driver.get('http://localhost:3000/')

		// Wait for page to stabilize
		await driver.sleep(2000)
		console.log('  ✅ Page loaded')

		// Hide dynamic content
		console.log('\n🎨 Preparing page for visual testing...')
		await driver.executeScript(`
      // Hide timestamps
      document.querySelectorAll('.timestamp, .date, time, [datetime]').forEach(el => {
        el.style.visibility = 'hidden';
      });
      
      // Hide user avatars (may vary)
      document.querySelectorAll('.avatar, img[alt*="avatar"], img[alt*="user"]').forEach(el => {
        el.style.visibility = 'hidden';
      });
      
      // Disable animations
      const style = document.createElement('style');
      style.textContent = '* { animation: none !important; transition: none !important; }';
      document.head.appendChild(style);
      
      // Hide any dynamic IDs or timestamps in text
      document.querySelectorAll('*').forEach(el => {
        if (el.textContent && el.textContent.match(/\\d{4}-\\d{2}-\\d{2}/)) {
          el.style.visibility = 'hidden';
        }
      });
    `)
		console.log('  ✅ Dynamic content hidden')
		console.log('  ✅ Animations disabled')

		// Set consistent viewport
		await driver.manage().window().setRect({ width: 1920, height: 1080 })
		console.log('  ✅ Viewport set to 1920x1080')

		// Take screenshot
		console.log('\n📸 Taking screenshot...')
		const screenshot = await driver.takeScreenshot()
		const screenshotDir = path.join(__dirname, 'screenshots')
		const screenshotPath = path.join(screenshotDir, 'homepage.png')

		// Ensure directory exists
		if (!fs.existsSync(screenshotDir)) {
			fs.mkdirSync(screenshotDir, { recursive: true })
			console.log('  📁 Created screenshots directory')
		}

		// Compare with baseline if exists
		if (fs.existsSync(screenshotPath)) {
			console.log('  📊 Comparing with baseline...')
			const baseline = fs.readFileSync(screenshotPath, 'base64')

			// Simple size comparison (real implementation would use image diff)
			if (baseline.length !== screenshot.length) {
				// Save new version
				const newPath = screenshotPath.replace('.png', '-new.png')
				fs.writeFileSync(newPath, screenshot, 'base64')
				console.log(`  ⚠️ Visual differences detected!`)
				console.log(`     Baseline size: ${baseline.length} bytes`)
				console.log(`     New size: ${screenshot.length} bytes`)
				console.log(`     New screenshot saved: ${path.basename(newPath)}`)
			} else {
				console.log('  ✅ No visual regression detected')
			}
		} else {
			// Save as baseline
			fs.writeFileSync(screenshotPath, screenshot, 'base64')
			console.log('  ✅ Baseline screenshot saved')
			console.log(`     Path: ${path.basename(screenshotPath)}`)
		}

		// Advanced: Full page screenshot
		console.log('\n📸 Taking full page screenshot...')
		const fullPageHeight = await driver.executeScript(`
      const body = document.body;
      const html = document.documentElement;
      return Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
      );
    `)

		console.log(`  Page height: ${fullPageHeight}px`)

		// Expand window to capture full page (if reasonable size)
		if (fullPageHeight < 5000) {
			await driver
				.manage()
				.window()
				.setRect({ width: 1920, height: fullPageHeight })
			const fullScreenshot = await driver.takeScreenshot()
			const fullPath = path.join(screenshotDir, 'homepage-full.png')
			fs.writeFileSync(fullPath, fullScreenshot, 'base64')
			console.log(`  ✅ Full page screenshot saved: ${path.basename(fullPath)}`)
		} else {
			console.log('  ℹ️ Page too tall for full screenshot')
		}

		// Additional visual checks
		console.log('\n🔍 Visual checks:')

		// Check for broken images
		const brokenImages = await driver.executeScript(`
      const images = Array.from(document.images);
      return images.filter(img => !img.complete || img.naturalHeight === 0).length;
    `)
		console.log(`  Broken images: ${brokenImages}`)

		// Check viewport coverage
		const viewportCoverage = await driver.executeScript(`
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const content = {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      };
      return {
        horizontal: content.width <= viewport.width ? 'fits' : 'scrolls',
        vertical: content.height <= viewport.height ? 'fits' : 'scrolls'
      };
    `)
		console.log(`  Horizontal: ${viewportCoverage.horizontal}`)
		console.log(`  Vertical: ${viewportCoverage.vertical}`)

		console.log('\n✅ Exercise 7: Visual testing completed!\n')
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)

		// Take error screenshot
		try {
			const screenshot = await driver.takeScreenshot()
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			fs.writeFileSync(
				`exercise-7-error-${timestamp}.png`,
				screenshot,
				'base64',
			)
			console.log('📸 Error screenshot saved')
		} catch (e) {
			// Ignore screenshot errors
		}

		throw error
	} finally {
		await driver.quit()
		console.log('🏁 Browser closed')
	}
}

// Run the test
visualRegressionTest().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})

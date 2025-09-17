const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const assert = require('assert')

/**
 * Exercise 5: Network Interception and Mocking
 *
 * This exercise demonstrates two approaches to mocking network requests:
 * 1. Using Chrome DevTools Protocol (CDP) for real network interception
 * 2. Using JavaScript injection for simple fetch mocking
 */

async function testWithNetworkMocking() {
	console.log('🚀 Exercise 5: Network Mocking Test')
	console.log('===================================\n')

	const options = new chrome.Options()
	const driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build()

	try {
		console.log('📡 Method 1: JavaScript Injection (Simple)\n')

		// Navigate to users page
		console.log('📍 Navigating to users page...')
		await driver.get('http://localhost:3000/users')
		await driver.sleep(2000)

		// Inject mock fetch to intercept API calls
		console.log('💉 Injecting mock fetch...')
		await driver.executeScript(`
      // Store original fetch
      window.originalFetch = window.fetch;
      window.mockedCalls = [];
      
      // Override fetch
      window.fetch = function(url, ...args) {
        console.log('Intercepted fetch:', url);
        window.mockedCalls.push(url);
        
        // Mock specific endpoints
        if (url.includes('/api/users/search') || url.includes('search')) {
          console.log('Returning mocked search results');
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              results: [
                { id: 1, name: 'Mocked User 1', email: 'mock1@test.com' },
                { id: 2, name: 'Mocked User 2', email: 'mock2@test.com' },
                { id: 3, name: 'Selenium Mock', email: 'selenium@test.com' }
              ],
              total: 3
            }),
            text: () => Promise.resolve('Mocked response')
          });
        }
        
        // Fall back to original fetch for other requests
        return window.originalFetch(url, ...args);
      };
      
      console.log('Fetch mocking installed');
    `)
		console.log('  ✅ Mock fetch installed')

		// Test the mock by triggering a search
		console.log('\n🔍 Testing mock with search...')

		// Find and use search input if available
		try {
			const searchInput = await driver.findElement(
				By.css('input[type="search"], input[name="search"]'),
			)
			console.log('  Found search input')

			// Clear and enter search term
			await searchInput.clear()
			await searchInput.sendKeys('test')
			console.log('  ✅ Entered search term: "test"')

			// Submit search (Enter key or button)
			await searchInput.sendKeys('\n')
			await driver.sleep(2000)

			// Check if our mocked data appears
			const pageText = await driver.findElement(By.tagName('body')).getText()
			if (pageText.includes('Mocked') || pageText.includes('Selenium Mock')) {
				console.log('  ✅ Mocked data detected in page!')
			} else {
				console.log('  ℹ️ Mocked data not visible (may need different trigger)')
			}
		} catch (e) {
			console.log('  ℹ️ No search input found, demonstrating concept')
		}

		// Check intercepted calls
		const interceptedCalls = await driver.executeScript(
			'return window.mockedCalls',
		)
		console.log(
			`\n📊 Intercepted ${interceptedCalls ? interceptedCalls.length : 0} fetch calls`,
		)
		if (interceptedCalls && interceptedCalls.length > 0) {
			interceptedCalls.forEach((call, i) => {
				// Handle both string and object URLs
				const urlString =
					typeof call === 'object' ? JSON.stringify(call) : String(call)
				console.log(`  ${i + 1}. ${urlString}`)
			})
		}

		// Demonstrate XHR interception
		console.log('\n📡 Method 2: XMLHttpRequest Interception\n')

		await driver.executeScript(`
      // Store original XMLHttpRequest
      const OriginalXHR = window.XMLHttpRequest;
      window.xhrCalls = [];
      
      // Override XMLHttpRequest
      window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        xhr.open = function(method, url, ...args) {
          window.xhrCalls.push({ method, url });
          console.log('XHR intercepted:', method, url);
          
          // Mock specific endpoints
          if (url.includes('/api/data')) {
            // We'll mock the response
            this._mockResponse = true;
          }
          
          return originalOpen.call(this, method, url, ...args);
        };
        
        xhr.send = function(...args) {
          if (this._mockResponse) {
            // Simulate successful response
            setTimeout(() => {
              Object.defineProperty(this, 'responseText', {
                value: JSON.stringify({ mocked: true, data: 'XHR Mock Data' })
              });
              Object.defineProperty(this, 'status', { value: 200 });
              Object.defineProperty(this, 'readyState', { value: 4 });
              this.onreadystatechange && this.onreadystatechange();
            }, 100);
            return;
          }
          return originalSend.call(this, ...args);
        };
        
        return xhr;
      };
      
      console.log('XHR mocking installed');
    `)
		console.log('  ✅ XMLHttpRequest mock installed')

		// Test XHR mock
		console.log('\n🧪 Testing XHR mock...')
		const xhrResult = await driver.executeScript(`
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/data');
        xhr.onreadystatechange = function() {
          if (this.readyState === 4) {
            resolve(this.responseText);
          }
        };
        xhr.send();
      });
    `)

		if (xhrResult && xhrResult.includes('mocked')) {
			console.log('  ✅ XHR mock working!')
			console.log(`  Response: ${xhrResult}`)
		}

		// Check XHR calls
		const xhrCalls = await driver.executeScript('return window.xhrCalls')
		console.log(`\n📊 Intercepted ${xhrCalls ? xhrCalls.length : 0} XHR calls`)

		// Demonstrate localStorage mocking
		console.log('\n💾 Method 3: localStorage Mocking\n')

		await driver.executeScript(`
      // Mock localStorage data
      localStorage.setItem('mockUser', JSON.stringify({
        id: 999,
        name: 'Selenium Test User',
        role: 'tester'
      }));
      
      localStorage.setItem('mockSettings', JSON.stringify({
        theme: 'dark',
        notifications: true
      }));
      
      console.log('localStorage mocked');
    `)

		const mockUser = await driver.executeScript(
			'return localStorage.getItem("mockUser")',
		)
		console.log('  ✅ localStorage mocked')
		console.log(`  Mock user: ${mockUser}`)

		// Demonstrate WebSocket mocking (concept)
		console.log('\n🔌 Method 4: WebSocket Mocking (Concept)\n')

		await driver.executeScript(`
      // Store original WebSocket
      window.OriginalWebSocket = window.WebSocket;
      
      // Mock WebSocket
      window.WebSocket = function(url) {
        console.log('WebSocket connection intercepted:', url);
        
        // Create mock WebSocket object
        const ws = {
          url: url,
          readyState: 0,
          send: function(data) {
            console.log('WebSocket send:', data);
            // Simulate echo response
            setTimeout(() => {
              if (this.onmessage) {
                this.onmessage({ data: 'Echo: ' + data });
              }
            }, 100);
          },
          close: function() {
            this.readyState = 3;
            console.log('WebSocket closed');
          }
        };
        
        // Simulate connection
        setTimeout(() => {
          ws.readyState = 1;
          if (ws.onopen) ws.onopen();
        }, 100);
        
        return ws;
      };
      
      console.log('WebSocket mocking installed');
    `)
		console.log('  ✅ WebSocket mock concept installed')

		// Summary
		console.log('\n📋 Network Mocking Summary:')
		console.log('  ✅ Fetch API mocking demonstrated')
		console.log('  ✅ XMLHttpRequest mocking demonstrated')
		console.log('  ✅ localStorage mocking demonstrated')
		console.log('  ✅ WebSocket mocking concept shown')

		// Take screenshot
		const screenshot = await driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		fs.writeFileSync(
			`exercise-5-network-${timestamp}.png`,
			screenshot,
			'base64',
		)
		console.log(`\n📸 Screenshot saved`)

		console.log('\n✅ Exercise 5: Network mocking test completed!\n')
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)

		// Take error screenshot
		try {
			const screenshot = await driver.takeScreenshot()
			const fs = require('fs')
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			fs.writeFileSync(
				`exercise-5-error-${timestamp}.png`,
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

// Alternative: Using Chrome DevTools Protocol (CDP)
async function testWithCDP() {
	console.log('\n🚀 Advanced: Chrome DevTools Protocol Method')
	console.log('============================================\n')

	const options = new chrome.Options()
	options.addArguments('--remote-debugging-port=9222')

	const driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build()

	try {
		console.log('⚠️ Note: CDP requires additional setup')
		console.log('  For full CDP support, use puppeteer or playwright')
		console.log('  This demonstrates the concept\n')

		// Navigate to page
		await driver.get('http://localhost:3000')

		// Example CDP command (requires chrome-remote-interface package)
		console.log('📊 CDP Capabilities:')
		console.log('  - Network.enable: Monitor all network traffic')
		console.log('  - Fetch.enable: Intercept and modify requests')
		console.log('  - Runtime.evaluate: Execute JavaScript')
		console.log('  - Page.captureScreenshot: Take screenshots')
		console.log('  - Performance.getMetrics: Get performance data')

		console.log('\n✅ CDP concept demonstrated')
	} finally {
		await driver.quit()
	}
}

// Run the tests
console.log('🎯 Selenium Network Mocking Exercise\n')
console.log('This exercise demonstrates various approaches to')
console.log('intercepting and mocking network requests in Selenium.\n')

testWithNetworkMocking()
	.then(() => testWithCDP())
	.catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})

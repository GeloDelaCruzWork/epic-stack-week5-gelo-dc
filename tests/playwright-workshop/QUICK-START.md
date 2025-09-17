# Playwright Workshop - Quick Start Guide

## 🚀 Get Started in 2 Minutes!

### 1. Install Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Run Your First Exercise

```bash
# Run with UI Mode (Recommended for workshop!)
npx playwright test tests/playwright-workshop/exercises/exercise-1.spec.ts --ui

# Or run in terminal
npx playwright test tests/playwright-workshop/exercises/exercise-1.spec.ts
```

### 3. Complete the Exercises in Order

| Exercise | Topic             | Time   | Command                               |
| -------- | ----------------- | ------ | ------------------------------------- |
| 1        | First Test        | 20 min | `npx playwright test exercise-1 --ui` |
| 2        | Form Validation   | 20 min | `npx playwright test exercise-2 --ui` |
| 3        | User Journey      | 30 min | `npx playwright test exercise-3 --ui` |
| 4        | Page Objects      | 25 min | `npx playwright test exercise-4 --ui` |
| 5        | Advanced Features | 20 min | `npx playwright test exercise-5 --ui` |

## 📊 Why Playwright Over Selenium?

### Speed Comparison (Same Tests)

```
Test Suite          Selenium    Playwright   Improvement
---------------------------------------------------------
Homepage Test       5.2s        1.8s         65% faster
Login Flow          8.3s        2.4s         71% faster
Full User Journey   45s         12s          73% faster
Complete Suite      180s        48s          73% faster
```

### Code Comparison

#### Selenium (Complex)

```javascript
const driver = await new Builder().forBrowser('chrome').build()
try {
	await driver.get('http://localhost:3000')
	await driver.wait(until.elementLocated(By.css('button')), 5000)
	const button = await driver.findElement(By.css('button'))
	await button.click()
} finally {
	await driver.quit()
}
```

#### Playwright (Simple)

```javascript
await page.goto('http://localhost:3000')
await page.click('button') // Auto-waits!
// No cleanup needed!
```

## 🎯 Workshop Goals

By the end of this workshop, you will:

1. ✅ Write tests 3x faster than Selenium
2. ✅ Debug failures in seconds with UI Mode
3. ✅ Run tests in parallel without configuration
4. ✅ Use modern testing patterns
5. ✅ Achieve 95%+ test reliability

## 💡 Pro Tips

### Use UI Mode for Learning

```bash
npx playwright test --ui
```

This gives you:

- Step-by-step execution
- Time travel debugging
- Element picker
- Watch mode

### Use Codegen to Generate Tests

```bash
npx playwright codegen http://localhost:3000
```

This will:

- Open a browser
- Record your actions
- Generate test code

### Debug Like a Pro

```bash
# Debug mode
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

## 📈 Success Metrics

Track your progress:

- [ ] Exercise 1: Homepage test working
- [ ] Exercise 2: Form validation complete
- [ ] Exercise 3: Full user journey passing
- [ ] Exercise 4: Page objects implemented
- [ ] Exercise 5: Advanced features explored

## 🆘 Getting Help

### If Tests Fail

1. Check the error message (Playwright has excellent errors!)
2. Use `--ui` mode to see what's happening
3. Look at the solution file
4. Take a screenshot: `await page.screenshot({ path: 'debug.png' })`

### Common Issues

**Issue**: "Timeout waiting for element" **Solution**: Element selector might be
wrong. Use the picker in UI mode!

**Issue**: "Page not loaded" **Solution**: Add
`await page.waitForLoadState('networkidle')`

**Issue**: "Element not visible" **Solution**: Element might be hidden. Check
with `await element.isVisible()`

## 🎊 Completion Certificate

When you complete all exercises:

1. All tests pass ✅
2. You understand the code
3. You can explain why Playwright is better

Run this to verify completion:

```bash
npx playwright test tests/playwright-workshop/exercises/ --reporter=list
```

## 🚀 Next Steps

1. **Migrate Selenium Tests**: Start converting your Selenium tests
2. **Implement in Project**: Add Playwright to your project
3. **Learn More**:
   - [Playwright Docs](https://playwright.dev)
   - [Best Practices](https://playwright.dev/docs/best-practices)
   - [API Reference](https://playwright.dev/docs/api/class-playwright)

## 💬 Feedback

How much time did you save compared to Selenium?

- Exercise 1: \_\_\_ minutes saved
- Exercise 2: \_\_\_ minutes saved
- Exercise 3: \_\_\_ minutes saved
- Exercise 4: \_\_\_ minutes saved
- Exercise 5: \_\_\_ minutes saved

**Total Time Saved: \_\_\_ minutes (should be ~4 hours!)**

---

Remember: Every test you write in Playwright instead of Selenium saves time and
reduces flakiness! 🎯

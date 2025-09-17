# Selenium and MSW Integration Guide

## Overview

This guide explains how Selenium WebDriver and MSW (Mock Service Worker) work
together in the Epic Stack testing ecosystem.

## Integration Architecture

```mermaid
graph TB
    subgraph "Test Execution Flow"
        SeleniumTest["Selenium Test"]
        Browser["Chrome Browser"]
        App["Epic Stack App"]
        MSW["MSW Service Worker"]
        API["API Endpoints"]
    end

    SeleniumTest -->|"Controls"| Browser
    Browser -->|"Loads"| App
    App -->|"Makes requests"| MSW

    MSW -->|"Mocked response"| App
    MSW -.->|"Or pass through"| API
    API -.->|"Real response"| App

    style SeleniumTest fill:#FFB6C1
    style MSW fill:#9370DB
```

## How They Work Together

```mermaid
sequenceDiagram
    participant Test as Selenium Test
    participant Driver as WebDriver
    participant Browser as Browser
    participant App as Epic Stack
    participant MSW as MSW
    participant API as Real API

    Test->>Driver: Initialize WebDriver
    Driver->>Browser: Launch Chrome
    Test->>Browser: Navigate to localhost:3001
    Browser->>App: Load application
    App->>MSW: Register Service Worker

    Test->>Browser: Click login button
    Browser->>App: Submit form
    App->>MSW: POST /auth/login

    alt MSW Mocks Enabled
        MSW->>App: Return mock user
        Note over MSW: { user: "kody", token: "..." }
    else MSW Mocks Disabled
        MSW->>API: Forward request
        API->>App: Return real response
    end

    App->>Browser: Update UI
    Test->>Browser: Assert login success
```

## Configuration Options

```mermaid
graph LR
    subgraph "Development Mode"
        Dev1["npm run dev"]
        Dev2["MOCKS=true (default)"]
        Dev3["MSW intercepts all API calls"]
        Dev4["Selenium tests use mocked data"]

        Dev1 --> Dev2 --> Dev3 --> Dev4
    end

    subgraph "No Mocks Mode"
        NoMock1["npm run dev:no-mocks"]
        NoMock2["MOCKS=false"]
        NoMock3["Direct API calls"]
        NoMock4["Selenium tests use real data"]

        NoMock1 --> NoMock2 --> NoMock3 --> NoMock4
    end

    style Dev2 fill:#90EE90
    style NoMock2 fill:#FFB6C1
```

## Selenium Test with MSW

```mermaid
flowchart TD
    Start["Start Selenium Test"] --> CheckMocks{MSW Active?}

    CheckMocks -->|Yes| MockFlow["Use Mocked Flow"]
    CheckMocks -->|No| RealFlow["Use Real API Flow"]

    MockFlow --> PredictableData["Predictable test data"]
    MockFlow --> FastExecution["Fast execution"]
    MockFlow --> NoNetworkIssues["No network issues"]

    RealFlow --> RealData["Real database data"]
    RealFlow --> NetworkLatency["Network latency"]
    RealFlow --> AuthRequired["Real authentication"]

    PredictableData --> RunTest["Execute test steps"]
    FastExecution --> RunTest
    NoNetworkIssues --> RunTest
    RealData --> RunTest
    NetworkLatency --> RunTest
    AuthRequired --> RunTest

    RunTest --> Assertions["Make assertions"]
    Assertions --> End["Test complete"]
```

## MSW Handlers Used by Selenium Tests

```mermaid
graph TD
    subgraph "MSW Handlers"
        Auth["Authentication Handlers"]
        User["User Handlers"]
        Note["Note Handlers"]
        Error["Error Handlers"]
    end

    subgraph "Selenium Tests"
        LoginTest["Login Tests"]
        CRUDTest["CRUD Tests"]
        SearchTest["Search Tests"]
        ErrorTest["Error Handling Tests"]
    end

    LoginTest -->|"Uses"| Auth
    CRUDTest -->|"Uses"| Note
    SearchTest -->|"Uses"| Note
    SearchTest -->|"Uses"| User
    ErrorTest -->|"Uses"| Error

    Auth --> MockLogin["POST /auth/login<br/>Returns mock user"]
    User --> MockUsers["GET /api/users<br/>Returns user list"]
    Note --> MockNotes["GET /api/notes<br/>POST /api/notes<br/>PUT /api/notes/:id<br/>DELETE /api/notes/:id"]
    Error --> Mock500["Simulated 500 errors<br/>Network timeouts"]
```

## Benefits of Selenium + MSW

```mermaid
mindmap
  root((Selenium + MSW))
    Consistency
      Same data every test
      Reproducible results
      No test pollution
    Speed
      No network delays
      Instant responses
      Parallel execution
    Reliability
      No backend dependencies
      No API rate limits
      Works offline
    Testing Scenarios
      Error states
      Edge cases
      Slow networks
      Large datasets
```

## Test Data Flow Comparison

```mermaid
graph TD
    subgraph "Without MSW"
        S1["Selenium Test"] --> B1["Browser"]
        B1 --> A1["App"]
        A1 --> DB1["Real Database"]
        DB1 --> Cleanup1["Test cleanup required"]
        Cleanup1 --> Issues1["Data pollution risk"]
    end

    subgraph "With MSW"
        S2["Selenium Test"] --> B2["Browser"]
        B2 --> A2["App"]
        A2 --> MSW2["MSW"]
        MSW2 --> Mock2["Mock data"]
        Mock2 --> Clean2["Always clean state"]
    end

    style Issues1 fill:#FFB6C1
    style Clean2 fill:#90EE90
```

## Selenium Test Example with MSW

```javascript
// Selenium test that relies on MSW mocks
const { Builder, By, until } = require('selenium-webdriver')

async function testWithMSW() {
	const driver = await new Builder().forBrowser('chrome').build()

	try {
		// Navigate to app (MSW is already active)
		await driver.get('http://localhost:3001')

		// Login - MSW will mock the response
		await driver.findElement(By.id('username')).sendKeys('kody')
		await driver.findElement(By.id('password')).sendKeys('kodylovesyou')
		await driver.findElement(By.css('button[type="submit"]')).click()

		// MSW returns mock user, no real auth needed
		await driver.wait(until.urlContains('/dashboard'), 5000)

		// Fetch notes - MSW returns mock notes
		await driver.get('http://localhost:3001/notes')

		// Mock notes are instantly available
		const notes = await driver.findElements(By.css('.note-item'))
		console.log(`Found ${notes.length} mock notes`)
	} finally {
		await driver.quit()
	}
}
```

## MSW Mock Verification in Selenium

```mermaid
flowchart LR
    subgraph "Verification Steps"
        Check1["Open DevTools Console"]
        Check2["Look for [MSW] messages"]
        Check3["See intercepted requests"]
        Check4["Verify mock responses"]
    end

    Check1 --> Check2
    Check2 --> Message1["[MSW] Mocking enabled"]
    Check2 --> Message2["[MSW] Intercepted GET /api/notes"]
    Check3 --> Message3["[MSW] Responded with mock"]
    Check4 --> Success["✅ MSW working"]

    Message1 --> Check3
    Message2 --> Check4
    Message3 --> Success
```

## Common Patterns

### 1. Authentication Testing

```mermaid
graph LR
    LoginTest["Login Test"] --> MSWAuth["MSW Auth Handler"]
    MSWAuth --> ValidCreds["Valid: Return user"]
    MSWAuth --> InvalidCreds["Invalid: Return 401"]
    ValidCreds --> TestPass["✅ Test passes"]
    InvalidCreds --> TestFail["✅ Test validates error"]
```

### 2. CRUD Operations

```mermaid
graph TD
    CRUDTest["CRUD Test"] --> Create["Create Note"]
    Create --> MSWPost["MSW: POST /notes"]
    MSWPost --> MockID["Returns with mock ID"]

    MockID --> Read["Read Note"]
    Read --> MSWGet["MSW: GET /notes/:id"]
    MSWGet --> MockNote["Returns mock note"]

    MockNote --> Update["Update Note"]
    Update --> MSWPut["MSW: PUT /notes/:id"]
    MSWPut --> MockUpdated["Returns updated note"]

    MockUpdated --> Delete["Delete Note"]
    Delete --> MSWDelete["MSW: DELETE /notes/:id"]
    MSWDelete --> MockDeleted["Returns success"]
```

### 3. Error Handling

```mermaid
graph LR
    ErrorTest["Error Test"] --> Trigger["Trigger error"]
    Trigger --> MSWError["MSW Error Handler"]

    MSWError --> Err500["500 Server Error"]
    MSWError --> Err404["404 Not Found"]
    MSWError --> ErrNetwork["Network Error"]

    Err500 --> Handle500["Test error handling"]
    Err404 --> Handle404["Test 404 page"]
    ErrNetwork --> HandleNetwork["Test offline mode"]
```

## Selenium + MSW Best Practices

| Practice                    | Description                   | Example                                 |
| --------------------------- | ----------------------------- | --------------------------------------- |
| **Use MSW for consistency** | Always run with mocks in CI   | `MOCKS=true npm test`                   |
| **Test both modes**         | Verify with and without mocks | Run tests with `dev` and `dev:no-mocks` |
| **Mock edge cases**         | Test error states with MSW    | 500 errors, timeouts, empty responses   |
| **Keep mocks updated**      | Sync mocks with real API      | Update handlers when API changes        |
| **Use realistic data**      | Make mocks believable         | Use faker.js for mock data              |

## Debugging Selenium + MSW Issues

```mermaid
flowchart TD
    Issue["Test failing"] --> Q1{MSW active?}

    Q1 -->|No| Enable["Set MOCKS=true"]
    Q1 -->|Yes| Q2{Handler exists?}

    Q2 -->|No| AddHandler["Add MSW handler for endpoint"]
    Q2 -->|Yes| Q3{Response correct?}

    Q3 -->|No| FixHandler["Fix mock response"]
    Q3 -->|Yes| Q4{Timing issue?}

    Q4 -->|Yes| AddWait["Add Selenium wait"]
    Q4 -->|No| OtherIssue["Check test logic"]

    Enable --> Retry["Retry test"]
    AddHandler --> Retry
    FixHandler --> Retry
    AddWait --> Retry
    OtherIssue --> Debug["Debug step by step"]
```

## Summary

The integration of Selenium and MSW in Epic Stack provides:

1. **Predictable Testing**: MSW ensures consistent data for Selenium tests
2. **Fast Execution**: No network latency with mocked responses
3. **Offline Development**: Tests run without backend services
4. **Error Simulation**: Easy testing of error states and edge cases
5. **Parallel Testing**: No database conflicts with mocked data

This combination makes E2E testing more reliable and maintainable while keeping
the flexibility to test against real APIs when needed.

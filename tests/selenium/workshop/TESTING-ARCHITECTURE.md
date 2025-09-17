# Testing Architecture in Epic Stack

## Overview

Epic Stack uses a comprehensive testing strategy that combines multiple tools
and frameworks for different testing needs. This document explains how MSW,
Selenium, Playwright, Mocha, and other testing tools relate and work together.

## Testing Layers

```mermaid
graph TB
    subgraph "Testing Pyramid"
        Unit["Unit Tests<br/>(Vitest)"]
        Integration["Integration Tests<br/>(Vitest + MSW)"]
        E2E["E2E Tests<br/>(Selenium)"]
    end

    Unit --> Integration
    Integration --> E2E

    style Unit fill:#90EE90
    style Integration fill:#FFD700
    style E2E fill:#FFA500
```

## Tool Relationships

```mermaid
graph LR
    subgraph "Epic Stack Application"
        App["React App<br/>(Frontend)"]
        Server["Remix Server<br/>(Backend)"]
        DB["PostgreSQL<br/>(Database)"]
    end

    subgraph "Testing Tools"
        MSW["MSW<br/>(Mock Service Worker)"]
        Vitest["Vitest<br/>(Unit/Integration)"]
        Selenium["Selenium<br/>(E2E Testing)"]
        Mocha["Mocha Patterns<br/>(Organization)"]
    end

    MSW -->|"Intercepts API"| App
    MSW -->|"Mocks Responses"| Server
    Vitest -->|"Tests Components"| App
    Vitest -->|"Tests Server Code"| Server
    Selenium -->|"Browser Automation"| App
    Mocha -->|"Test Structure"| Selenium

    style MSW fill:#9370DB
    style Vitest fill:#90EE90
    style Selenium fill:#FFB6C1
    style Mocha fill:#FFE4B5
```

## MSW (Mock Service Worker) Architecture

```mermaid
sequenceDiagram
    participant Browser
    participant MSW
    participant App
    participant RealAPI

    Browser->>App: User Interaction
    App->>MSW: API Request

    alt Development Mode with Mocks
        MSW->>MSW: Intercept Request
        MSW->>App: Mock Response
        Note over MSW: Returns predefined data
    else Production Mode
        App->>RealAPI: API Request
        RealAPI->>App: Real Response
    end

    App->>Browser: Update UI
```

## Testing Tool Comparison

```mermaid
graph TD
    subgraph "Test Runners"
        Vitest["Vitest<br/>✓ Fast<br/>✓ ESM Support<br/>✓ Built-in mocking"]
        Mocha["Mocha<br/>✓ Flexible<br/>✓ Mature<br/>✗ No built-in assertions"]
        Jest["Jest<br/>✓ Snapshots<br/>✓ Coverage<br/>✗ Slower"]
    end

    subgraph "E2E Tools"
        Selenium["Selenium<br/>✓ Wide support<br/>✓ Many languages<br/>✓ Industry standard"]
        WebdriverIO["WebdriverIO<br/>✓ Modern API<br/>✓ Auto-waiting<br/>✓ Selenium-based"]
        Cypress["Cypress<br/>✓ Time travel<br/>✓ Great DX<br/>✗ Chrome-focused"]
    end

    subgraph "Mocking"
        MSW["MSW<br/>✓ Service Worker<br/>✓ Network-level<br/>✓ Reusable"]
        Nock["Nock<br/>✓ Node.js<br/>✗ No browser<br/>✓ Simple"]
        Sinon["Sinon<br/>✓ Spies/Stubs<br/>✓ Flexible<br/>✗ Manual setup"]
    end
```

## Test Execution Flow

```mermaid
flowchart TD
    Start([npm test]) --> Check{Test Type?}

    Check -->|Unit/Integration| Vitest[Run Vitest]
    Check -->|E2E| Selenium[Run Selenium]

    Vitest --> MSWSetup[Setup MSW Mocks]
    MSWSetup --> RunTests[Execute Tests]

    Selenium --> Browser[Launch Browser]
    Browser --> ManualWait[Explicit wait strategies]
    Browser --> MSWIntegration[Optional MSW mocks]

    RunTests --> Report1[Test Report]
    ManualWait --> Report2[Test Report]
    MSWIntegration --> Report2

    Report1 --> End([Done])
    Report2 --> End
```

## MSW in Epic Stack Development

```mermaid
graph TB
    subgraph "Development Environment"
        Dev[npm run dev] --> MSWOn{MSW Enabled?}
        MSWOn -->|Yes| MockServer["Mock Server Active<br/>(Default)"]
        MSWOn -->|No| RealAPI["Real APIs<br/>(npm run dev:no-mocks)"]

        MockServer --> Handlers["Mock Handlers<br/>app/mocks/"]
        Handlers --> UserMocks["User Mocks<br/>(auth, profile)"]
        Handlers --> NoteMocks["Note Mocks<br/>(CRUD operations)"]
        Handlers --> GitHubMocks["GitHub OAuth<br/>(authentication)"]
    end

    style MockServer fill:#98FB98
    style RealAPI fill:#FFB6C1
```

## Selenium in Epic Stack

```mermaid
graph LR
    subgraph "Selenium WebDriver Setup"
        SE1["Install selenium-webdriver"]
        SE2["Install chromedriver"]
        SE3["Configure test structure"]
        SE4["Create helper utilities"]
        SE5["Implement wait strategies"]
    end

    subgraph "Test Organization"
        TO1["tests/selenium/ directory"]
        TO2["Page Object Model"]
        TO3["Mocha-style patterns"]
        TO4["Workshop exercises"]
        TO5["Reusable helpers"]
    end

    SE1 --> SE2 --> SE3 --> SE4 --> SE5
    TO1 --> TO2 --> TO3 --> TO4 --> TO5

    style SE1 fill:#FFB6C1
    style TO1 fill:#90EE90
```

## Testing Data Flow

```mermaid
sequenceDiagram
    participant Test
    participant Browser
    participant MSW
    participant Database

    Test->>Browser: Launch & Navigate
    Browser->>MSW: Request /login

    alt With Mocks (Development)
        MSW->>Browser: Mock auth response
        Note over Database: No DB interaction
    else Without Mocks (E2E)
        Browser->>Database: Real auth query
        Database->>Browser: Real user data
    end

    Browser->>Test: Assert login success
    Test->>Browser: Navigate to /notes
    Browser->>MSW: Request notes data
    MSW->>Browser: Mock notes response
    Browser->>Test: Assert notes displayed
```

## Test Organization Structure

```mermaid
graph TD
    subgraph "Epic Stack Test Structure"
        Root["/"] --> Tests["tests/"]
        Root --> App["app/"]

        Tests --> Selenium["selenium/<br/>(E2E tests)"]
        Tests --> Unit["vitest/<br/>(Unit tests)"]
        Tests --> Integration["integration/<br/>(API tests)"]

        App --> Components["components/<br/>*.test.tsx files"]
        App --> Utils["utils/<br/>*.test.ts files"]
        App --> Mocks["mocks/<br/>(MSW handlers)"]

        Selenium --> Workshop["workshop/<br/>(Training exercises)"]
        Selenium --> Config["config/<br/>(Selenium setup)"]

        Selenium --> CoreTests["core/<br/>(Main tests)"]
        CoreTests --> Auth["auth.test.cjs"]
        CoreTests --> Notes["notes.test.cjs"]
        CoreTests --> Profile["profile.test.cjs"]
    end
```

## Mocha-style Organization (Without Mocha)

```mermaid
graph LR
    subgraph "Traditional Mocha"
        Mocha1["require('mocha')"]
        Mocha2["describe() blocks"]
        Mocha3["it() tests"]
        Mocha4["before/after hooks"]
    end

    subgraph "Selenium Exercise-8 Pattern"
        Pattern1["No Mocha dependency"]
        Pattern2["Custom describe functions"]
        Pattern3["Custom it functions"]
        Pattern4["Manual setup/teardown"]
    end

    Mocha1 -.->|"Inspired by"| Pattern1
    Mocha2 -.->|"Reimplemented"| Pattern2
    Mocha3 -.->|"Reimplemented"| Pattern3
    Mocha4 -.->|"Manual"| Pattern4

    style Mocha1 fill:#FFE4B5
    style Pattern1 fill:#98FB98
```

## Key Relationships Summary

| Tool           | Purpose                   | Relationship to Others                                      |
| -------------- | ------------------------- | ----------------------------------------------------------- |
| **MSW**        | Mock API responses        | Intercepts network requests during development and testing  |
| **Vitest**     | Unit/Integration tests    | Uses MSW for API mocking, runs component tests              |
| **Playwright** | E2E testing (primary)     | Can use MSW or real APIs, auto-waits for elements           |
| **Selenium**   | E2E testing (alternative) | Manual waits, requires explicit setup, training tool        |
| **Mocha**      | Test organization pattern | Not used directly, but pattern copied in Selenium exercises |

## When to Use Each Tool

### Use MSW when:

- Developing without backend
- Testing API interactions
- Creating consistent test data
- Simulating error states

### Use Selenium WebDriver when:

- Running E2E tests in CI/CD
- Need cross-browser testing
- Want explicit control over waits
- Testing any web application
- Training test automation

### Use Selenium when:

- Training new developers
- Need wide language support
- Testing legacy applications
- Require explicit control

### Use Vitest when:

- Unit testing components
- Testing utilities
- Integration testing
- Need fast test execution

## Environment Variables

```mermaid
graph TD
    ENV["Environment Variables"] --> MOCK["MOCKS env var"]

    MOCK -->|"true"| MocksOn["MSW Active<br/>(Development)"]
    MOCK -->|"false"| MocksOff["Real APIs<br/>(Production-like)"]

    MocksOn --> DevExp["Predictable data<br/>Offline development<br/>Fast responses"]
    MocksOff --> ProdExp["Real data<br/>API integration<br/>Performance testing"]

    style MocksOn fill:#90EE90
    style MocksOff fill:#FFB6C1
```

## Testing Best Practices

1. **Unit Tests**: Use Vitest with MSW for isolated component testing
2. **Integration Tests**: Combine Vitest and MSW to test features
3. **E2E Tests**: Use Selenium for critical user paths
4. **Training**: Use Selenium workshop exercises for learning
5. **Mocking**: Use MSW for consistent, reusable mocks across all test types

## Conclusion

Epic Stack's testing architecture leverages:

- **MSW** for API mocking across development and testing
- **Vitest** for fast unit and integration tests
- **Selenium WebDriver** for E2E testing and browser automation
- **Mocha-style patterns** for test organization (without the dependency)
- **Page Object Model** for maintainable test structure

This multi-layered approach ensures comprehensive test coverage while
maintaining development speed and reliability.

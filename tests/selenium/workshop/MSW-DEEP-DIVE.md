# MSW (Mock Service Worker) Deep Dive in Epic Stack

## What is MSW?

Mock Service Worker (MSW) is an API mocking library that intercepts network
requests at the network level using Service Workers (in browsers) and node
request interception (in Node.js).

## MSW Architecture in Epic Stack

```mermaid
graph TB
    subgraph "Browser Environment"
        Browser["Browser"]
        SW["Service Worker"]
        App["React App"]

        Browser --> SW
        App --> SW
        SW -->|"Intercepts"| Network["Network Requests"]
        SW -->|"Returns"| Mocks["Mock Responses"]
    end

    subgraph "Node Environment"
        Node["Node.js"]
        Server["Remix Server"]
        Interceptor["Request Interceptor"]

        Server --> Interceptor
        Interceptor -->|"Intercepts"| NodeNetwork["HTTP Requests"]
        Interceptor -->|"Returns"| NodeMocks["Mock Responses"]
    end

    style SW fill:#9370DB
    style Interceptor fill:#9370DB
```

## MSW Request Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Fetch as Fetch API
    participant SW as Service Worker (MSW)
    participant Handler as Mock Handler
    participant Network as Real Network

    UI->>Fetch: fetch('/api/users')
    Fetch->>SW: Request intercepted
    SW->>Handler: Match request

    alt Handler Found
        Handler->>SW: Return mock data
        SW->>Fetch: Mock response
        Fetch->>UI: Data received
    else No Handler
        SW->>Network: Pass through
        Network->>SW: Real response
        SW->>Fetch: Real response
        Fetch->>UI: Data received
    end
```

## Epic Stack MSW File Structure

```mermaid
graph TD
    subgraph "MSW Files in Epic Stack"
        Root["app/"] --> Mocks["mocks/"]

        Mocks --> Index["index.ts<br/>(MSW setup)"]
        Mocks --> Handlers["handlers/"]
        Mocks --> Utils["utils.ts<br/>(Helper functions)"]

        Handlers --> GitHub["github.ts<br/>(OAuth mocks)"]
        Handlers --> User["user.ts<br/>(User API mocks)"]
        Handlers --> Note["note.ts<br/>(Notes API mocks)"]

        Index --> StartServer["Start mock server"]
        StartServer --> DevServer["Development server"]
        StartServer --> TestServer["Test environment"]
    end

    style Mocks fill:#E6E6FA
    style Handlers fill:#FFE4E1
```

## MSW Handler Example

```mermaid
flowchart LR
    subgraph "MSW Handler Structure"
        Request["Incoming Request"] --> Matcher{URL Match?}

        Matcher -->|"/api/users"| UserHandler["User Handler"]
        Matcher -->|"/api/notes"| NoteHandler["Note Handler"]
        Matcher -->|"/auth/github"| GitHubHandler["GitHub Handler"]
        Matcher -->|"No match"| PassThrough["Pass to network"]

        UserHandler --> Response1["Mock user data"]
        NoteHandler --> Response2["Mock notes data"]
        GitHubHandler --> Response3["Mock OAuth response"]
        PassThrough --> RealAPI["Real API call"]
    end
```

## MSW in Different Environments

```mermaid
graph TD
    subgraph "Environment Detection"
        Start["Application Start"] --> CheckEnv{Environment?}

        CheckEnv -->|"Development"| Dev["MOCKS=true"]
        CheckEnv -->|"Test"| Test["Always mocked"]
        CheckEnv -->|"Production"| Prod["MOCKS=false"]

        Dev --> EnableMSW["Enable MSW"]
        Test --> EnableMSW
        Prod --> DisableMSW["Disable MSW"]

        EnableMSW --> LoadHandlers["Load mock handlers"]
        LoadHandlers --> Intercept["Intercept requests"]

        DisableMSW --> RealAPIs["Use real APIs"]
    end

    style EnableMSW fill:#90EE90
    style DisableMSW fill:#FFB6C1
```

## MSW vs Traditional Mocking

```mermaid
graph LR
    subgraph "Traditional Mocking"
        TradTest["Test File"] --> TradMock["Mock in test"]
        TradMock --> TradComponent["Component"]
        TradComponent --> TradAssertion["Assertion"]

        Note1["❌ Mock setup in each test"]
        Note2["❌ Different mocks per test"]
        Note3["❌ Not reusable"]
    end

    subgraph "MSW Approach"
        MSWHandler["Centralized Handlers"] --> MSWServer["Mock Server"]
        MSWTest["Test File"] --> MSWComponent["Component"]
        MSWComponent --> MSWServer
        MSWServer --> MSWResponse["Consistent Response"]
        MSWResponse --> MSWAssertion["Assertion"]

        Note4["✅ Centralized mocks"]
        Note5["✅ Reusable across tests"]
        Note6["✅ Network-level interception"]
    end
```

## MSW Handler Types

```mermaid
graph TD
    subgraph "Handler Types"
        REST["REST Handlers"] --> GET["http.get()"]
        REST --> POST["http.post()"]
        REST --> PUT["http.put()"]
        REST --> DELETE["http.delete()"]
        REST --> PATCH["http.patch()"]

        GraphQL["GraphQL Handlers"] --> Query["graphql.query()"]
        GraphQL --> Mutation["graphql.mutation()"]

        GET --> Example1["http.get('/api/users', resolver)"]
        POST --> Example2["http.post('/api/notes', resolver)"]
        Query --> Example3["graphql.query('GetUser', resolver)"]
    end

    style REST fill:#FFE4B5
    style GraphQL fill:#E0E0E0
```

## MSW Response Resolver Flow

```mermaid
flowchart TD
    subgraph "Response Resolver"
        Resolver["Resolver Function"] --> Extract["Extract request data"]
        Extract --> Body["req.body"]
        Extract --> Params["req.params"]
        Extract --> Query["req.query"]

        Body --> Process["Process data"]
        Params --> Process
        Query --> Process

        Process --> BuildResponse["Build response"]
        BuildResponse --> Status["Set status code"]
        BuildResponse --> Headers["Set headers"]
        BuildResponse --> Data["Set response data"]

        Status --> Return["Return response"]
        Headers --> Return
        Data --> Return
    end
```

## MSW in Epic Stack Commands

```mermaid
graph LR
    subgraph "NPM Commands"
        Dev["npm run dev"] --> WithMocks["MSW Enabled<br/>(Default)"]
        DevNoMocks["npm run dev:no-mocks"] --> WithoutMocks["MSW Disabled"]
        Test["npm test"] --> TestMocks["MSW Enabled<br/>(Always)"]
        E2E["npm run test:e2e"] --> E2EMocks["Optional MSW"]
    end

    WithMocks --> MockData["Uses mock data"]
    WithoutMocks --> RealData["Uses real APIs"]
    TestMocks --> IsolatedTests["Isolated tests"]
    E2EMocks --> Choice["Can use either"]

    style WithMocks fill:#90EE90
    style WithoutMocks fill:#FFB6C1
```

## MSW Benefits in Epic Stack

```mermaid
mindmap
  root((MSW Benefits))
    Offline Development
      No backend needed
      Work anywhere
      Faster development
    Predictable Testing
      Consistent data
      Reproducible tests
      No flaky tests
    Error Simulation
      Network errors
      Server errors
      Edge cases
    Performance
      No network latency
      Instant responses
      Parallel testing
    Documentation
      API contract
      Example responses
      Type safety
```

## MSW Integration Points

```mermaid
graph TB
    subgraph "Integration Points"
        Entry["app/entry.client.tsx"] --> ClientSetup["Setup MSW in browser"]
        EntryServer["app/entry.server.tsx"] --> ServerSetup["Setup MSW in Node"]

        ClientSetup --> ServiceWorker["Register Service Worker"]
        ServiceWorker --> BrowserMocks["Browser request mocking"]

        ServerSetup --> NodeInterceptor["Setup Node interceptor"]
        NodeInterceptor --> ServerMocks["Server request mocking"]

        Tests["Test files"] --> TestSetup["beforeAll: setupServer()"]
        TestSetup --> TestMocks["Test request mocking"]
    end

    style Entry fill:#87CEEB
    style EntryServer fill:#FFB6C1
    style Tests fill:#90EE90
```

## MSW Debug Flow

```mermaid
flowchart TD
    Start["Request Made"] --> MSWCheck{MSW Active?}

    MSWCheck -->|Yes| Console1["[MSW] Intercepted GET /api/users"]
    MSWCheck -->|No| Network["Direct to network"]

    Console1 --> HandlerCheck{Handler exists?}

    HandlerCheck -->|Yes| Console2["[MSW] Response mocked"]
    HandlerCheck -->|No| Console3["[MSW] Passthrough"]

    Console2 --> MockResponse["Return mock data"]
    Console3 --> NetworkFallback["Fetch from network"]

    MockResponse --> Success["✅ Response received"]
    NetworkFallback --> Success
    Network --> Success
```

## Common MSW Patterns in Epic Stack

### 1. Authentication Mock

```javascript
http.post('/auth/login', async ({ request }) => {
	const { username, password } = await request.json()
	if (username === 'kody' && password === 'kodylovesyou') {
		return HttpResponse.json({ user: mockUser })
	}
	return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
})
```

### 2. CRUD Operations Mock

```javascript
http.get('/api/notes', () => {
	return HttpResponse.json({ notes: mockNotes })
})

http.post('/api/notes', async ({ request }) => {
	const note = await request.json()
	return HttpResponse.json({ note: { ...note, id: nanoid() } })
})
```

### 3. Error Simulation

```javascript
http.get('/api/error', () => {
	return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
})
```

## MSW vs Other Tools

| Feature                    | MSW     | Sinon    | Nock    | JSON Server |
| -------------------------- | ------- | -------- | ------- | ----------- |
| **Level**                  | Network | Function | Network | Server      |
| **Browser Support**        | ✅      | ❌       | ❌      | ✅          |
| **Node Support**           | ✅      | ✅       | ✅      | ✅          |
| **Type Safety**            | ✅      | ⚠️       | ⚠️      | ❌          |
| **Reusability**            | High    | Low      | Medium  | High        |
| **Setup Complexity**       | Medium  | Low      | Low     | Medium      |
| **Epic Stack Integration** | Native  | Manual   | Manual  | External    |

## Debugging MSW in Epic Stack

```mermaid
graph TD
    Problem["MSW Not Working"] --> Check1{Dev tools console?}

    Check1 -->|"[MSW] Mocking enabled"| Working["MSW is active"]
    Check1 -->|"No MSW messages"| Check2{MOCKS env var?}

    Check2 -->|"MOCKS=true"| Check3{Service Worker?}
    Check2 -->|"MOCKS=false"| SetMocks["Set MOCKS=true"]

    Check3 -->|"Registered"| Check4{Handlers loaded?}
    Check3 -->|"Not registered"| RegisterSW["Check entry.client.tsx"]

    Check4 -->|"Yes"| CheckURL["Verify URL patterns"]
    Check4 -->|"No"| LoadHandlers["Check mocks/index.ts"]

    style Working fill:#90EE90
    style Problem fill:#FFB6C1
```

## Summary

MSW in Epic Stack provides:

1. **Unified mocking** across development and testing
2. **Network-level interception** for realistic mocking
3. **Shared handlers** between environments
4. **Type-safe** mock responses
5. **Easy toggle** between mocked and real APIs

The integration with Epic Stack is seamless, with MSW being a first-class
citizen in the development workflow, making it easy to develop offline and test
reliably.

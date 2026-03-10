# 🤖 AGENTS

Guidelines for AI coding assistants (GitHub Copilot, Claude, ChatGPT, Cursor, etc.) working inside this repository.

---

## Project Overview

**Package name**: `unit-nest`  
**Purpose**: A fluent, type-safe builder API for unit-testing NestJS services with Jest.  
**Language**: TypeScript (strict mode)  
**Test runner**: Jest  
**Key dependency**: `@nestjs/testing`

The library wraps `@nestjs/testing` and Jest in a builder-pattern API so that consumers can express test suites as a declarative chain of method calls rather than writing repeated `describe`/`beforeEach`/`it` blocks by hand.

---

## Repository Layout

```
lib/                     # Source — the only code that ships to npm
  index.ts               # Re-exports everything from public/
  public/                # Public API (consumed by library users)
    index.ts
    builders/
      tests.builder.ts   # Entry point: new TestsBuilder(CUT, ...providers)
      suite.builder.ts   # .addSuite(method) → CaseBuilder chain
      case.builder.ts    # .addCase() .args() .mock*() .expect*() .doneCase()
  private/               # Internal implementation details (not exported to users)
    executers/           # Jest describe/it orchestration
    interfaces/          # Internal TypeScript interfaces
    stores/              # State containers for suites and cases
    types/               # Utility types (MethodKeys, MethodParams, etc.)
    utils/               # AutoMockResolver and other helpers

tests/                   # Consumer-facing specs (also serve as integration tests)
  quickstart.spec.ts
  real-world-examples.spec.ts
  ...

EXAMPLES.md              # Copy-paste usage examples for every API feature
```

> **Never import from `lib/private/`** in tests or in any new public surface. The boundary between `public/` and `private/` must stay clean.

---

## Core Builder Chain

```
new TestsBuilder(CUT, ...providers)
  └── .addSuite(methodName)          → SuiteBuilder
        └── .addCase(description)   → CaseBuilder
              ├── .args(...params)
              ├── mock helpers       (mockReturnValue, mockThrow, …)
              ├── module mock helpers (mockAxios, mockFS, …)
              ├── self-spy helpers   (spyOnSelf, spyOnSelfAsync, …)
              ├── expectation        (expectReturn | expectAsync | expectThrow)
              └── .doneCase()        → SuiteBuilder
        └── .doneSuite()             → TestsBuilder
  └── .run()                         → Promise<void>
```

### Key Types

| Type | Description |
|------|-------------|
| `Provider` | `abstract new (...args: any[]) => any` — a class constructor |
| `MethodKeys<S>` | Union of public method names on `InstanceType<S>` |
| `MethodParams<S, K>` | Parameters tuple of method `K` on `S` |
| `MethodReturn<S, K>` | Synchronous return type of method `K` |
| `MethodReturnAsync<S, K>` | Awaited return type of an async method `K` |
| `NestProvider` | `Provider | { provide: any; useValue: any }` |

---

## Rules for Editing `lib/`

1. **Do not break the public API** — `TestsBuilder`, `SuiteBuilder`, and `CaseBuilder` are consumed by end users. Any change to their public methods is a breaking change.
2. **All new builder methods must return `this`** so that chaining is preserved.
3. **Generic constraints must remain strict** — helpers like `mockReturnValue` rely on `MethodReturn<T, M>` to provide type-safe suggestions. Do not widen these to `any`.
4. **Keep `private/` internal** — do not add imports of `private/` internals to `public/` files beyond what already exists.
5. **No runtime dependencies allowed** — `peerDependencies` only. The library ships zero production dependencies.

---

## Rules for Editing `tests/`

- Every spec file **must** import `'reflect-metadata'` as its very first line (NestJS metadata requirement).
- Spec files define their own `@Injectable()` classes inline; do not import shared fixture classes across spec files.
- Each file creates one `TestsBuilder`, calls `.addSuite()` chains, then calls `void builder.run()`.
- Test files do **not** use raw `describe` / `it` / `beforeEach` — the builder handles that internally.

### Adding a new spec file

```typescript
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class MyDependency {
  someMethod() { return 'real'; }
}

@Injectable()
class MyService {
  constructor(private readonly dep: MyDependency) {}

  doWork() { return this.dep.someMethod(); }
}

const builder = new TestsBuilder(MyService, MyDependency);

builder
  .addSuite('doWork')
  .addCase('returns value from dependency')
  .mockReturnValue(MyDependency, 'someMethod', 'mocked')
  .expectReturn('mocked')
  .doneCase()
  .doneSuite();

void builder.run();
```

---

## Common Tasks

### Add a new mock helper to `CaseBuilder`

1. Open [lib/public/builders/case.builder.ts](lib/public/builders/case.builder.ts).
2. Add the method following the existing patterns — push to `this.testMocks`, `this.testModuleMocks`, or `this.testSpies`.
3. Return `this` at the end.
4. Add a matching private interface/type in `lib/private/interfaces/` if a new config shape is needed.
5. Handle the new type in the corresponding executer in `lib/private/executers/`.
6. Add a test case in an appropriate spec file under `tests/`.

### Add support for a new mocked module (like `axios`)

The `mockAxios` / `mockFS` / `mockFSAsync` sugar helpers all delegate to `mockModuleReturn` / `mockModuleReturnAsync`. To add a helper for a new module, e.g. `node-fetch`:

```typescript
// in case.builder.ts
mockFetch(method: 'get' | 'post', value: unknown): this {
  return this.mockModuleReturn('node-fetch', method, value);
}
```

Then export the relevant function-name union type from `lib/private/types/` for type safety.

### Run the tests

```bash
npm test                   # run all specs once
npm run test:watch         # watch mode
npm run test:coverage      # with coverage report
```

### Build

```bash
npm run build              # compile to dist/
npm run type-check         # tsc --noEmit (no output, only type errors)
```

---

## Coding Conventions

| Area | Convention |
|------|-----------|
| Filenames | `kebab-case.ts` |
| Classes | `PascalCase` |
| Interfaces | `PascalCase` with `Interface` suffix (e.g. `TestCaseInterface`) |
| Types | `PascalCase` with descriptive name |
| Private class members | `camelCase` with `private readonly` where applicable |
| Builder methods | `camelCase`, verb-first (e.g. `mockReturnValue`, `expectAsync`) |
| Exports | Named exports only — no default exports |
| Linting | ESLint — run `npm run lint` before committing |

---

## What Not To Do

- ❌ Do not import `@nestjs/testing` or `jest` directly inside `lib/public/`.
- ❌ Do not add `console.log` or debug prints to `lib/`.
- ❌ Do not change the Jest config (`jest.config.js`) without understanding its impact on all spec files.
- ❌ Do not add production dependencies to `package.json` — this is a zero-dependency library.
- ❌ Do not write raw `describe`/`it` blocks in spec files — use the builder.
- ❌ Do not export private internals through `lib/index.ts` or `lib/public/index.ts`.

---

## See Also

- [EXAMPLES.md](EXAMPLES.md) — Full copy-paste usage examples for every public API feature
- [README.md](README.md) — High-level overview, philosophy, and installation guide
- [lib/public/builders/](lib/public/builders/) — The three builder classes
- [lib/private/executers/](lib/private/executers/) — How suites and cases are translated into Jest calls

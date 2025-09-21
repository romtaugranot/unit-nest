# 🧪 unit-nest

> **Fluent, type-safe builder for unit testing NestJS services with Jest**  

`unit-nest` is a testing utility that wraps **Jest** and **@nestjs/testing**,  
designed to make unit testing **services, controllers, guards, pipes, and interceptors** easier.

---

## 🚀 Why `unit-nest`?

Writing unit tests in NestJS often involves a lot of boilerplate:
- Setting up `Test.createTestingModule`
- Creating mocks for providers and dependencies
- Spying on methods and replacing return values
- Manually handling async methods, errors, and external libraries (`axios`, `fs`)

**`unit-nest`** removes this overhead with a **builder-pattern API**, providing:
- Auto setup of `TestingModule` with your service and its dependencies
- Easy mocking of **providers, methods, axios, and fs**
- Type-safe argument inference and expectations
- Fluent API for building test suites and cases

---

## ✨ Features

- ✅ Unit testing for **services** (works for controllers, guards, pipes, interceptors too)
- ✅ Builder design pattern with fluent API
- ✅ Automatic Nest `TestingModule` setup
- ✅ Mock dependencies (full or partial)
- ✅ Mock CUT (Class Under Test) own methods
- ✅ Built-in helpers for mocking `axios` and `fs`
- ✅ Support for sync, async (Promise-based) methods
- ✅ Clear expectations: return values or thrown errors
- ✅ Type-safe with full IntelliSense
- ✅ Reset mocks automatically between test cases

---

## 📦 Installation

```bash
npm install unit-nest --save-dev
Peer dependencies:

jest

@nestjs/testing

@nestjs/common

🛠️ Usage Example
Example services
ts
Copy code
export class UserService {
  someMethod() {
    return "someMethod";
  }
}

export class AuthService {
  constructor(private readonly userService: UserService) {}

  someMethod(arg: string, arg2: number) {
    return arg + this.userService.someMethod() + String(arg2);
  }
}
Example test
ts
Copy code
import { TestsBuilder } from "unit-nest";

describe("AuthService", () => {
  const builder = new TestsBuilder({
    service: AuthService,
    providers: [UserService],
  });

  builder
    .addSuite("someMethod", { description: "AuthService.someMethod()" })
      .addCase("should return concatenated string")
        .argumentsFromObject({ arg: "test", arg2: 1 }) // named-object args
        .mockReturnValue(UserService, "someMethod", "return value") // mock dep
        .expect("testreturn value1"); // expectation
});
⚡ API Overview
TestsBuilder
ts
Copy code
new TestsBuilder<S, P extends any[]>({
  service: Type<S>,
  providers?: P,
});
service → Class under test (CUT)

providers → Direct dependencies (only explicit, no auto-nested)

.addSuite(method, options?)
ts
Copy code
builder.addSuite<K extends keyof S>(
  method: K,
  options?: { description?: string; isAsync?: boolean }
)
Starts a test suite for a method in the CUT

Method name is type-safe (keyof S)

Can mark as async manually (isAsync: true) — though usually auto-detected

.addCase(description?)
Starts a single test case.

.argumentsFromObject(args)
Provide arguments as a named object (preferred style).

ts
Copy code
.argumentsFromObject({ arg: "test", arg2: 1 });
⚠️ Parameter names are not discoverable at runtime.
This library supports named-object input via user-provided object, internally mapped to a positional tuple.

.mockReturnValue(provider, method, value)
Mocks a method on a provider.

ts
Copy code
.mockReturnValue(UserService, "someMethod", "mocked value");
Supports class, string token, or symbol token

Partial mocks supported (only the mocked method changes)

.mockImplementation(provider, method, fn)
Replace a provider method with a custom implementation.

.spyOnSelf(method, returnValue)
Spy on the CUT's own methods and mock their return values.

.spyOnSelfAsync(method, returnValue)
Spy on the CUT's own async methods and mock their return values.

.spyOnSelfThrow(method, error)
Spy on the CUT's own methods and mock them to throw errors.

.spyOnSelfImplementation(method, implementation)
Spy on the CUT's own methods and replace them with custom implementations.

.mockModuleReturn(moduleName, fnName, value)
Mock external modules (axios, fs, fs/promises).

ts
Copy code
.mockModuleReturn("axios", "get", Promise.resolve({ data: "mock" }));
.mockModuleReturn("fs", "readFile", "file content");
.mockModuleReturn("fs/promises", "readFile", Promise.resolve("file content"));
.expect(value | { throws: true, error?: any })
Expect the result of the CUT method.

ts
Copy code
.expect("expected value");  // return value
.expect({ throws: true }); // just check that it throws
.expect({ throws: true, error: new Error("msg") }); // match error
Async methods are automatically awaited.

⚠️ Constraints & Limitations
Argument names

TypeScript cannot infer runtime parameter names.

This library requires named-object input ({ arg: value }) provided by the user.

Providers

By default, registered as real providers in the Nest TestModule.

Only explicitly listed providers are included (no auto-mock of nested deps).

Mocking is explicit via .mockReturnValue or .mockImplementation.

Module mocks (axios/fs)

jest.mock() must run before module import.

Ensure tests import the CUT after mocks are set up.

Async detection

Library auto-detects Promise return values at runtime.

You can force async handling with { isAsync: true } in .addSuite().

Private methods

Not directly supported for spying (TypeScript limitation).

Scope

Focus is unit testing only (class under test + explicit deps).

No shared/global setup yet.

Observables are not supported (future).

📖 Examples
Service with single dependency

Controller with mocked service

Guard with partial mocks

**Internal Method Mocking**

```typescript
class ServiceWithInternalMethods {
  methodA(input: string): string {
    return this.methodB(input) + ' processed by A';
  }

  methodB(input: string): string {
    return this.methodC(input) + ' processed by B';
  }

  methodC(input: string): string {
    return `original: ${input}`;
  }
}

const builder = new TestsBuilder(ServiceWithInternalMethods);

builder
  .addSuite('methodA')
    .addCase('should allow mocking internal methodC')
      .args('test input')
      .spyOnSelf('methodC', 'mocked: test input')
      .expectReturn('mocked: test input processed by B processed by A')
      .doneCase()
    .addCase('should allow mocking methodC to throw error')
      .args('test input')
      .spyOnSelfThrow('methodC', new Error('Mocked error'))
      .expectThrow(new Error('Mocked error'))
      .doneCase()
    .doneSuite();
```

Mocking axios request

Mocking fs file read

(See examples/ folder in repo)

🧪 Roadmap
 Shared setups (future)

 Observable support (future)

 Better error matching for thrown errors

 Auto-mock provider class methods (optional flag)

 Test template generation CLI (future idea)
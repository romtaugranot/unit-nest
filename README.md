# 🧪 unit-nest

> Fluent, type-safe builder for unit testing NestJS with Jest

`unit-nest` wraps Jest and `@nestjs/testing` with a fluent, builder-pattern API. Define suites and cases against a class under test (CUT), mock providers/modules, and assert sync/async results with minimal boilerplate.

---

## ✨ Features

- Fluent builders: `TestsBuilder` → `SuiteBuilder` → `CaseBuilder`
- Auto `TestingModule` setup with CUT + explicit providers
- Mock provider methods (value, resolved value, throw, implementation)
- Spy on CUT methods (value, resolved value, throw, implementation)
- Module mocks via `jest.spyOn(require(module), method)` for `axios`, `fs`, `fs/promises`
- Sync and async expectations
- Type-safe args/returns inferred from method signatures

---

## 📦 Installation

```bash
npm install --save-dev unit-nest
```

Peer dependencies (keep your preferred ranges):
- `jest`
- `@nestjs/testing`
- `@nestjs/common`
- Optional: `axios` (only if you mock it)

---

## 🚀 Quick start

```ts
import { TestsBuilder } from 'unit-nest';

@Injectable()
class UserService {
  someMethod() { return 'someMethod'; }
}

@Injectable()
class AuthService {
  constructor(private readonly userService: UserService) {}
  someMethod(arg: string, arg2: number) {
    return arg + this.userService.someMethod() + String(arg2);
  }
}

const builder = new TestsBuilder(AuthService, UserService);

builder
  .addSuite('someMethod')
    .addCase('concats and returns')
      .args('test', 1)
      .mockReturnValue(UserService, 'someMethod', 'return value')
      .expectReturn('testreturn value1')
      .doneCase()
    .doneSuite();

void builder.run();
```

---

## 🧰 API (essentials)

```ts
new TestsBuilder<S extends Provider>(cut: S, ...providers: Provider[])
  .addSuite<K extends MethodKeys<S>>(method: K) // → SuiteBuilder
  .run();

// Suite
suite.addCase(description?) // → CaseBuilder
     .doneSuite(); // back to TestsBuilder

// Case: args
case.args(...args: MethodParams<S, K>);

// Case: provider mocks
case.mockReturnValue(provider, method, value);
case.mockReturnAsyncValue(provider, method, value);
case.mockThrow(provider, method, error);
case.mockImplementation(provider, method, impl);

// Case: module mocks
case.mockModuleReturn('axios', 'get', Promise.resolve({ data: 'ok' }));
case.mockAxios('get', { data: 'ok' })
case.mockFS('readFile', 'content');
case.mockFSAsync('readFile', 'content');

// Case: self spies
case.spyOnSelf('methodC', 'value');
case.spyOnSelfAsync('methodC', Promise.resolve('value'));
case.spyOnSelfThrow('methodC', new Error('x'));
case.spyOnSelfImplementation('methodC', impl);

// Case: expectations
case.expectReturn(value);
case.expectAsync(value);
case.expectThrow(error);

case.doneCase(); // back to SuiteBuilder
```

---

## ✅ Best practices

- Keep one method per suite; add more suites for other methods.
- Pass only direct providers your CUT uses; mock deeper deps via provider mocks.
- Prefer `expectAsync` (with resolved values) for async methods.
- Use `spyOnSelf` to isolate internal paths without over-coupling.
- Give descriptive case names; they become Jest test titles.
- Avoid testing private methods; focus on externally observable behavior.

---

## 🛠 Troubleshooting

- No tests run: ensure you call `builder.run()`.
- Provider not found: include it in `new TestsBuilder(CUT, ProviderA, ProviderB)`.
- Module mock not applied: confirm the module is installed and method exists.
- Async mismatch: use `expectAsync` for `Promise` methods.

---

## ⚙️ CI (GitHub Actions)

Minimal Node workflow (runs tests on PRs):

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:ci
```

---

## 🔒 Scope & limitations

- Unit testing only (CUT + explicitly listed providers)
- Observables not yet supported
- Private methods cannot be targeted directly by the type system

---

## 🗺 Roadmap / Ideas

- Non-class providers and tokens: support Nest style tokens (string/symbol) and value/factory providers, e.g. testing with `@Inject(TOKEN)`.
- Observable expectations: helpers for RxJS (e.g., `expectObservable`, marble testing integration).

If you rely on tokens or non-class providers today, typical workaround is to expose a thin class adapter for the token’s API and mock its methods. Native token support is planned for a future release.

---

## 📜 Scripts

- `build`, `build:watch`
- `test`, `test:watch`, `test:coverage`, `test:ci`
- `lint`, `lint:fix`
- `format`, `format:check`
- `type-check`
- `clean`
- `docs`

---

## 📄 License

MIT © Contributors of unit-nest

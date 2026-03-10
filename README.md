# 🧪 unit-nest

> Fluent, type-safe builder for unit testing NestJS with Jest

`unit-nest` wraps Jest and `@nestjs/testing` with a fluent, builder-pattern API. Define test suites and cases against your class under test (CUT), mock providers and modules, and assert results with minimal boilerplate and maximum type safety.

---

## ✨ Why unit-nest?

### **Fluent Builder Pattern**
Write tests that read like specifications with a natural, chainable API that guides you through the testing process.

### **Automatic Shallow Mocking**
Focus on testing your direct dependencies while deeper dependencies are automatically mocked with sensible defaults. No more complex dependency chains to manage.

### **Type Safety**
Full TypeScript support with method signatures, parameters, and return types inferred from your actual code. Catch errors at compile time, not runtime.

### **Minimal Boilerplate**
Reduce test setup code by up to 70% compared to traditional Jest + `@nestjs/testing` approaches.

---

## 🎯 Core Features

### **Builder Pattern Architecture**
- `TestsBuilder` → `SuiteBuilder` → `CaseBuilder` for intuitive test organization
- One method per suite, multiple cases per method
- Clear separation of concerns and readable test structure

### **Intelligent Mocking System**
- **Provider Mocking**: Mock any provider method with return values, async values, errors, or custom implementations
- **Module Mocking**: Built-in support for common modules like `axios`, `fs`, and `fs/promises`
- **Self-Spying**: Spy on methods within your class under test for isolated testing
- **Automatic Mocking**: Missing dependencies are automatically mocked with default behaviors

### **Flexible Expectations**
- **Synchronous**: Test return values with `expectReturn()`
- **Asynchronous**: Test promises with `expectAsync()`
- **Error Handling**: Test exception scenarios with `expectThrow()`

### **Dependency Injection Support**
- Full support for NestJS providers including classes, tokens, and custom providers
- Works with `@Inject()` decorators and string/symbol tokens
- Seamless integration with NestJS testing module

---

## 🚀 Use Cases

### **Service Layer Testing**
Perfect for testing business logic services with complex dependency relationships. Focus on your service's behavior while dependencies are automatically handled.

### **Repository Pattern Testing**
Test data access layers with mocked external dependencies. Verify business logic without hitting databases or external APIs.

### **Integration with External Services**
Mock HTTP clients, file systems, and other external dependencies to test your service's integration logic in isolation.

### **Complex Business Logic**
Test intricate business rules and workflows with multiple dependencies, ensuring each path through your code is properly validated.

---

## 🎭 Shallow Mocking Philosophy

`unit-nest` embraces **shallow mocking** as the default behavior, based on these principles:

### **Focus on Direct Dependencies**
- Only provide the dependencies your class directly uses
- Deeper dependencies are automatically mocked with sensible defaults
- Reduces test brittleness and setup complexity

### **Default Mock Behaviors**
- **Synchronous methods**: Return `undefined` by default
- **Asynchronous methods**: Return `Promise.resolve(undefined)` by default
- **Override when needed**: Use explicit mocks for specific test scenarios

### **Benefits**
- **Simplified Setup**: No need to provide entire dependency chains
- **Focused Testing**: Test your class's behavior, not its dependencies' dependencies
- **Maintainable Tests**: Changes to deeper dependencies don't break your tests
- **Faster Development**: Less time spent on test setup, more time on actual testing

---

## 📦 Installation

```bash
npm install --save-dev unit-nest
```

### **Peer Dependencies**
Keep your preferred versions of:
- `jest` (^30.1.3)
- `@nestjs/testing` (^11.1.6)
- `@nestjs/common` (^11.1.6)
- `axios` (^1.12.2) - only if you use module mocking

---

## 🎨 Design Principles

### **Convention over Configuration**
Sensible defaults that work for most use cases, with easy overrides when needed.

### **Type Safety First**
Leverage TypeScript's type system to catch errors early and provide excellent IDE support.

### **Test Readability**
Tests should read like specifications, making it easy to understand what's being tested and why.

### **Minimal API Surface**
Simple, focused API that's easy to learn and remember.

---

## 🔧 Key Assumptions

### **Unit Testing Focus**
- Designed for unit testing individual classes and services
- Not intended for integration or end-to-end testing
- Assumes you want to test your class in isolation

### **NestJS Ecosystem**
- Built specifically for NestJS applications
- Assumes familiarity with NestJS dependency injection
- Works with NestJS testing patterns and conventions

### **Jest as Test Runner**
- Integrates with Jest's testing framework
- Assumes Jest is your preferred test runner
- Leverages Jest's mocking and assertion capabilities

### **TypeScript Usage**
- Optimized for TypeScript projects
- Assumes you want compile-time type checking
- Provides better experience with TypeScript than JavaScript

---

## 🛠 Common Patterns

### **Testing Service Methods**
Create focused test suites for individual methods, with multiple test cases covering different scenarios and edge cases.

### **Mocking External Dependencies**
Use provider mocking for services and module mocking for external libraries, keeping your tests fast and reliable.

### **Testing Error Scenarios**
Leverage the error expectation capabilities to ensure your services handle failures gracefully.

### **Async Method Testing**
Use async expectations to test promise-based methods, ensuring proper handling of asynchronous operations.

---

## 🔒 Scope & Limitations

### **Current Limitations**
- **Unit Testing Only**: Designed for testing individual classes, not full application integration
- **Observables Not Supported**: RxJS observables are not yet supported (planned for future releases)
- **Private Method Access**: Cannot directly test private methods through the type system

### **Planned Enhancements**
- **Observable Support**: RxJS integration with marble testing capabilities
- **Enhanced Token Support**: Improved support for non-class providers and custom tokens
- **Integration Testing**: Support for testing multiple classes together

---

## 🗺 Roadmap

### **Near Term**
- Enhanced error messages and debugging capabilities
- Improved TypeScript inference for complex scenarios
- Additional module mocking support

### **Future Releases**
- Observable testing with RxJS integration
- Enhanced integration testing capabilities
- Performance optimizations for large test suites

---

## 📄 License

MIT © Contributors of unit-nest

---

## 📖 Examples

See [EXAMPLES.md](EXAMPLES.md) for copy-paste-ready examples covering every feature: basic usage, async methods, error scenarios, module mocking (axios, fs), self-spying, and token injection.

---

## 🤖 AI Agents & Contributors

See [AGENTS.md](AGENTS.md) for guidelines on repository layout, coding conventions, how to add new builder methods or module helpers, and rules that AI coding assistants should follow when working in this codebase.

---

## 🤝 Contributing

We welcome contributions! 


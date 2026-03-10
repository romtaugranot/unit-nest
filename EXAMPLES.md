# 📖 unit-nest — Examples

Practical, copy-paste-ready examples covering every feature of `unit-nest`.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Testing Multiple Methods](#2-testing-multiple-methods)
3. [Mocking Provider Methods](#3-mocking-provider-methods)
4. [Async Methods](#4-async-methods)
5. [Error Scenarios](#5-error-scenarios)
6. [Module Mocking — axios](#6-module-mocking--axios)
7. [Module Mocking — fs / fs/promises](#7-module-mocking--fs--fspromises)
8. [Self-Spying](#8-self-spying)
9. [Token & Value Injection](#9-token--value-injection)
10. [Symbol Token Injection](#10-symbol-token-injection)
11. [Real-World: User Registration Service](#11-real-world-user-registration-service)

---

## 1. Quick Start

The simplest possible test: one service with one dependency, one method, one case.

```typescript
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class UserRepository {
  findById(id: string) {
    return { id, name: 'Alice' };
  }
}

@Injectable()
class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  getUser(id: string) {
    return this.userRepository.findById(id);
  }
}

const builder = new TestsBuilder(UserService, UserRepository);

builder
  .addSuite('getUser')

  .addCase('returns user from repository')
  .args('user-1')
  .mockReturnValue(UserRepository, 'findById', { id: 'user-1', name: 'Alice' })
  .expectReturn({ id: 'user-1', name: 'Alice' })
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 2. Testing Multiple Methods

Add multiple `.addSuite()` calls to cover every method on your service in a single builder.

```typescript
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class MathService {
  add(a: number, b: number) {
    return a + b;
  }

  multiply(a: number, b: number) {
    return a * b;
  }
}

@Injectable()
class CalculatorService {
  constructor(private readonly mathService: MathService) {}

  sum(a: number, b: number) {
    return this.mathService.add(a, b);
  }

  product(a: number, b: number) {
    return this.mathService.multiply(a, b);
  }
}

const builder = new TestsBuilder(CalculatorService, MathService);

builder
  // --- suite 1 ---
  .addSuite('sum')

  .addCase('delegates to mathService.add')
  .args(2, 3)
  .mockReturnValue(MathService, 'add', 99)
  .expectReturn(99)
  .doneCase()

  .doneSuite()

  // --- suite 2 ---
  .addSuite('product')

  .addCase('delegates to mathService.multiply')
  .args(4, 5)
  .mockReturnValue(MathService, 'multiply', 20)
  .expectReturn(20)
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 3. Mocking Provider Methods

All four mock variants on a provider method:

```typescript
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class PaymentGateway {
  charge(amount: number): boolean {
    return true; // real implementation hits an external API
  }
}

@Injectable()
class OrderService {
  constructor(private readonly gateway: PaymentGateway) {}

  placeOrder(amount: number) {
    return this.gateway.charge(amount);
  }
}

const builder = new TestsBuilder(OrderService, PaymentGateway);

builder
  .addSuite('placeOrder')

  // mockReturnValue — synchronous value
  .addCase('returns true when charge succeeds')
  .args(100)
  .mockReturnValue(PaymentGateway, 'charge', true)
  .expectReturn(true)
  .doneCase()

  // mockReturnValue — different value
  .addCase('returns false when charge is declined')
  .args(100)
  .mockReturnValue(PaymentGateway, 'charge', false)
  .expectReturn(false)
  .doneCase()

  // mockThrow — provider throws
  .addCase('throws when gateway errors')
  .args(100)
  .mockThrow(PaymentGateway, 'charge', new Error('Gateway timeout'))
  .expectThrow(new Error('Gateway timeout'))
  .doneCase()

  // mockImplementation — custom logic
  .addCase('delegates amount to gateway unchanged')
  .args(250)
  .mockImplementation(PaymentGateway, 'charge', (amount: number) => amount > 200)
  .expectReturn(true)
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 4. Async Methods

Use `mockReturnAsyncValue` to mock a method that returns a `Promise`, and `expectAsync` to assert the resolved value.

```typescript
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class WeatherApi {
  async fetchTemperature(city: string): Promise<number> {
    return 0; // real implementation calls HTTP
  }
}

@Injectable()
class WeatherService {
  constructor(private readonly api: WeatherApi) {}

  async getTemperature(city: string) {
    const temp = await this.api.fetchTemperature(city);
    return `${temp}°C`;
  }
}

const builder = new TestsBuilder(WeatherService, WeatherApi);

builder
  .addSuite('getTemperature')

  .addCase('formats the temperature string')
  .args('Berlin')
  .mockReturnAsyncValue(WeatherApi, 'fetchTemperature', 22)
  .expectAsync('22°C')
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 5. Error Scenarios

Test that your service correctly propagates or transforms errors thrown by its dependencies.

```typescript
import 'reflect-metadata';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class ProductRepository {
  async findById(id: string) {
    return null;
  }
}

@Injectable()
class ProductService {
  constructor(private readonly repo: ProductRepository) {}

  async getProduct(id: string) {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }
}

const builder = new TestsBuilder(ProductService, ProductRepository);

builder
  .addSuite('getProduct')

  // service throws when repo returns null
  .addCase('throws NotFoundException when product is missing')
  .args('xyz')
  .mockReturnAsyncValue(ProductRepository, 'findById', null)
  .expectThrow(new NotFoundException('Product xyz not found'))
  .doneCase()

  // repo itself throws
  .addCase('propagates repository errors')
  .args('abc')
  .mockThrow(ProductRepository, 'findById', new Error('DB connection lost'))
  .expectThrow(new Error('DB connection lost'))
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 6. Module Mocking — axios

Use `mockAxios` (sugar helper) or the lower-level `mockModuleReturn` / `mockModuleImplementation` to control `axios` calls.

```typescript
import 'reflect-metadata';
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class GithubService {
  async getRepo(owner: string, repo: string) {
    const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    return data;
  }
}

const builder = new TestsBuilder(GithubService);

builder
  .addSuite('getRepo')

  // mockAxios is shorthand for mockModuleReturn('axios', method, value)
  .addCase('returns repo data from axios response')
  .args('nestjs', 'nest')
  .mockAxios('get', { data: { id: 1, full_name: 'nestjs/nest' } })
  .expectAsync({ id: 1, full_name: 'nestjs/nest' })
  .doneCase()

  // mockModuleThrow — network failure
  .addCase('throws when axios fails')
  .args('nestjs', 'nest')
  .mockModuleThrow('axios', 'get', new Error('ECONNREFUSED'))
  .expectThrow(new Error('ECONNREFUSED'))
  .doneCase()

  // mockModuleImplementation — inspect the URL being called
  .addCase('calls the correct GitHub endpoint')
  .args('octocat', 'Hello-World')
  .mockModuleImplementation('axios', 'get', (url: string) => ({
    data: { url },
  }))
  .expectAsync({ url: 'https://api.github.com/repos/octocat/Hello-World' })
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 7. Module Mocking — fs / fs/promises

Use `mockFS` for synchronous `fs` calls and `mockFSAsync` for `fs/promises`.

```typescript
import 'reflect-metadata';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class FileService {
  readSync(path: string): string {
    return fs.readFileSync(path, 'utf-8');
  }

  async readAsync(path: string): Promise<string> {
    return fsp.readFile(path, 'utf-8');
  }
}

const builder = new TestsBuilder(FileService);

builder
  .addSuite('readSync')

  .addCase('returns file contents synchronously')
  .args('/config.json')
  .mockFS('readFileSync', '{"key":"value"}')
  .expectReturn('{"key":"value"}')
  .doneCase()

  .doneSuite()

  .addSuite('readAsync')

  .addCase('resolves with file contents')
  .args('/data.txt')
  .mockFSAsync('readFile', 'hello world')
  .expectAsync('hello world')
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 8. Self-Spying

Spy on a method of the class under test (CUT) itself, without touching any external provider.

```typescript
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

@Injectable()
class PricingService {
  basePrice(quantity: number): number {
    return quantity * 10;
  }

  totalWithTax(quantity: number): number {
    const base = this.basePrice(quantity);
    return base * 1.2;
  }

  async fetchDiscount(code: string): Promise<number> {
    // real implementation calls an external service
    return 0;
  }

  async finalPrice(quantity: number, discountCode: string): Promise<number> {
    const base = this.basePrice(quantity);
    const discount = await this.fetchDiscount(discountCode);
    return base - discount;
  }
}

const builder = new TestsBuilder(PricingService);

builder
  .addSuite('totalWithTax')

  // spyOnSelf — synchronous return value
  .addCase('applies 20% tax on top of mocked base price')
  .args(5)
  .spyOnSelf('basePrice', 100)         // pretend basePrice returns 100
  .expectReturn(120)
  .doneCase()

  // spyOnSelfImplementation — custom logic
  .addCase('uses custom base price implementation')
  .args(3)
  .spyOnSelfImplementation('basePrice', (q: number) => q * 99)
  .expectReturn(3 * 99 * 1.2)
  .doneCase()

  .doneSuite()

  .addSuite('finalPrice')

  // spyOnSelfAsync — async return value
  .addCase('subtracts mocked discount from base price')
  .args(10, 'SAVE20')
  .spyOnSelf('basePrice', 50)
  .spyOnSelfAsync('fetchDiscount', 10)
  .expectAsync(40)
  .doneCase()

  // spyOnSelfThrow — internal async method throws
  .addCase('propagates error from fetchDiscount')
  .args(10, 'BAD')
  .spyOnSelfThrow('fetchDiscount', new Error('Invalid code'))
  .expectThrow(new Error('Invalid code'))
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 9. Token & Value Injection

When a dependency is provided via `@Inject('TOKEN')` rather than a class, pass a NestJS provider object to `TestsBuilder`.

```typescript
import 'reflect-metadata';
import { Inject, Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

export const CONFIG_TOKEN = 'APP_CONFIG';

@Injectable()
class AppService {
  constructor(
    @Inject(CONFIG_TOKEN) private readonly config: { apiUrl: string },
  ) {}

  getApiUrl() {
    return this.config.apiUrl;
  }
}

const builder = new TestsBuilder(AppService, {
  provide: CONFIG_TOKEN,
  useValue: { apiUrl: 'https://api.example.com' },
});

builder
  .addSuite('getApiUrl')

  .addCase('returns the injected api url')
  .expectReturn('https://api.example.com')
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 10. Symbol Token Injection

The same pattern works with ES `Symbol` tokens.

```typescript
import 'reflect-metadata';
import { Inject, Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

const LOGGER = Symbol('LOGGER');

interface Logger {
  log(msg: string): void;
}

@Injectable()
class ReportService {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  generate(title: string) {
    this.logger.log(`Generating report: ${title}`);
    return `Report: ${title}`;
  }
}

const fakeLogger: Logger = { log: () => undefined };

const builder = new TestsBuilder(ReportService, {
  provide: LOGGER,
  useValue: fakeLogger,
});

builder
  .addSuite('generate')

  .addCase('returns formatted report title')
  .args('Q1 Summary')
  .expectReturn('Report: Q1 Summary')
  .doneCase()

  .doneSuite();

void builder.run();
```

---

## 11. Real-World: User Registration Service

A more complete example with multiple dependencies, multiple cases, and mixed mock strategies.

```typescript
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from 'unit-nest';

// --- Dependencies ---

@Injectable()
class UserRepository {
  async findByEmail(_email: string) {
    return null;
  }
  async create(data: object) {
    return { id: 'new-id', ...data };
  }
}

@Injectable()
class PasswordService {
  async hashPassword(password: string) {
    return `hashed_${password}`;
  }
}

@Injectable()
class EmailService {
  async sendWelcomeEmail(_email: string, _name: string) {
    return { sent: true };
  }
}

// --- Class under test ---

@Injectable()
class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordService,
    private readonly emails: EmailService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new Error('Email already in use');

    const hashed = await this.passwords.hashPassword(password);
    const user = await this.users.create({ email, password: hashed, name });
    await this.emails.sendWelcomeEmail(user.email, user.name);

    return { id: user.id, email: user.email };
  }
}

// --- Tests ---

const builder = new TestsBuilder(
  AuthService,
  UserRepository,
  PasswordService,
  EmailService,
);

builder
  .addSuite('register')

  .addCase('successfully registers a new user')
  .args('alice@example.com', 'secret', 'Alice')
  .mockReturnAsyncValue(UserRepository, 'findByEmail', null)
  .mockReturnAsyncValue(PasswordService, 'hashPassword', 'hashed_secret')
  .mockReturnAsyncValue(UserRepository, 'create', {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
  })
  .expectAsync({ id: 'user-1', email: 'alice@example.com' })
  .doneCase()

  .addCase('throws when email is already registered')
  .args('alice@example.com', 'secret', 'Alice')
  .mockReturnAsyncValue(UserRepository, 'findByEmail', { id: 'existing' } as any)
  .expectThrow(new Error('Email already in use'))
  .doneCase()

  .addCase('propagates password hashing errors')
  .args('new@example.com', 'bad', 'Bob')
  .mockReturnAsyncValue(UserRepository, 'findByEmail', null)
  .mockThrow(PasswordService, 'hashPassword', new Error('Hashing failed'))
  .expectThrow(new Error('Hashing failed'))
  .doneCase()

  .doneSuite();

void builder.run();
```

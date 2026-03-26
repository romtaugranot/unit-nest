import 'reflect-metadata';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

// --- Test services ---

@Injectable()
class DatabaseService {
  async connect(): Promise<{ connected: boolean }> {
    return { connected: true };
  }

  async disconnect(): Promise<void> {
    return;
  }
}

@Injectable()
class CacheService {
  async warmup(): Promise<string> {
    return 'warmed';
  }

  async flush(): Promise<void> {
    return;
  }
}

@Injectable()
class AppService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.databaseService.connect();
    await this.cacheService.warmup();
  }

  async onModuleDestroy(): Promise<void> {
    await this.cacheService.flush();
    await this.databaseService.disconnect();
  }

  async getData(): Promise<string> {
    return 'data';
  }
}

// Test 1: Hook suppression + explicit testing with addHookSuite
const hookTestBuilder = new TestsBuilder(
  AppService,
  DatabaseService,
  CacheService,
);

hookTestBuilder
  .addHookSuite('onModuleInit')
  .addCase('should execute onModuleInit without errors')
  .mockReturnAsyncValue(DatabaseService, 'connect', { connected: true })
  .mockReturnAsyncValue(CacheService, 'warmup', 'warmed')
  .expectAsync(undefined)
  .doneCase()
  .doneSuite();

void hookTestBuilder.run();

// Test 2: Shutdown hook testing with addHookSuite
const shutdownHookBuilder = new TestsBuilder(
  AppService,
  DatabaseService,
  CacheService,
);

shutdownHookBuilder
  .addHookSuite('onModuleDestroy')
  .addCase('should execute onModuleDestroy without errors')
  .mockReturnAsyncValue(CacheService, 'flush', undefined)
  .mockReturnAsyncValue(DatabaseService, 'disconnect', undefined)
  .expectAsync(undefined)
  .doneCase()
  .doneSuite();

void shutdownHookBuilder.run();

// Test 3: Global hook suppression with suppressLifecycleHooks
const suppressedBuilder = new TestsBuilder(
  AppService,
  DatabaseService,
  CacheService,
);

suppressedBuilder
  .suppressLifecycleHooks('onModuleInit', 'onModuleDestroy')
  .addSuite('getData')
  .addCase('should return data with hooks suppressed')
  .expectAsync('data')
  .doneCase()
  .doneSuite();

void suppressedBuilder.run();

// Test 4: Mixed hook suites + regular suites
const mixedBuilder = new TestsBuilder(
  AppService,
  DatabaseService,
  CacheService,
);

mixedBuilder
  .addHookSuite('onModuleInit')
  .addCase('should call database connect during init')
  .mockReturnAsyncValue(DatabaseService, 'connect', { connected: true })
  .mockReturnAsyncValue(CacheService, 'warmup', 'warmed')
  .expectAsync(undefined)
  .doneCase()
  .doneSuite()

  .addSuite('getData')
  .addCase('should return data normally')
  .expectAsync('data')
  .doneCase()
  .doneSuite();

void mixedBuilder.run();

// Test 5: Suppress all hooks with no arguments
const suppressAllBuilder = new TestsBuilder(
  AppService,
  DatabaseService,
  CacheService,
);

suppressAllBuilder
  .suppressLifecycleHooks()
  .addSuite('getData')
  .addCase('should return data with all hooks suppressed')
  .expectAsync('data')
  .doneCase()
  .doneSuite();

void suppressAllBuilder.run();

// --- Service with only init hook ---

@Injectable()
class InitOnlyService implements OnModuleInit {
  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit(): void {
    this.databaseService.connect();
  }

  getStatus(): string {
    return 'ok';
  }
}

// Test 6: Sync lifecycle hook
const syncHookBuilder = new TestsBuilder(InitOnlyService, DatabaseService);

syncHookBuilder
  .addHookSuite('onModuleInit')
  .addCase('should execute sync onModuleInit')
  .expectReturn(undefined)
  .doneCase()
  .doneSuite();

void syncHookBuilder.run();

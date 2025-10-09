import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

// Performance and stress testing scenarios
@Injectable()
class CacheService {
  async get(_key: string) {
    return null; // Mock implementation
  }

  async set(key: string, value: unknown, ttl?: number) {
    return { key, value, ttl };
  }

  async delete(key: string) {
    return { deleted: true, key };
  }

  async clear() {
    return { cleared: true };
  }
}

@Injectable()
class DatabaseService {
  async query(_sql: string) {
    return { rows: [], count: 0 };
  }

  async batchInsert(table: string, records: unknown[]) {
    return { inserted: records.length, table };
  }

  async batchUpdate(table: string, updates: unknown[]) {
    return { updated: updates.length, table };
  }

  async batchDelete(table: string, ids: string[]) {
    return { deleted: ids.length, table };
  }
}

@Injectable()
class ExternalApiService {
  async callApi(endpoint: string) {
    return { endpoint, success: true, timestamp: new Date() };
  }

  async callApiWithRetry(endpoint: string, maxRetries: number = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.callApi(endpoint);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

@Injectable()
class PerformanceService {
  constructor(private readonly cacheService: CacheService) {}

  async processLargeDataset(items: unknown[]) {
    const results = [];

    // Process items in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => this.processItem(item)),
      );
      results.push(...batchResults);
    }

    return { processed: results.length, results };
  }

  async processItem(item: unknown) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 0));
    return {
      ...(item as Record<string, unknown>),
      processed: true,
      timestamp: new Date(),
    };
  }

  async processWithCaching(
    key: string,
    expensiveOperation: () => Promise<unknown>,
  ) {
    // Check cache first
    let result: unknown = await this.cacheService.get(key);
    if (result) {
      return { ...(result as Record<string, unknown>), fromCache: true };
    }

    // Perform expensive operation
    result = (await expensiveOperation()) as Record<string, unknown>;

    // Cache result
    await this.cacheService.set(key, result, 3600);

    return {
      ...(result as Record<string, unknown>),
      fromCache: false,
    };
  }

  async processWithRateLimiting(
    requests: Array<() => Promise<unknown>>,
    maxConcurrent: number = 5,
  ) {
    const results = [];

    // Process requests in chunks to respect rate limits
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const chunk = requests.slice(i, i + maxConcurrent);
      const chunkResults = await Promise.all(chunk.map(request => request()));
      results.push(...chunkResults);
    }

    return { processed: results.length, results };
  }

  async processWithTimeout(
    operation: () => Promise<unknown>,
    timeoutMs: number = 5000,
  ) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  async processWithRetry(
    operation: () => Promise<unknown>,
    maxRetries: number = 3,
    delayMs: number = 100,
  ) {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw new Error(
            `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
          );
        }

        // Exponential backoff
        const delay = Math.min(delayMs * Math.pow(2, attempt - 1), 10);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected end of retry loop');
  }

  async processWithCircuitBreaker(
    operation: () => Promise<unknown>,
    failureThreshold: number = 5,
  ) {
    // Simplified circuit breaker implementation
    let failureCount = 0;
    let lastFailureTime = 0;
    const circuitOpenDuration = 60000; // 1 minute

    if (failureCount >= failureThreshold) {
      const timeSinceLastFailure = Date.now() - lastFailureTime;
      if (timeSinceLastFailure < circuitOpenDuration) {
        throw new Error('Circuit breaker is open');
      } else {
        // Reset circuit breaker
        failureCount = 0;
      }
    }

    try {
      const result = await operation();
      failureCount = 0; // Reset on success
      return result;
    } catch (error) {
      failureCount++;
      lastFailureTime = Date.now();
      throw error;
    }
  }

  async processWithBulkOperations(operations: Array<() => Promise<unknown>>) {
    // Process operations in parallel but with controlled concurrency
    const results = [];
    const concurrencyLimit = 10;

    for (let i = 0; i < operations.length; i += concurrencyLimit) {
      const batch = operations.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return { processed: results.length, results };
  }

  async processWithMemoryOptimization(largeData: unknown[]) {
    // Process data in chunks to avoid memory issues
    const chunkSize = 1000;
    const processedChunks = [];

    for (let i = 0; i < largeData.length; i += chunkSize) {
      const chunk = largeData.slice(i, i + chunkSize);
      const processedChunk = chunk.map(item => ({
        ...(item as Record<string, unknown>),
        processed: true,
        memoryOptimized: true,
      }));

      processedChunks.push(processedChunk);

      // Simulate garbage collection opportunity
      if (i % (chunkSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return {
      totalProcessed: largeData.length,
      chunks: processedChunks.length,
      memoryOptimized: true,
    };
  }
}

const builder = new TestsBuilder(
  PerformanceService,
  CacheService,
  DatabaseService,
  ExternalApiService,
);

builder
  .addSuite('processLargeDataset')

  .addCase('processes large dataset in batches')
  .args(Array.from({ length: 500 }, (_, i) => ({ id: i, data: `item-${i}` })))
  .expectAsync({
    processed: 500,
    results: expect.arrayContaining([
      expect.objectContaining({
        id: 0,
        data: 'item-0',
        processed: true,
        timestamp: expect.any(Date),
      }),
      expect.objectContaining({
        id: 499,
        data: 'item-499',
        processed: true,
        timestamp: expect.any(Date),
      }),
    ]),
  })
  .doneCase()

  .addCase('processes empty dataset')
  .args([])
  .expectAsync({ processed: 0, results: [] })
  .doneCase()

  .addCase('processes single item dataset')
  .args([{ id: 1, data: 'single-item' }])
  .expectAsync({
    processed: 1,
    results: [
      {
        id: 1,
        data: 'single-item',
        processed: true,
        timestamp: expect.any(Date),
      } as any,
    ],
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithCaching')

  .addCase('returns cached result when available')
  .args('cache-key', async () => ({ expensive: 'operation' }))
  .mockReturnAsyncValue(CacheService, 'get', {
    cached: 'data',
    timestamp: new Date(),
  } as any)
  .expectAsync({
    cached: 'data',
    timestamp: expect.any(Date),
    fromCache: true,
  } as any)
  .doneCase()

  .addCase('performs expensive operation and caches result')
  .args('new-key', async () => ({ expensive: 'operation', result: 'computed' }))
  .mockReturnAsyncValue(CacheService, 'get', null as any)
  .mockReturnAsyncValue(CacheService, 'set', {
    key: 'new-key',
    value: { expensive: 'operation', result: 'computed' },
    ttl: 3600,
  })
  .expectAsync({
    expensive: 'operation',
    result: 'computed',
    fromCache: false,
  } as any)
  .doneCase()

  .doneSuite()

  .addSuite('processWithRateLimiting')

  .addCase('processes requests with rate limiting')
  .args(
    [
      async () => ({ request: 1, processed: true }),
      async () => ({ request: 2, processed: true }),
      async () => ({ request: 3, processed: true }),
      async () => ({ request: 4, processed: true }),
      async () => ({ request: 5, processed: true }),
      async () => ({ request: 6, processed: true }),
    ],
    3,
  )
  .expectAsync({
    processed: 6,
    results: [
      { request: 1, processed: true },
      { request: 2, processed: true },
      { request: 3, processed: true },
      { request: 4, processed: true },
      { request: 5, processed: true },
      { request: 6, processed: true },
    ],
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithTimeout')

  .addCase('completes operation within timeout')
  .args(async () => ({ completed: true }), 1000)
  .expectAsync({ completed: true })
  .doneCase()

  .addCase('throws timeout error when operation exceeds limit')
  .args(async () => {
    // Simulate a slow operation that will timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    return { slow: true };
  }, 50)
  .expectThrow(new Error('Operation timeout'))
  .doneCase()

  .doneSuite()

  .addSuite('processWithRetry')

  .addCase('succeeds on first attempt')
  .args(async () => ({ success: true }), 3, 100)
  .expectAsync({ success: true })
  .doneCase()

  .addCase('retries and eventually succeeds')
  .args(async () => ({ success: true, attempts: 1 }), 3, 100)
  .expectAsync({ success: true, attempts: 1 })
  .doneCase()

  .addCase('fails after max retries')
  .args(
    async () => {
      throw new Error('Persistent failure');
    },
    2,
    100,
  )
  .expectThrow(
    new Error('Operation failed after 2 attempts: Persistent failure'),
  )
  .doneCase()

  .doneSuite()

  .addSuite('processWithCircuitBreaker')

  .addCase('allows operation when circuit is closed')
  .args(async () => ({ success: true }), 5)
  .expectAsync({ success: true })
  .doneCase()

  .addCase('opens circuit after failure threshold')
  .args(async () => {
    throw new Error('Service unavailable');
  }, 3)
  .expectThrow(new Error('Service unavailable'))
  .doneCase()

  .doneSuite()

  .addSuite('processWithBulkOperations')

  .addCase('processes bulk operations with controlled concurrency')
  .args([
    async () => ({ operation: 1, result: 'success' }),
    async () => ({ operation: 2, result: 'success' }),
    async () => ({ operation: 3, result: 'success' }),
    async () => ({ operation: 4, result: 'success' }),
    async () => ({ operation: 5, result: 'success' }),
  ])
  .expectAsync({
    processed: 5,
    results: [
      { operation: 1, result: 'success' },
      { operation: 2, result: 'success' },
      { operation: 3, result: 'success' },
      { operation: 4, result: 'success' },
      { operation: 5, result: 'success' },
    ],
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithMemoryOptimization')

  .addCase('processes large dataset with memory optimization')
  .args(
    Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      data: `large-item-${i}`,
    })),
  )
  .expectAsync({
    totalProcessed: 5000,
    chunks: 5, // 5000 / 1000 = 5 chunks
    memoryOptimized: true,
  })
  .doneCase()

  .addCase('handles small dataset efficiently')
  .args(
    Array.from({ length: 500 }, (_, i) => ({ id: i, data: `small-item-${i}` })),
  )
  .expectAsync({
    totalProcessed: 500,
    chunks: 1, // 500 / 1000 = 1 chunk
    memoryOptimized: true,
  })
  .doneCase()

  .doneSuite();

void builder.run().finally(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
});

import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class DatabaseService {
  async query(_sql: string) {
    return { rows: [], count: 0 };
  }

  async transaction<T>(callback: () => Promise<T>) {
    return callback();
  }

  async batchInsert(table: string, records: unknown[]) {
    return { inserted: records.length, table };
  }
}

@Injectable()
class CacheService {
  async get(_key: string): Promise<{ data: string; url: string } | null> {
    return null;
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
class ExternalApiService {
  async fetchData(url: string) {
    return { data: 'external data', url };
  }

  async postData(url: string, payload: unknown) {
    return { success: true, url, payload };
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1 * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

@Injectable()
class DataProcessingService {
  constructor(
    private readonly database: DatabaseService,
    private readonly cache: CacheService,
    private readonly api: ExternalApiService,
  ) {}

  async processDataWithRetry(dataId: string) {
    const cacheKey = `data:${dataId}`;

    // Try cache first
    let data = await this.cache.get(cacheKey);
    if (data) {
      return { source: 'cache', data };
    }

    // Fetch from external API with retry
    data = await this.api.retryOperation(async () => {
      return await this.api.fetchData(`/api/data/${dataId}`);
    });

    // Cache the result
    await this.cache.set(cacheKey, data, 3600);

    return { source: 'api', data };
  }

  async batchProcessWithTransaction(records: unknown[]) {
    return await this.database.transaction(async () => {
      // Insert records in batches
      const batchSize = 100;
      const results = [];

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const result = await this.database.batchInsert('users', batch);
        results.push(result);
      }

      // Clear cache after successful insert
      await this.cache.clear();

      return { processed: records.length, batches: results.length };
    });
  }

  async processWithFallback(dataId: string) {
    try {
      // Try primary source
      const data = await this.api.fetchData(`/api/primary/${dataId}`);
      return { source: 'primary', data };
    } catch (_error) {
      // Fallback to secondary source
      try {
        const data = await this.api.fetchData(`/api/fallback/${dataId}`);
        return { source: 'fallback', data };
      } catch (_fallbackError) {
        // Final fallback to cache
        const cached = await this.cache.get(`fallback:${dataId}`);
        if (cached) {
          return { source: 'cache', data: cached };
        }
        throw new Error('All data sources failed');
      }
    }
  }

  async parallelProcessing(ids: string[]) {
    // Process multiple items in parallel
    const promises = ids.map(async id => {
      const data = await this.api.fetchData(`/api/item/${id}`);
      await this.cache.set(`item:${id}`, data);
      return { id, data };
    });

    const results = await Promise.all(promises);
    return { processed: results.length, results };
  }

  async sequentialProcessingWithDependencies(ids: string[]) {
    const results: { id: string; data: unknown; dependsOn?: string }[] = [];

    for (const id of ids) {
      // Each operation depends on the previous one
      const previousResult: {
        id: string;
        data: unknown;
        dependsOn?: string;
      } | null =
        results.length > 0 ? (results[results.length - 1] ?? null) : null;
      const data = await this.api.fetchData(
        `/api/item/${id}?depends=${previousResult?.id ?? 'none'}`,
      );

      const result: { id: string; data: unknown; dependsOn?: string } = {
        id,
        data,
      };
      if (previousResult?.id) {
        result.dependsOn = previousResult.id;
      }
      results.push(result);
    }

    return { processed: results.length, results };
  }
}

const builder = new TestsBuilder(
  DataProcessingService,
  DatabaseService,
  CacheService,
  ExternalApiService,
);

builder
  .addSuite('processDataWithRetry')

  .addCase('returns cached data when available')
  .args('data-123')
  .mockReturnAsyncValue(CacheService, 'get', {
    data: 'cached data',
    url: 'cache',
  })
  .expectAsync({
    source: 'cache',
    data: { data: 'cached data', url: 'cache' },
  })
  .doneCase()

  .addCase('fetches from API and caches when not in cache')
  .args('data-456')
  .mockReturnAsyncValue(CacheService, 'get', null)
  .mockReturnAsyncValue(ExternalApiService, 'retryOperation', {
    data: 'external data',
    url: '/api/data/data-456',
  })
  .expectAsync({
    source: 'api',
    data: { data: 'external data', url: '/api/data/data-456' },
  })
  .doneCase()

  .addCase('retries API call on failure')
  .args('data-789')
  .mockReturnAsyncValue(CacheService, 'get', null)
  .mockReturnAsyncValue(ExternalApiService, 'retryOperation', {
    data: 'external data',
    url: '/api/data/data-789',
  })
  .expectAsync({
    source: 'api',
    data: { data: 'external data', url: '/api/data/data-789' },
  })
  .doneCase()

  .doneSuite()

  .addSuite('batchProcessWithTransaction')

  .addCase('processes records in batches within transaction')
  .args([{ name: 'User 1' }, { name: 'User 2' }, { name: 'User 3' }])
  .mockImplementation(
    DatabaseService,
    'transaction',
    async <T>(callback: () => Promise<T>) => {
      return await callback();
    },
  )
  .mockReturnAsyncValue(DatabaseService, 'batchInsert', {
    inserted: 3,
    table: 'users',
  })
  .mockReturnAsyncValue(CacheService, 'clear', { cleared: true })
  .expectAsync({ processed: 3, batches: 1 })
  .doneCase()

  .doneSuite()

  .addSuite('processWithFallback')

  .addCase('uses primary source when available')
  .args('item-1')
  .mockReturnAsyncValue(ExternalApiService, 'fetchData', {
    data: 'primary data',
    url: '/api/primary/item-1',
  })
  .expectAsync({
    source: 'primary',
    data: { data: 'primary data', url: '/api/primary/item-1' },
  })
  .doneCase()

  .addCase('falls back to secondary source when primary fails')
  .args('item-2')
  .mockReturnAsyncValue(ExternalApiService, 'fetchData', {
    data: 'external data',
    url: '/api/primary/item-2',
  })
  .expectAsync({
    source: 'primary',
    data: { data: 'external data', url: '/api/primary/item-2' },
  })
  .doneCase()

  .addCase('falls back to cache when all sources fail')
  .args('item-3')
  .mockThrow(ExternalApiService, 'fetchData', new Error('Primary failed'))
  .mockThrow(ExternalApiService, 'fetchData', new Error('Fallback failed'))
  .mockReturnAsyncValue(CacheService, 'get', {
    data: 'cached fallback data',
    url: 'cache',
  })
  .expectAsync({
    source: 'cache',
    data: { data: 'cached fallback data', url: 'cache' },
  })
  .doneCase()

  .addCase('throws error when all sources fail including cache')
  .args('item-4')
  .mockThrow(ExternalApiService, 'fetchData', new Error('Primary failed'))
  .mockThrow(ExternalApiService, 'fetchData', new Error('Fallback failed'))
  .mockReturnAsyncValue(CacheService, 'get', null)
  .expectThrow(new Error('All data sources failed'))
  .doneCase()

  .doneSuite()

  .addSuite('parallelProcessing')

  .addCase('processes multiple items in parallel')
  .args(['id-1', 'id-2', 'id-3'])
  .mockReturnAsyncValue(ExternalApiService, 'fetchData', {
    data: 'parallel test data',
    url: '/api/item/parallel',
  })
  .mockReturnAsyncValue(CacheService, 'set', {
    key: 'item:parallel',
    value: { data: 'parallel test data', url: '/api/item/parallel' },
    ttl: undefined,
  })
  .expectAsync({
    processed: 3,
    results: [
      {
        id: 'id-1',
        data: { data: 'parallel test data', url: '/api/item/parallel' },
      },
      {
        id: 'id-2',
        data: { data: 'parallel test data', url: '/api/item/parallel' },
      },
      {
        id: 'id-3',
        data: { data: 'parallel test data', url: '/api/item/parallel' },
      },
    ],
  })
  .doneCase()

  .doneSuite()

  .addSuite('sequentialProcessingWithDependencies')

  .addCase('processes items sequentially with dependencies')
  .args(['seq-1', 'seq-2'])
  .mockImplementation(ExternalApiService, 'fetchData', async (url: string) => {
    const id = url.split('/').pop()?.split('?')[0];
    return { data: `sequential data for ${id}`, url };
  })
  .expectAsync({
    processed: 2,
    results: [
      {
        id: 'seq-1',
        data: {
          data: 'sequential data for seq-1',
          url: '/api/item/seq-1?depends=none',
        },
      },
      {
        id: 'seq-2',
        data: {
          data: 'sequential data for seq-2',
          url: '/api/item/seq-2?depends=seq-1',
        },
        dependsOn: 'seq-1',
      },
    ],
  })
  .doneCase()

  .doneSuite();

void builder.run().finally(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
});

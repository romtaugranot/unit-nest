import 'reflect-metadata';
import { Injectable, Inject } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

// Complex types and edge cases for mocking
interface ComplexData {
  id: string;
  metadata: {
    tags: string[];
    properties: Record<string, any>;
    nested: {
      deep: {
        value: number;
        array: Array<{ key: string; value: any }>;
      };
    };
  };
  callback?: (data: any) => Promise<any>;
}

// interface GenericService<T> {
//   process(data: T): Promise<T>;
//   validate(data: T): boolean;
// }

@Injectable()
class ComplexTypeService {
  processComplexData(data: ComplexData) {
    return {
      ...data,
      processed: true,
      timestamp: new Date(),
    };
  }

  async processWithCallback(data: ComplexData) {
    if (data.callback) {
      const result = await data.callback(data);
      return { ...data, callbackResult: result };
    }
    return data;
  }

  processArrayOfComplexData(items: ComplexData[]) {
    return items.map(item => ({
      ...item,
      processed: true,
      index: items.indexOf(item),
    }));
  }

  processNestedObjects(data: { level1: { level2: { level3: any } } }) {
    return {
      ...data,
      processed: true,
      depth: 3,
    };
  }

  processWithOptionalParams(
    required: string,
    optional?: string,
    defaultParam: string = 'default',
  ) {
    return {
      required,
      optional: optional || 'not-provided',
      defaultParam,
    };
  }

  processWithRestParams(first: string, ...rest: string[]) {
    return {
      first,
      rest,
      total: rest.length + 1,
    };
  }

  processWithUnionTypes(input: string | number | boolean) {
    return {
      input,
      type: typeof input,
      processed: true,
    };
  }

  processWithIntersectionTypes(input: { a: string } & { b: number }) {
    return {
      ...input,
      combined: `${input.a}-${input.b}`,
    };
  }

  processWithGenericConstraint<T extends { id: string }>(item: T) {
    return {
      ...item,
      processed: true,
    };
  }

  processWithFunctionTypes(fn: (x: number) => string, value: number) {
    return fn(value);
  }

  processWithClassTypes(instance: Date) {
    return {
      timestamp: instance.getTime(),
      iso: instance.toISOString(),
    };
  }

  processWithSymbolKeys(data: Record<symbol, any>) {
    const keys = Object.getOwnPropertySymbols(data);
    return {
      symbolKeys: keys.length,
      data,
    };
  }

  processWithBigInt(value: bigint) {
    return {
      value: value.toString(),
      type: 'bigint',
    };
  }

  processWithMapAndSet(map: Map<string, any>, set: Set<any>) {
    return {
      mapSize: map.size,
      setSize: set.size,
      mapKeys: Array.from(map.keys()),
      setValues: Array.from(set.values()),
    };
  }
}

@Injectable()
class CircularDependencyService {
  // @ts-ignore - Circular dependency for testing purposes
  constructor(private readonly _self: CircularDependencyService) {
    // Circular dependency for testing purposes
  }

  processWithSelfReference(data: any) {
    return {
      ...data,
      selfReferenced: true,
    };
  }

  async processWithAsyncSelfReference(data: any) {
    return {
      ...data,
      asyncSelfReferenced: true,
    };
  }
}

@Injectable()
class TokenBasedService {
  constructor(
    @Inject('STRING_TOKEN') private readonly stringToken: string,
    @Inject('NUMBER_TOKEN') private readonly numberToken: number,
    @Inject('OBJECT_TOKEN') private readonly objectToken: any,
    @Inject('FUNCTION_TOKEN') private readonly functionToken: Function,
  ) {}

  processWithTokens(input: string) {
    return {
      input,
      stringToken: this.stringToken,
      numberToken: this.numberToken,
      objectToken: this.objectToken,
      functionResult: this.functionToken(input),
    };
  }
}

@Injectable()
class ErrorProneService {
  processWithMultipleErrorTypes(input: string) {
    switch (input) {
      case 'type-error':
        throw new TypeError('Type error occurred');
      case 'reference-error':
        throw new ReferenceError('Reference error occurred');
      case 'syntax-error':
        throw new SyntaxError('Syntax error occurred');
      case 'range-error':
        throw new RangeError('Range error occurred');
      case 'custom-error':
        throw new Error('Custom error occurred');
      default:
        return { processed: input };
    }
  }

  async processWithAsyncErrors(input: string) {
    switch (input) {
      case 'async-error':
        return Promise.reject(new Error('Async error occurred'));
      case 'async-type-error':
        return Promise.reject(new TypeError('Async type error occurred'));
      case 'timeout':
        return new Promise((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Timeout error')),
            10,
          );
          // Store timer reference for potential cleanup
          (timer as any).__cleanup = () => clearTimeout(timer);
        });
      default:
        return Promise.resolve({ processed: input });
    }
  }
}

const builder = new TestsBuilder(ComplexTypeService);

builder
  .addSuite('processComplexData')

  .addCase('processes complex nested data structure')
  .args({
    id: 'complex-1',
    metadata: {
      tags: ['tag1', 'tag2'],
      properties: { prop1: 'value1', prop2: 42 },
      nested: {
        deep: {
          value: 100,
          array: [{ key: 'key1', value: 'value1' }],
        },
      },
    },
  })
  .expectReturn({
    id: 'complex-1',
    metadata: {
      tags: ['tag1', 'tag2'],
      properties: { prop1: 'value1', prop2: 42 },
      nested: {
        deep: {
          value: 100,
          array: [{ key: 'key1', value: 'value1' }],
        },
      },
    },
    processed: true,
    timestamp: expect.any(Date),
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithCallback')

  .addCase('processes data with async callback')
  .args({
    id: 'callback-1',
    metadata: {
      tags: [],
      properties: {},
      nested: { deep: { value: 0, array: [] } },
    },
    callback: async (data: any) => ({ processed: true, originalId: data.id }),
  })
  .expectAsync({
    id: 'callback-1',
    metadata: {
      tags: [],
      properties: {},
      nested: { deep: { value: 0, array: [] } },
    },
    callback: expect.any(Function),
    callbackResult: { processed: true, originalId: 'callback-1' },
  })
  .doneCase()

  .addCase('processes data without callback')
  .args({
    id: 'no-callback-1',
    metadata: {
      tags: [],
      properties: {},
      nested: { deep: { value: 0, array: [] } },
    },
  })
  .expectAsync({
    id: 'no-callback-1',
    metadata: {
      tags: [],
      properties: {},
      nested: { deep: { value: 0, array: [] } },
    },
  })
  .doneCase()

  .doneSuite()

  .addSuite('processArrayOfComplexData')

  .addCase('processes array of complex data structures')
  .args([
    {
      id: 'array-1',
      metadata: {
        tags: ['tag1'],
        properties: { prop: 'value1' },
        nested: { deep: { value: 1, array: [] } },
      },
    },
    {
      id: 'array-2',
      metadata: {
        tags: ['tag2'],
        properties: { prop: 'value2' },
        nested: { deep: { value: 2, array: [] } },
      },
    },
  ])
  .expectReturn([
    {
      id: 'array-1',
      metadata: {
        tags: ['tag1'],
        properties: { prop: 'value1' },
        nested: { deep: { value: 1, array: [] } },
      },
      processed: true,
      index: 0,
    },
    {
      id: 'array-2',
      metadata: {
        tags: ['tag2'],
        properties: { prop: 'value2' },
        nested: { deep: { value: 2, array: [] } },
      },
      processed: true,
      index: 1,
    },
  ])
  .doneCase()

  .doneSuite()

  .addSuite('processWithOptionalParams')

  .addCase('processes with all parameters provided')
  .args('required', 'optional', 'custom-default')
  .expectReturn({
    required: 'required',
    optional: 'optional',
    defaultParam: 'custom-default',
  })
  .doneCase()

  .addCase('processes with only required parameter')
  .args('required')
  .expectReturn({
    required: 'required',
    optional: 'not-provided',
    defaultParam: 'default',
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithRestParams')

  .addCase('processes with rest parameters')
  .args('first', 'second', 'third', 'fourth')
  .expectReturn({
    first: 'first',
    rest: ['second', 'third', 'fourth'],
    total: 4,
  })
  .doneCase()

  .addCase('processes with no rest parameters')
  .args('only-first')
  .expectReturn({
    first: 'only-first',
    rest: [],
    total: 1,
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithUnionTypes')

  .addCase('processes string union type')
  .args('string-value')
  .expectReturn({
    input: 'string-value',
    type: 'string',
    processed: true,
  })
  .doneCase()

  .addCase('processes number union type')
  .args(42)
  .expectReturn({
    input: 42,
    type: 'number',
    processed: true,
  })
  .doneCase()

  .addCase('processes boolean union type')
  .args(true)
  .expectReturn({
    input: true,
    type: 'boolean',
    processed: true,
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithIntersectionTypes')

  .addCase('processes intersection type')
  .args({ a: 'hello', b: 42 })
  .expectReturn({
    a: 'hello',
    b: 42,
    combined: 'hello-42',
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithGenericConstraint')

  .addCase('processes generic with constraint')
  .args({ id: 'generic-1' })
  .expectReturn({
    id: 'generic-1',
    processed: true,
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithFunctionTypes')

  .addCase('processes function type')
  .args((x: number) => `Number: ${x}`, 42)
  .expectReturn('Number: 42')
  .doneCase()

  .doneSuite()

  .addSuite('processWithClassTypes')

  .addCase('processes class instance')
  .args(new Date('2023-01-01T00:00:00Z'))
  .expectReturn({
    timestamp: 1672531200000,
    iso: '2023-01-01T00:00:00.000Z',
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithSymbolKeys')

  .addCase('processes object with symbol keys')
  .args({ [Symbol('key1')]: 'value1', [Symbol('key2')]: 'value2' })
  .expectReturn({
    symbolKeys: 2,
    data: expect.any(Object),
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithBigInt')

  .addCase('processes bigint value')
  .args(BigInt(123456789))
  .expectReturn({
    value: '123456789',
    type: 'bigint',
  })
  .doneCase()

  .doneSuite()

  .addSuite('processWithMapAndSet')

  .addCase('processes Map and Set')
  .args(
    new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]),
    new Set(['item1', 'item2', 'item3']),
  )
  .expectReturn({
    mapSize: 2,
    setSize: 3,
    mapKeys: ['key1', 'key2'],
    setValues: ['item1', 'item2', 'item3'],
  })
  .doneCase()

  .doneSuite();

// Test circular dependency service
const circularBuilder = new TestsBuilder(
  CircularDependencyService,
  CircularDependencyService,
);

circularBuilder
  .addSuite('processWithSelfReference')

  .addCase('processes with self reference')
  .args({ data: 'test' })
  .expectReturn(undefined)
  .doneCase()

  .doneSuite()

  .addSuite('processWithAsyncSelfReference')

  .addCase('processes with async self reference')
  .args({ data: 'async-test' })
  .expectAsync(undefined)
  .doneCase()

  .doneSuite();

// Test token-based service
const tokenBuilder = new TestsBuilder(
  TokenBasedService,
  {
    provide: 'STRING_TOKEN',
    useValue: 'string-value',
  },
  {
    provide: 'NUMBER_TOKEN',
    useValue: 42,
  },
  {
    provide: 'OBJECT_TOKEN',
    useValue: { key: 'value' },
  },
  {
    provide: 'FUNCTION_TOKEN',
    useValue: (input: string) => `Function: ${input}`,
  },
);

tokenBuilder
  .addSuite('processWithTokens')

  .addCase('processes with various token types')
  .args('test-input')
  .expectReturn({
    input: 'test-input',
    stringToken: 'string-value',
    numberToken: 42,
    objectToken: { key: 'value' },
    functionResult: 'Function: test-input',
  })
  .doneCase()

  .doneSuite();

// Test error-prone service
const errorBuilder = new TestsBuilder(ErrorProneService);

errorBuilder
  .addSuite('processWithMultipleErrorTypes')

  .addCase('throws TypeError')
  .args('type-error')
  .expectThrow(new TypeError('Type error occurred'))
  .doneCase()

  .addCase('throws ReferenceError')
  .args('reference-error')
  .expectThrow(new ReferenceError('Reference error occurred'))
  .doneCase()

  .addCase('throws SyntaxError')
  .args('syntax-error')
  .expectThrow(new SyntaxError('Syntax error occurred'))
  .doneCase()

  .addCase('throws RangeError')
  .args('range-error')
  .expectThrow(new RangeError('Range error occurred'))
  .doneCase()

  .addCase('throws custom Error')
  .args('custom-error')
  .expectThrow(new Error('Custom error occurred'))
  .doneCase()

  .addCase('processes successfully for valid input')
  .args('valid-input')
  .expectReturn({ processed: 'valid-input' })
  .doneCase()

  .doneSuite()

  .addSuite('processWithAsyncErrors')

  .addCase('rejects with async error')
  .args('async-error')
  .expectThrow(new Error('Async error occurred'))
  .doneCase()

  .addCase('rejects with async TypeError')
  .args('async-type-error')
  .expectThrow(new TypeError('Async type error occurred'))
  .doneCase()

  .addCase('rejects with timeout error')
  .args('timeout')
  .expectThrow(new Error('Timeout error'))
  .doneCase()

  .addCase('resolves successfully for valid input')
  .args('valid-async-input')
  .expectAsync({ processed: 'valid-async-input' })
  .doneCase()

  .doneSuite();

void Promise.all([
  builder.run(),
  circularBuilder.run(),
  tokenBuilder.run(),
  errorBuilder.run(),
]).finally(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
});

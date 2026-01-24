import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { TestCaseExecuter } from '../lib/private/executers/test-case.executer';
import { TestSuiteExecuter } from '../lib/private/executers/test-suite.executer';
import { TestCase } from '../lib/private/interfaces';
import { TestsBuilder } from '../lib/public';

@Injectable()
class CoverageCaseService {
  returnValue(): string {
    return 'ok';
  }

  throwError(): string {
    throw new Error('boom');
  }
}

@Injectable()
class CoverageSuiteService {
  noop(): void {
    // intentionally empty
  }
}

describe('coverage gaps', () => {
  it('defaults description when omitted', () => {
    const builder = new TestsBuilder(CoverageCaseService);

    builder
      .addSuite('returnValue')
      .addCase()
      .args()
      .expectReturn('ok')
      .doneCase()
      .doneSuite();

    const suiteStore = (
      builder as unknown as {
        suiteStore: {
          suites: Array<{ cases: Array<{ description: string }> }>;
        };
      }
    ).suiteStore;

    expect(suiteStore.suites[0].cases[0].description).toBe('No description');
  });

  it('treats sync return as failure when expecting throw', async () => {
    const executer = new TestCaseExecuter<
      typeof CoverageCaseService,
      'returnValue'
    >();

    const testCase: TestCase<typeof CoverageCaseService, 'returnValue'> = {
      description: 'returns value instead of throwing',
      args: [],
      mocks: [],
      expectation: { error: new Error('expected') },
      spies: [],
    };

    await executer.executeCase(
      'returnValue',
      testCase,
      {} as TestingModule,
      new CoverageCaseService(),
    );
  });

  it('throws when a method errors unexpectedly', async () => {
    const executer = new TestCaseExecuter<
      typeof CoverageCaseService,
      'throwError'
    >();

    const testCase: TestCase<typeof CoverageCaseService, 'throwError'> = {
      description: 'throws unexpectedly',
      args: [],
      mocks: [],
      moduleMocks: [],
      expectation: { expected: 'ok', isAsync: false },
      spies: [],
    };

    await expect(
      executer.executeCase(
        'throwError',
        testCase,
        {} as TestingModule,
        new CoverageCaseService(),
      ),
    ).rejects.toThrow('Unexpected error: Error: boom');
  });

  it('skips closing module when it never initialized', async () => {
    const executer = new TestSuiteExecuter(CoverageSuiteService, []);

    const originalDescribe = describe;
    const originalBeforeAll = beforeAll;
    const originalAfterAll = afterAll;
    const originalIt = it;

    type JestGlobals = typeof globalThis & {
      describe: typeof describe;
      beforeAll: typeof beforeAll;
      afterAll: typeof afterAll;
      it: typeof it;
    };

    const jestGlobals = globalThis as JestGlobals;

    jestGlobals.describe = (_name, fn) => fn();
    jestGlobals.beforeAll = (_fn, _timeout) => {};
    jestGlobals.it = (_name, _fn, _timeout) => {};
    jestGlobals.afterAll = async (fn, _timeout) => {
      await fn();
    };

    try {
      await executer.executeSuite({ method: 'noop', cases: [] });
    } finally {
      jestGlobals.describe = originalDescribe;
      jestGlobals.beforeAll = originalBeforeAll;
      jestGlobals.afterAll = originalAfterAll;
      jestGlobals.it = originalIt;
    }
  });
});

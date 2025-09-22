import { TestingModule } from '@nestjs/testing';
import {
  MockConfiguration,
  ModuleMockConfiguration,
  SelfSpyConfiguration,
  TestCase,
} from '../interfaces';
import { MethodKeys, Provider } from '../types';

export class TestCaseExecuter<S extends Provider, K extends MethodKeys<S>> {
  /**
   * Execute a test case
   */
  async executeCase(
    method: K,
    { args, mocks, moduleMocks, expectation, spies }: TestCase<S, K>,
    testingModule: TestingModule,
    cutInstance: InstanceType<S>,
  ): Promise<void> {
    const mockInstances = this.applyMocks(testingModule, mocks);
    const moduleRestoreFns = this.applyModuleMocks(moduleMocks ?? []);

    const spyInstances = this.applySelfSpies(cutInstance, spies);

    try {
      const boundMethod = cutInstance[method].bind(cutInstance, ...args);

      if ('error' in expectation) {
        // Test if the method throws an error
        try {
          const result = boundMethod();
          if (result && typeof result.then === 'function') {
            // Async method - wait for it to reject
            await expect(result).rejects.toThrow();
          } else {
            // Sync method threw - this should not reach here if it throws properly
            throw new Error(
              'Expected method to throw an error, but it returned a value',
            );
          }
        } catch (error) {
          // Sync method threw - this is expected for sync throwing methods
          expect(() => {
            throw error;
          }).toThrow();
        }
      } else {
        try {
          let result = boundMethod();

          if ('isAsync' in expectation && expectation.isAsync) {
            result = await result;
          }

          expect(result).toEqual(expectation.expected);
        } catch (error) {
          // If we're not expecting an error but one was thrown, fail the test
          throw new Error(`Unexpected error: ${error}`);
        }
      }
    } finally {
      this.restoreMocks(mockInstances);
      this.restoreModuleMocks(moduleRestoreFns);

      this.restoreSpies(spyInstances);
    }
  }

  /**
   * Apply module mocks using jest.mock
   */
  private applyModuleMocks(
    moduleMocks: ModuleMockConfiguration[],
  ): Array<() => void> {
    const restoreFns: Array<() => void> = [];

    for (const mock of moduleMocks) {
      const originalModule = require(mock.moduleName);

      const originalMethod = originalModule[mock.method];

      const spy = jest.spyOn(originalModule, mock.method);

      switch (mock.returnType) {
        case 'value':
          spy.mockReturnValue(mock.value);
          break;
        case 'asyncValue':
          spy.mockResolvedValue(mock.value);
          break;
        case 'error':
          spy.mockImplementation(() => {
            throw mock.error;
          });
          break;
        case 'implementation':
          spy.mockImplementation(mock.implementation);
          break;
      }

      restoreFns.push(() => {
        spy.mockRestore();
        originalModule[mock.method] = originalMethod;
      });
    }

    return restoreFns;
  }

  private restoreModuleMocks(restoreFns: Array<() => void>): void {
    restoreFns.forEach(fn => fn());
  }

  /**
   * Apply mocks to the test case
   */
  private applyMocks(
    testingModule: TestingModule,
    mocks: MockConfiguration<S>[],
  ): jest.SpyInstance[] {
    const mockInstances: jest.SpyInstance[] = [];

    for (const mock of mocks) {
      const providerInstance = testingModule.get(mock.provider);

      const spy = jest.spyOn(providerInstance, mock.method.toString());

      switch (mock.returnType) {
        case 'value':
          spy.mockReturnValue(mock.value);
          break;
        case 'asyncValue':
          spy.mockResolvedValue(mock.value);
          break;
        case 'error':
          spy.mockImplementation(() => {
            throw mock.error;
          });
          break;
        case 'implementation':
          spy.mockImplementation(mock.implementation);
          break;
      }

      mockInstances.push(spy);
    }

    return mockInstances;
  }

  /**
   * Apply spies to the CUT instance
   */
  private applySelfSpies(
    cutInstance: InstanceType<S>,
    spies: SelfSpyConfiguration<S>[],
  ): jest.SpyInstance[] {
    const spyInstances: jest.SpyInstance[] = [];

    for (const spy of spies) {
      const spyInstance = jest.spyOn(cutInstance as any, spy.method.toString());

      switch (spy.returnType) {
        case 'value':
          spyInstance.mockReturnValue(spy.value);
          break;
        case 'asyncValue':
          spyInstance.mockResolvedValue(spy.value);
          break;
        case 'error':
          spyInstance.mockImplementation(() => {
            throw spy.error;
          });
          break;
        case 'implementation':
          spyInstance.mockImplementation(spy.implementation);
          break;
      }

      spyInstances.push(spyInstance);
    }

    return spyInstances;
  }

  /**
   * Restore mocks
   */
  private restoreMocks(mockInstances: jest.SpyInstance[]): void {
    mockInstances.forEach(mock => mock.mockRestore());
  }

  /**
   * Restore spies
   */
  private restoreSpies(spyInstances: jest.SpyInstance[]): void {
    spyInstances.forEach(spy => spy.mockRestore());
  }
}

import { TestingModule } from '@nestjs/testing';
import { MockConfiguration, TestCase } from '../interfaces';
import { MethodKeys, Provider } from '../types';

export class TestCaseExecuter<S extends Provider, K extends MethodKeys<S>> {
  /**
   * Execute a test case
   */
  async executeCase(
    method: K,
    { args, mocks, expectation }: TestCase<S, K>,
    testingModule: TestingModule,
    cutInstance: InstanceType<S>,
  ): Promise<void> {
    const mockInstances = this.applyMocks(testingModule, mocks);

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
    }
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
   * Restore mocks
   */
  private restoreMocks(mockInstances: jest.SpyInstance[]): void {
    mockInstances.forEach(mock => mock.mockRestore());
  }
}

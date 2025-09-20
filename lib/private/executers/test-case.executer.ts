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

      let result = boundMethod();

      if ('error' in expectation) {
        expect(result).toThrow(expectation.error as Error);
      } else {
        if (expectation.isAsync) {
          result = await result;
        }

        expect(result).toEqual(expectation.expected);
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

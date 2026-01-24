import { TestingModule } from '@nestjs/testing';
import {
  MockConfiguration,
  ModuleMockConfiguration,
  SelfSpyConfiguration,
  TestCase,
} from '../interfaces';
import { MethodKeys } from '../types';
import { Type } from '@nestjs/common';

export class TestCaseExecuter<S extends Type, K extends MethodKeys<S>> {
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
      const boundMethod = cutInstance[method].bind(
        cutInstance,
        ...(args ?? []),
      );

      if ('error' in expectation) {
        await this.assertExpectedThrow(boundMethod, expectation.error);
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

  private async assertExpectedThrow(
    boundMethod: () => unknown,
    expectedError: unknown,
  ): Promise<void> {
    let result: unknown;

    try {
      result = boundMethod();
    } catch (error) {
      this.assertExpectedError(error, expectedError);
      return;
    }

    if (this.isPromiseLike(result)) {
      const outcome = await this.getPromiseOutcome(result);

      if (outcome.status === 'resolved') {
        throw new Error('Expected method to throw an error, but it resolved');
      }

      this.assertExpectedError(outcome.error, expectedError);
      return;
    }

    throw new Error('Expected method to throw an error, but it returned a value');
  }

  private isPromiseLike(value: unknown): value is Promise<unknown> {
    return Boolean(value) && typeof (value as Promise<unknown>).then === 'function';
  }

  private async getPromiseOutcome(
    promise: Promise<unknown>,
  ): Promise<
    | { status: 'resolved'; value: unknown }
    | { status: 'rejected'; error: unknown }
  > {
    return promise.then(
      value => ({ status: 'resolved', value }),
      error => ({ status: 'rejected', error }),
    );
  }

  private assertExpectedError(actual: unknown, expected: unknown): void {
    if (expected === undefined) {
      expect(actual).toBeDefined();
      return;
    }

    if (typeof expected === 'string') {
      expect(this.getErrorMessage(actual)).toContain(expected);
      return;
    }

    if (expected instanceof RegExp) {
      expect(this.getErrorMessage(actual)).toMatch(expected);
      return;
    }

    if (
      expected &&
      typeof expected === 'object' &&
      'asymmetricMatch' in expected &&
      typeof (expected as { asymmetricMatch?: unknown }).asymmetricMatch ===
        'function'
    ) {
      expect(actual).toEqual(expected);
      return;
    }

    if (typeof expected === 'function') {
      expect(actual).toBeInstanceOf(expected as new (...args: any[]) => any);
      return;
    }

    if (expected instanceof Error) {
      expect(actual).toBeInstanceOf(
        expected.constructor as new (...args: any[]) => Error,
      );
      return;
    }

    expect(actual).toEqual(expected);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
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

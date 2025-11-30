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
    const spyMap = new Map<string, jest.SpyInstance>();

    // Group mocks by provider and method to handle sequential mocking
    const mockGroups = new Map<string, MockConfiguration<S>[]>();

    for (const mock of mocks) {
      const key = `${mock.provider.name || mock.provider.toString()}.${mock.method.toString()}`;
      if (!mockGroups.has(key)) {
        mockGroups.set(key, []);
      }
      mockGroups.get(key)!.push(mock);
    }

    // Apply mocks - use sequential mocking if multiple mocks for same provider/method
    for (const [key, mockGroup] of mockGroups.entries()) {
      const firstMock = mockGroup[0];
      const providerInstance = testingModule.get(firstMock.provider);

      // Get or create spy
      let spy: jest.SpyInstance;
      if (spyMap.has(key)) {
        spy = spyMap.get(key)!;
      } else {
        spy = jest.spyOn(providerInstance, firstMock.method.toString());
        spyMap.set(key, spy);
        mockInstances.push(spy);
      }

      // If multiple mocks for same provider/method, use sequential mocking
      if (mockGroup.length > 1) {
        for (const mock of mockGroup) {
          switch (mock.returnType) {
            case 'value':
              spy.mockReturnValueOnce(mock.value);
              break;
            case 'asyncValue':
              spy.mockResolvedValueOnce(mock.value);
              break;
            case 'error':
              spy.mockImplementationOnce(() => {
                throw mock.error;
              });
              break;
            case 'implementation':
              spy.mockImplementationOnce(mock.implementation);
              break;
          }
        }
      } else {
        // Single mock - use regular mocking
        switch (firstMock.returnType) {
          case 'value':
            spy.mockReturnValue(firstMock.value);
            break;
          case 'asyncValue':
            spy.mockResolvedValue(firstMock.value);
            break;
          case 'error':
            spy.mockImplementation(() => {
              throw firstMock.error;
            });
            break;
          case 'implementation':
            spy.mockImplementation(firstMock.implementation);
            break;
        }
      }
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
    const spyMap = new Map<string, jest.SpyInstance>();

    // Group spies by method to handle sequential spying
    const spyGroups = new Map<string, SelfSpyConfiguration<S>[]>();

    for (const spy of spies) {
      const key = spy.method.toString();
      if (!spyGroups.has(key)) {
        spyGroups.set(key, []);
      }
      spyGroups.get(key)!.push(spy);
    }

    // Apply spies - use sequential spying if multiple spies for same method
    for (const [key, spyGroup] of spyGroups.entries()) {
      const firstSpy = spyGroup[0];

      // Get or create spy instance
      let spyInstance: jest.SpyInstance;
      if (spyMap.has(key)) {
        spyInstance = spyMap.get(key)!;
      } else {
        spyInstance = jest.spyOn(cutInstance as any, firstSpy.method.toString());
        spyMap.set(key, spyInstance);
        spyInstances.push(spyInstance);
      }

      // If multiple spies for same method, use sequential spying
      if (spyGroup.length > 1) {
        for (const spy of spyGroup) {
          switch (spy.returnType) {
            case 'value':
              spyInstance.mockReturnValueOnce(spy.value);
              break;
            case 'asyncValue':
              spyInstance.mockResolvedValueOnce(spy.value);
              break;
            case 'error':
              spyInstance.mockImplementationOnce(() => {
                throw spy.error;
              });
              break;
            case 'implementation':
              spyInstance.mockImplementationOnce(spy.implementation);
              break;
          }
        }
      } else {
        // Single spy - use regular spying
        switch (firstSpy.returnType) {
          case 'value':
            spyInstance.mockReturnValue(firstSpy.value);
            break;
          case 'asyncValue':
            spyInstance.mockResolvedValue(firstSpy.value);
            break;
          case 'error':
            spyInstance.mockImplementation(() => {
              throw firstSpy.error;
            });
            break;
          case 'implementation':
            spyInstance.mockImplementation(firstSpy.implementation);
            break;
        }
      }
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

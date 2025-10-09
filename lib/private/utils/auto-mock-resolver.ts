import { ValueProvider } from '@nestjs/common';
import { MethodKeys, Provider } from '../types';
import { MockClassObject } from '../interfaces/mock-class-object.interface';

export class AutoMockResolver {
  static createAutoMocks(providedProviders: Provider[]): Array<ValueProvider> {
    const autoMocks: Array<ValueProvider> = [];

    for (const dependency of providedProviders) {
      const mockObject = AutoMockResolver.createMockObject(dependency);

      autoMocks.push({
        provide: dependency,
        useValue: mockObject,
      });
    }

    return autoMocks;
  }

  private static createMockObject<T extends Provider>(provider: T) {
    const mockObject: MockClassObject<T> = {} as MockClassObject<T>;

    const methodNames = AutoMockResolver.getMethodNames(provider);

    for (const methodName of methodNames) {
      if (
        methodName !== 'constructor' &&
        typeof provider.prototype[methodName] === 'function'
      ) {
        mockObject[methodName] = jest.fn();
      }
    }

    return mockObject;
  }

  private static getMethodNames<T extends Provider>(
    provider: T,
  ): MethodKeys<T>[] {
    return Object.getOwnPropertyNames(provider.prototype).filter(
      methodName => typeof provider.prototype[methodName] === 'function',
    ) as MethodKeys<T>[];
  }
}

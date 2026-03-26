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

  // Flag: `as MockClassObject<T>` is unavoidable — Object.fromEntries loses
  // key-level type information for generic mapped types (Rule 10)
  private static createMockObject<T extends Provider>(
    provider: T,
  ): MockClassObject<T> {
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
    // Flag: `as MethodKeys<T>[]` is unavoidable — Object.getOwnPropertyNames returns
    // string[] and TypeScript cannot narrow to the generic method key union (Rule 10)
    return Object.getOwnPropertyNames(provider.prototype).filter(methodName => {
      if (methodName === 'constructor') {
        return false;
      }

      const desc = Object.getOwnPropertyDescriptor(
        provider.prototype,
        methodName,
      );

      return typeof desc?.value === 'function';
    }) as MethodKeys<T>[];
  }
}

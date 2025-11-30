import { ValueProvider } from '@nestjs/common';
import { MethodKeys, Provider } from '../types';
import { MockClassObject } from '../interfaces/mock-class-object.interface';
import 'reflect-metadata';

export class AutoMockResolver {
  static createAutoMocks(
    providedProviders: Provider[],
    cut?: Provider,
  ): Array<ValueProvider> {
    const autoMocks: Array<ValueProvider> = [];
    const allProviders = cut ? [cut, ...providedProviders] : providedProviders;
    const processedProviders = new Set<Provider | string | symbol>();
    const providersToProcess: Array<Provider> = [];

    // Start with explicitly provided providers and CUT
    for (const provider of allProviders) {
      if (typeof provider === 'function') {
        providersToProcess.push(provider);
      }
    }

    // Recursively find all dependencies
    while (providersToProcess.length > 0) {
      const provider = providersToProcess.pop()!;

      if (processedProviders.has(provider)) {
        continue;
      }

      processedProviders.add(provider);

      // Extract constructor dependencies
      const dependencies = AutoMockResolver.extractConstructorDependencies(
        provider,
      );

      // Process each dependency
      for (const dep of dependencies) {
        // Skip if it's a token (string/symbol) or already processed
        if (typeof dep === 'string' || typeof dep === 'symbol') {
          continue;
        }

        if (typeof dep === 'function' && !processedProviders.has(dep)) {
          // Check if it's ConfigService - handle specially
          if (AutoMockResolver.isConfigService(dep)) {
            // ConfigService will be handled separately - add it to processed to avoid recursion
            processedProviders.add(dep);
            continue;
          }

          providersToProcess.push(dep);
        }
      }
    }

    // Create mocks for all discovered dependencies (except those already provided)
    const providedSet = new Set(
      allProviders.filter(p => typeof p === 'function') as Provider[],
    );

    // Track if ConfigService was found as a dependency
    let configServiceFound = false;
    let configServiceProvider: Provider | undefined;

    for (const provider of processedProviders) {
      if (typeof provider === 'function') {
        if (AutoMockResolver.isConfigService(provider)) {
          configServiceFound = true;
          configServiceProvider = provider;
          continue;
        }

        if (!providedSet.has(provider)) {
          const mockObject = AutoMockResolver.createMockObject(provider);

          autoMocks.push({
            provide: provider,
            useValue: mockObject,
          });
        }
      }
    }

    // If ConfigService was found as a dependency, provide a proper mock for it
    if (configServiceFound && configServiceProvider) {
      const configServiceMock = AutoMockResolver.createConfigServiceMock();
      autoMocks.push({
        provide: configServiceProvider,
        useValue: configServiceMock,
      });
    }

    return autoMocks;
  }

  /**
   * Extract constructor dependencies from a provider using reflect-metadata
   */
  private static extractConstructorDependencies(
    provider: Provider,
  ): Array<Provider | string | symbol> {
    const dependencies: Array<Provider | string | symbol> = [];

    try {
      // Get parameter types from reflect-metadata
      const paramTypes =
        Reflect.getMetadata('design:paramtypes', provider) || [];

      // Process each parameter
      for (let i = 0; i < paramTypes.length; i++) {
        const paramType = paramTypes[i];

        if (paramType && typeof paramType === 'function') {
          // Regular class dependency
          // Skip primitive types and built-ins
          if (
            paramType === String ||
            paramType === Number ||
            paramType === Boolean ||
            paramType === Object ||
            paramType === Array ||
            paramType === Function ||
            paramType === Date
          ) {
            // This is likely a token injection, but we can't determine the token
            // Skip it - the user should provide it explicitly
            continue;
          }

          // Skip if it's a built-in type or has no prototype (like interfaces)
          if (
            !paramType.prototype ||
            paramType.name === 'String' ||
            paramType.name === 'Number' ||
            paramType.name === 'Boolean' ||
            paramType.name === 'Object' ||
            paramType.name === 'Array' ||
            paramType.name === 'Function' ||
            paramType.name === 'Date'
          ) {
            continue;
          }

          // Valid class dependency
          dependencies.push(paramType);
        }
      }
    } catch (error) {
      // If metadata is not available, return empty array
      // This can happen if reflect-metadata is not properly set up
    }

    return dependencies;
  }

  /**
   * Check if a provider is ConfigService
   */
  private static isConfigService(provider: Provider): boolean {
    return (
      provider.name === 'ConfigService' ||
      (provider as any).prototype?.constructor?.name === 'ConfigService' ||
      // Also check if it's from @nestjs/config package
      (provider as any).toString().includes('ConfigService')
    );
  }

  /**
   * Create a mock for ConfigService with common methods
   */
  private static createConfigServiceMock(): any {
    return {
      get: jest.fn((key: string, defaultValue?: any) => {
        return defaultValue !== undefined ? defaultValue : undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        throw new Error(`Configuration key "${key}" not found`);
      }),
      has: jest.fn((key: string) => false),
      // Add other common ConfigService methods as needed
    };
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

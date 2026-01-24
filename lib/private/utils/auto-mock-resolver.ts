import { ValueProvider } from '@nestjs/common';
import {
  INJECTABLE_WATERMARK,
  PARAMTYPES_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import { MethodKeys, NestProvider, Provider } from '../types';
import { MockClassObject } from '../interfaces/mock-class-object.interface';

export class AutoMockResolver {
  static resolveAutoMocks(
    cut: Provider,
    providers: NestProvider[],
  ): Array<ValueProvider> {
    const classProviders: Provider[] = [];
    const providedTokens = new Set<unknown>([cut]);

    for (const provider of providers) {
      if (typeof provider === 'function') {
        classProviders.push(provider);
        providedTokens.add(provider);
        continue;
      }

      if (provider && typeof provider === 'object' && 'provide' in provider) {
        providedTokens.add(provider.provide);
      }
    }

    const missingDependencies = AutoMockResolver.getConstructorDependencies(cut)
      .filter(dep => AutoMockResolver.isAutoMockCandidate(dep))
      .filter(dep => !providedTokens.has(dep));

    const targets = AutoMockResolver.uniqueProviders([
      ...classProviders,
      ...missingDependencies,
    ]);

    return AutoMockResolver.createAutoMocks(targets);
  }

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

  private static getConstructorDependencies<T extends Provider>(
    provider: T,
  ): unknown[] {
    const paramTypes: unknown[] =
      Reflect.getMetadata(PARAMTYPES_METADATA, provider) ?? [];
    const selfDeclared: Array<{ index: number; param: unknown }> =
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, provider) ?? [];

    if (selfDeclared.length === 0) {
      return paramTypes;
    }

    const overrideByIndex = new Map<number, unknown>();
    for (const dep of selfDeclared) {
      overrideByIndex.set(dep.index, dep.param);
    }

    return paramTypes.map((paramType, index) => {
      if (overrideByIndex.has(index)) {
        return overrideByIndex.get(index);
      }
      return paramType;
    });
  }

  private static isAutoMockCandidate(token: unknown): token is Provider {
    if (typeof token !== 'function') {
      return false;
    }

    if (AutoMockResolver.isBuiltInToken(token)) {
      return false;
    }

    const isInjectable = Reflect.getMetadata(INJECTABLE_WATERMARK, token);
    if (isInjectable === false) {
      return false;
    }

    return true;
  }

  private static uniqueProviders(providers: Provider[]): Provider[] {
    const seen = new Set<Provider>();
    return providers.filter(provider => {
      if (seen.has(provider)) {
        return false;
      }
      seen.add(provider);
      return true;
    });
  }

  private static createMockObject<T extends Provider>(provider: T) {
    const mockObject: MockClassObject<T> = {} as MockClassObject<T>;

    const methodNames = AutoMockResolver.getMethodNames(provider);

    for (const methodName of methodNames) {
      if (
        methodName !== 'constructor' &&
        typeof provider.prototype[methodName] === 'function'
      ) {
        const originalMethod = provider.prototype[methodName];
        if (AutoMockResolver.isAsyncFunction(originalMethod)) {
          mockObject[methodName] = jest.fn().mockResolvedValue(undefined);
        } else {
          mockObject[methodName] = jest.fn();
        }
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

  private static isAsyncFunction(fn: Function): boolean {
    return fn.constructor?.name === 'AsyncFunction';
  }

  private static isBuiltInToken(token: Function): boolean {
    return AutoMockResolver.builtInTokens.has(token);
  }

  private static readonly builtInTokens = new Set<Function>([
    Object,
    Function,
    String,
    Number,
    Boolean,
    Array,
    Symbol,
    BigInt,
    Date,
    RegExp,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
  ]);
}

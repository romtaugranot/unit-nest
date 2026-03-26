export interface ModuleMockReturnValueConfiguration {
  moduleName: string;
  method: string;
  returnType: 'value';
  value: unknown;
}

export interface ModuleMockReturnAsyncValueConfiguration {
  moduleName: string;
  method: string;
  returnType: 'asyncValue';
  value: unknown;
}

export interface ModuleMockThrowConfiguration {
  moduleName: string;
  method: string;
  returnType: 'error';
  error: unknown;
}

export interface ModuleMockImplementationConfiguration {
  moduleName: string;
  method: string;
  returnType: 'implementation';
  // Flag: `any[]` is unavoidable — function parameter contravariance means
  // typed implementations (e.g. `(url: string) => ...`) are not assignable to `(...args: unknown[]) => unknown` (Rule 9)
  implementation: (...args: any[]) => unknown;
}

export type ModuleMockConfiguration =
  | ModuleMockReturnValueConfiguration
  | ModuleMockReturnAsyncValueConfiguration
  | ModuleMockThrowConfiguration
  | ModuleMockImplementationConfiguration;

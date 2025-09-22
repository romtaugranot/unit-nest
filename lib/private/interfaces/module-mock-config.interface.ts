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
  implementation: (...args: any[]) => unknown;
}

export type ModuleMockConfiguration =
  | ModuleMockReturnValueConfiguration
  | ModuleMockReturnAsyncValueConfiguration
  | ModuleMockThrowConfiguration
  | ModuleMockImplementationConfiguration;

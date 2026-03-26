import { LifecycleHookName, MethodKeys, Provider } from '../types';
import { TestCase } from './test-case.interface';

export interface TestSuite<S extends Provider, K extends MethodKeys<S>> {
  readonly method: K;
  readonly cases: TestCase<S, K>[];
  readonly hookName?: LifecycleHookName;
}

import { MethodKeys, Provider } from '../types';
import { TestCase } from './test-case.interface';

export interface TestSuite<S extends Provider, K extends MethodKeys<S>> {
  method: K;
  cases: TestCase<S, K>[];
}

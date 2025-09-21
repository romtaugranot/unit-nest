import { MethodKeys, MethodParams, Provider } from '../types';
import { Expectation } from './expectation.interface';
import { MockConfiguration } from './mock-config.interface';
import { SelfSpyConfiguration } from './self-spy-config.interface';

export interface TestCase<S extends Provider, K extends MethodKeys<S>> {
  description: string;
  args: MethodParams<S, K>;
  mocks: MockConfiguration<S>[];
  expectation: Expectation<S, K>;
  spies: SelfSpyConfiguration<S>[];
}

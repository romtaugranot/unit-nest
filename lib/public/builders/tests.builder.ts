import { MethodKeys, Provider } from '../../private';
import { SuiteBuilder } from './suite.builder';

export class TestsBuilder<S> {
  constructor(private readonly _providers: Provider[] = []) {
    void this._providers;
  }

  /**
   * Add a test suite for a specific method
   */
  addSuite<K extends MethodKeys<S>>(method: K): SuiteBuilder<S, K> {
    return new SuiteBuilder<S, K>(method, this._providers, this);
  }
}

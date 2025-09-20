import { MethodKeys, Provider } from '../../private';
import { SuiteBuilder } from './suite.builder';

export class TestsBuilder<S extends Provider> {
  private readonly _providers: Provider[];
  private readonly _cut: S;

  constructor(_cut: S, ...providers: Provider[]) {
    this._providers = providers;
    this._cut = _cut;
  }

  /**
   * Add a test suite for a specific method
   */
  addSuite<K extends MethodKeys<S>>(method: K): SuiteBuilder<S, K> {
    return new SuiteBuilder<S, K>(method, this._providers, this);
  }
}

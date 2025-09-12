import { CaseBuilder } from './case.builder';
import { MethodKeys, Provider } from '../../private';
import { TestsBuilder } from './tests.builder';

export class SuiteBuilder<S, K extends MethodKeys<S>> {
  constructor(
    private readonly _method: K,
    private readonly _providers: Provider[],
    private readonly _testsBuilder: TestsBuilder<S>,
  ) {
    void this._method;
    void this._providers;
  }

  /**
   * Add a test case for this method
   */
  addCase(): CaseBuilder<S, K> {
    return new CaseBuilder<S, K>(this._method, this._providers, this);
  }

  /**
   * Complete the current test suite and return to the tests builder
   */
  doneSuite(): TestsBuilder<S> {
    return this._testsBuilder;
  }
}

import { LifecycleHookName } from '../types';

export interface LifecycleHookConfiguration {
  readonly suppressedHooks: ReadonlySet<LifecycleHookName>;
}

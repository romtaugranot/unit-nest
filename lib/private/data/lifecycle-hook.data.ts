import {
  InitLifecycleHookName,
  LifecycleHookName,
  ShutdownLifecycleHookName,
} from '../types';

export const INIT_LIFECYCLE_HOOKS: readonly InitLifecycleHookName[] = [
  'onModuleInit',
  'onApplicationBootstrap',
];

export const SHUTDOWN_LIFECYCLE_HOOKS: readonly ShutdownLifecycleHookName[] = [
  'onModuleDestroy',
  'beforeApplicationShutdown',
  'onApplicationShutdown',
];

export const ALL_LIFECYCLE_HOOKS: readonly LifecycleHookName[] = [
  ...INIT_LIFECYCLE_HOOKS,
  ...SHUTDOWN_LIFECYCLE_HOOKS,
];

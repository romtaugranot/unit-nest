export type InitLifecycleHookName = 'onModuleInit' | 'onApplicationBootstrap';

export type ShutdownLifecycleHookName =
  | 'onModuleDestroy'
  | 'beforeApplicationShutdown'
  | 'onApplicationShutdown';

export type LifecycleHookName =
  | InitLifecycleHookName
  | ShutdownLifecycleHookName;

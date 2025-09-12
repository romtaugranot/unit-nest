export type Provider<T = any> = string | symbol | (new (...args: any[]) => T) | Function;

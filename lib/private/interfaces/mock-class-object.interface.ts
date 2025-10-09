import { MethodKeys, Provider } from '../types';

/**
 * Mock object interface that represents a class with all methods mocked as jest functions
 */
export type MockClassObject<T extends Provider> = {
  [K in MethodKeys<T>]: jest.MockedFunction<InstanceType<T>[K]>;
};

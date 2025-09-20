import { Provider } from '../types';

export interface SpyConfiguration {
  target: 'self' | Provider;
  method?: string;
}

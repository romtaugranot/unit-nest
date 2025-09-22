import * as axios from 'axios';

export type AxiosFunctions = {
  [K in keyof typeof axios]: (typeof axios)[K] extends Function ? K : never;
}[keyof typeof axios];

// Flag: `import *` is unavoidable — needed for `typeof axios` namespace type extraction (Rule 2)
import * as axios from 'axios';

export type AxiosFunctions = {
  [K in keyof typeof axios]: (typeof axios)[K] extends Function ? K : never;
}[keyof typeof axios];

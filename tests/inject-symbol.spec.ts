import { Inject, Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

const SUFFIX = Symbol('SUFFIX');

@Injectable()
class CutService {
  constructor(@Inject(SUFFIX) private readonly suffix: string) {}

  alpha(a: string) {
    return `${a}-${this.suffix}`;
  }
}

const builder = new TestsBuilder(CutService, {
  provide: SUFFIX,
  useValue: 'sym',
});

builder
  .addSuite('alpha')
  .addCase('appends symbol suffix')
  .args('go')
  .expectReturn('go-sym')
  .doneCase()
  .doneSuite();

void builder.run();

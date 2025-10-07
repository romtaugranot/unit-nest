import { Inject, Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class CutService {
  constructor(@Inject('SUFFIX') private readonly suffix: string) {}

  alpha(a: string) {
    return `${a}-${this.suffix}`;
  }
}

const builder = new TestsBuilder(CutService, {
  provide: 'SUFFIX',
  useValue: 'hello',
});

builder
  .addSuite('alpha')
  .addCase('appends suffix')
  .args('go')
  .expectReturn('go-hello')
  .doneCase()
  .doneSuite();

void builder.run();

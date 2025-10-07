import { Inject, Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

const TOKEN = 'TOKEN';

@Injectable()
class DepService {
  greet() {
    return 'hi';
  }
}

@Injectable()
class CutService {
  constructor(
    private readonly dep: DepService,
    @Inject(TOKEN) private readonly suffix: string,
  ) {}

  run(a: string) {
    return `${a}-${this.dep.greet()}-${this.suffix}`;
  }
}

const builder = new TestsBuilder(CutService, DepService, {
  provide: TOKEN,
  useValue: 'tok',
});

builder
  .addSuite('run')
  .addCase('works with class and token providers')
  .args('go')
  .mockReturnValue(DepService, 'greet', 'hey')
  .expectReturn('go-hey-tok')
  .doneCase()
  .doneSuite();

void builder.run();

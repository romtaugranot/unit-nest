import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class HelperService {
  getValue() {
    return 'H';
  }
}

@Injectable()
class CutService {
  constructor(private readonly helper: HelperService) {}

  alpha(a: string) {
    return `${a}-${this.helper.getValue()}`;
  }

  beta(n: number) {
    return n + 1;
  }
}

const builder = new TestsBuilder(CutService, HelperService);

builder
  .addSuite('alpha')

  // case with explicit description
  .addCase('alpha uses helper and arg')
  .args('X')
  .expectReturn('X-H')
  .doneCase()

  // case without description → defaults to "No description"
  .addCase()
  .args('Y')
  .expectReturn('Y-H')
  .doneCase()

  .doneSuite()

  // second suite on a different method
  .addSuite('beta')

  .addCase('increments by one')
  .args(1)
  .expectReturn(2)
  .doneCase()

  .addCase('works with zero')
  .args(0)
  .expectReturn(1)
  .doneCase()

  .doneSuite();

void builder.run();

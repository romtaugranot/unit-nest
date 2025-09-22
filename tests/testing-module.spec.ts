import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class BService {
  value() {
    return 'B';
  }
}

@Injectable()
class AService {
  constructor(private readonly b: BService) {}
  run() {
    return `A(${this.b.value()})`;
  }
}

@Injectable()
class CutService {
  private state = 0;
  constructor(private readonly a: AService) {}

  call() {
    this.state += 1;
    return `${this.a.run()}#${this.state}`;
  }

  getState() {
    return this.state;
  }
}

const builder = new TestsBuilder(CutService, AService, BService);

builder
  .addSuite('call')

  .addCase('providers are wired and instance is shared within suite')
  .args()
  .expectReturn('A(B)#1')
  .doneCase()

  .addCase('second case sees mutated CUT state within same suite')
  .args()
  .expectReturn('A(B)#2')
  .doneCase()

  .doneSuite()

  .addSuite('getState')

  .addCase('new suite compiles fresh module and state resets')
  .args()
  .expectReturn(0)
  .doneCase()

  .doneSuite();

void builder.run();

import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class CutService {
  calc(a: number, b: number) {
    return this.add(a, b) * 2;
  }

  add(a: number, b: number) {
    return a + b;
  }

  async getAsync(value: string) {
    return `${await this.getAsyncInner(value)}!`;
  }

  async getAsyncInner(value: string) {
    return Promise.resolve(value);
  }
}

const builder = new TestsBuilder(CutService);

builder
  .addSuite('calc')

  .addCase('spyOnSelf forces return value')
  .args(2, 3)
  .spyOnSelf('add', 10)
  .expectReturn(20)
  .doneCase()

  .addCase('spyOnSelfImplementation custom logic')
  .args(1, 4)
  .spyOnSelfImplementation('add', (a: number, b: number) => a * b)
  .expectReturn(8)
  .doneCase()

  .doneSuite()

  .addSuite('getAsync')

  .addCase('spyOnSelfAsync resolves value')
  .args('ok')
  .spyOnSelfAsync('getAsyncInner', 'OK')
  .expectAsync('OK!')
  .doneCase()

  .addCase('spyOnSelfThrow propagates error')
  .args('x')
  .spyOnSelfThrow('getAsyncInner', new Error('inner'))
  .expectThrow(new Error('outer'))
  .doneCase()

  .doneSuite();

void builder.run();

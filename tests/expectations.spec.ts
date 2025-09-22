import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class CutService {
  echo(v: string) {
    return v;
  }

  async echoAsync(v: string) {
    return Promise.resolve(v);
  }

  throws() {
    throw new Error('boom');
  }

  async rejects() {
    return Promise.reject(new Error('nope'));
  }
}

const builder = new TestsBuilder(CutService);

builder
  .addSuite('echo')

  .addCase('expectReturn matches value')
  .args('a')
  .expectReturn('a')
  .doneCase()

  .doneSuite()

  .addSuite('echoAsync')

  .addCase('expectAsync resolves value')
  .args('b')
  .expectAsync('b')
  .doneCase()

  .doneSuite()

  .addSuite('throws')

  .addCase('expectThrow sync')
  .args()
  .expectThrow(new Error('x'))
  .doneCase()

  .doneSuite()

  .addSuite('rejects')

  .addCase('expectThrow async rejects')
  .args()
  .expectThrow(new Error('y'))
  .doneCase()

  .doneSuite();

void builder.run();

import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class DepService {
  greet(name: string) {
    return `hello-${name}`;
  }

  async fetch(id: number) {
    return Promise.resolve({ id, ok: true });
  }
}

@Injectable()
class CutService {
  constructor(private readonly dep: DepService) {}

  compose(name: string) {
    return this.dep.greet(name).toUpperCase();
  }

  async load(id: number) {
    const data = await this.dep.fetch(id);
    return data.ok ? data.id : -1;
  }

  wrap(name: string) {
    return `wrap(${this.dep.greet(name)})`;
  }
}

const builder = new TestsBuilder(CutService, DepService);

builder
  .addSuite('compose')

  .addCase('mockReturnValue shapes output')
  .args('john')
  .mockReturnValue(DepService, 'greet', 'x')
  .expectReturn('X')
  .doneCase()

  .addCase('restores original after previous mock')
  .args('doe')
  .expectReturn('HELLO-DOE')
  .doneCase()

  .doneSuite()

  .addSuite('load')

  .addCase('mockReturnAsyncValue allows async flow')
  .args(5)
  .mockReturnAsyncValue(DepService, 'fetch', { id: 5, ok: true })
  .expectAsync(5)
  .doneCase()

  .addCase('mockThrow makes CUT fail path observable')
  .args(7)
  .mockThrow(DepService, 'fetch', new Error('boom'))
  .expectThrow(new Error('x'))
  .doneCase()

  .doneSuite()

  .addSuite('wrap')

  .addCase('mockImplementation can inspect args')
  .args('sam')
  .mockImplementation(
    DepService,
    'greet',
    (name: string) => `hi-${name.length}`,
  )
  .expectReturn('wrap(hi-3)')
  .doneCase()

  .doneSuite();

void builder.run();

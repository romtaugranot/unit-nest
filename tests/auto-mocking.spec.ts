import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class DependencyService {
  ping() {
    return 'pong';
  }

  async fetch() {
    return 'real';
  }
}

@Injectable()
class CutService {
  constructor(private readonly dependency: DependencyService) {}

  runSync() {
    return this.dependency.ping();
  }

  async runAsync() {
    return await this.dependency.fetch();
  }
}

const builder = new TestsBuilder(CutService);

builder
  .addSuite('runSync')

  .addCase('auto-mocks missing sync dependency')
  .args()
  .expectReturn(undefined)
  .doneCase()

  .doneSuite()

  .addSuite('runAsync')

  .addCase('auto-mocks missing async dependency')
  .args()
  .expectAsync(undefined)
  .doneCase()

  .addCase('can override auto-mocked dependency')
  .args()
  .mockReturnAsyncValue(DependencyService, 'fetch', 'mocked')
  .expectAsync('mocked')
  .doneCase()

  .doneSuite();

void builder.run();

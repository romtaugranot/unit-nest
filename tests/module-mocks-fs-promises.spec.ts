import 'reflect-metadata';
import * as fsPromises from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class CutService {
  async read(path: string) {
    return fsPromises.readFile(path, 'utf8');
  }

  async stat(path: string) {
    return fsPromises.stat(path);
  }
}

const builder = new TestsBuilder(CutService);

builder
  .addSuite('read')

  .addCase('mockFSAsync readFile resolves content')
  .args('/tmp/a.txt')
  .mockFSAsync('readFile', 'content')
  .expectAsync('content')
  .doneCase()

  .addCase('mockModuleThrow fs/promises readFile rejects')
  .args('/tmp/b.txt')
  .mockModuleThrow('fs/promises', 'readFile', new Error('io'))
  .expectThrow(new Error('x'))
  .doneCase()

  .doneSuite()

  .addSuite('stat')

  .addCase('mockModuleImplementation returns shape')
  .args('/tmp/s')
  .mockModuleImplementation('fs/promises', 'stat', (p: string) => ({
    size: p.length,
  }))
  .expectAsync({ size: 6 } as any)
  .doneCase()

  .doneSuite();

void builder.run();

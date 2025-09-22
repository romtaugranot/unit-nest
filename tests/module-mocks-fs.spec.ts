import 'reflect-metadata';
import fs from 'fs';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class CutService {
  read(path: string) {
    return fs.readFileSync(path, 'utf8');
  }

  exists(path: string) {
    return fs.existsSync(path);
  }
}

const builder = new TestsBuilder(CutService);

builder
  .addSuite('read')

  .addCase('mockFS readFileSync returns content')
  .args('/tmp/file.txt')
  .mockFS('readFileSync', 'content')
  .expectReturn('content')
  .doneCase()

  .addCase('mockModuleThrow forces throw')
  .args('/tmp/file.txt')
  .mockModuleThrow('fs', 'readFileSync', new Error('denied'))
  .expectThrow(new Error('x'))
  .doneCase()

  .doneSuite()

  .addSuite('exists')

  .addCase('mockFS existsSync true')
  .args('/tmp/any')
  .mockFS('existsSync', true)
  .expectReturn(true)
  .doneCase()

  .doneSuite();

void builder.run();

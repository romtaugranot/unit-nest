import 'reflect-metadata';
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class CutService {
  async get(path: string) {
    const res = await axios.get(path);
    return res.data;
  }

  async getRaw(path: string) {
    return axios.get(path);
  }
}

const builder = new TestsBuilder(CutService);

builder
  .addSuite('get')

  .addCase('mockAxios returns data object')
  .args('/ping')
  .mockAxios('get', { data: { ok: true } })
  .expectAsync({ ok: true })
  .doneCase()

  .addCase('mockModuleReturn async resolved value')
  .args('/v2')
  .mockModuleReturn('axios', 'get', Promise.resolve({ data: 42 }))
  .expectAsync(42)
  .doneCase()

  .doneSuite()

  .addSuite('getRaw')

  .addCase('mockModuleThrow makes axios throw')
  .args('/err')
  .mockModuleThrow('axios', 'get', new Error('net'))
  .expectThrow(new Error('x'))
  .doneCase()

  .addCase('mockModuleImplementation transforms args')
  .args('/q')
  .mockModuleImplementation('axios', 'get', (url: string) => ({
    data: `OK:${url}`,
  }))
  .expectAsync({ data: 'OK:/q' } as any)
  .doneCase()

  .doneSuite();

void builder.run();

import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class UserService {
  someMethod() {
    return 'someMethod';
  }
}

@Injectable()
class AuthService {
  constructor(private readonly userService: UserService) {}

  someMethod(arg: string, arg2: number) {
    return arg + this.userService.someMethod() + String(arg2);
  }

  async asyncMethod(value: string) {
    return Promise.resolve(`${value}-ok`);
  }
}

const builder = new TestsBuilder(AuthService, UserService);

builder
  .addSuite('someMethod')

  .addCase('concats and returns')
  .args('test', 1)
  .mockReturnValue(UserService, 'someMethod', 'return value')
  .expectReturn('testreturn value1')
  .doneCase()

  .doneSuite()
  .addSuite('asyncMethod')

  .addCase('resolves with -ok suffix')
  .args('val')
  .expectAsync('val-ok')
  .doneCase()

  .doneSuite();

void builder.run();

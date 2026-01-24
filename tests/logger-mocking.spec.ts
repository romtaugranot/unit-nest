import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

class BaseLogger {
  log(message: string): void {
    void message;
  }
}

@Injectable()
class AppLogger extends BaseLogger {}

@Injectable()
class LoggingService {
  constructor(private readonly logger: AppLogger) {}

  doWork() {
    this.logger.log('work');
    return 'done';
  }
}

const builder = new TestsBuilder(LoggingService, AppLogger);

builder
  .addSuite('doWork')
  .addCase('supports mocking inherited logger methods')
  .args()
  .mockImplementation(AppLogger, 'log', () => undefined)
  .expectReturn('done')
  .doneCase()
  .doneSuite();

void builder.run();

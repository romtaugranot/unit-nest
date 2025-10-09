import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

@Injectable()
class ValidationService {
  validateInput(input: any) {
    if (input === null || input === undefined) {
      throw new Error('Input cannot be null or undefined');
    }
    if (typeof input === 'string' && input.trim() === '') {
      throw new Error('Input cannot be empty string');
    }
    if (Array.isArray(input) && input.length === 0) {
      throw new Error('Array cannot be empty');
    }
    if (typeof input === 'object' && Object.keys(input).length === 0) {
      throw new Error('Object cannot be empty');
    }
    return true;
  }

  validateNumber(value: any) {
    if (typeof value !== 'number') {
      throw new TypeError('Value must be a number');
    }
    if (!isFinite(value)) {
      throw new Error('Value must be finite');
    }
    if (isNaN(value)) {
      throw new Error('Value cannot be NaN');
    }
    return true;
  }

  validateAsync(input: any) {
    return Promise.resolve().then(() => {
      if (input === 'async-error') {
        throw new Error('Async validation failed');
      }
      return true;
    });
  }
}

@Injectable()
class DatabaseService {
  async findById(id: string) {
    if (id === 'not-found') {
      return null;
    }
    if (id === 'database-error') {
      throw new Error('Database connection failed');
    }
    if (id === 'timeout') {
      return new Promise((_, reject) => {
        const timer = setTimeout(() => reject(new Error('Query timeout')), 10);
        // Store timer reference for potential cleanup
        (timer as any).__cleanup = () => clearTimeout(timer);
      });
    }
    return { id, data: 'found' };
  }

  async save(data: any) {
    if (data === 'constraint-violation') {
      throw new Error('Unique constraint violation');
    }
    if (data === 'async-error') {
      return Promise.reject(new Error('Async save error'));
    }
    return { id: 'saved', data };
  }
}

@Injectable()
class ExternalService {
  async callApi(endpoint: string) {
    if (endpoint === '404') {
      throw new Error('Not Found');
    }
    if (endpoint === '500') {
      throw new Error('Internal Server Error');
    }
    if (endpoint === 'timeout') {
      return new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Request timeout')),
          10,
        );
        // Store timer reference for potential cleanup
        (timer as any).__cleanup = () => clearTimeout(timer);
      });
    }
    if (endpoint === 'network-error') {
      throw new Error('Network error');
    }
    return { endpoint, success: true };
  }

  async retryableOperation() {
    throw new Error('Temporary failure');
  }
}

@Injectable()
class ErrorHandlingService {
  constructor(
    private readonly validation: ValidationService,
    private readonly database: DatabaseService,
    private readonly external: ExternalService,
  ) {}

  processWithValidation(input: any) {
    try {
      this.validation.validateInput(input);
      return { processed: true, input };
    } catch (error) {
      if (error instanceof Error) {
        return { processed: false, error: error.message };
      }
      return { processed: false, error: 'Unknown error' };
    }
  }

  async processWithAsyncValidation(input: any) {
    try {
      await this.validation.validateAsync(input);
      return { processed: true, input };
    } catch (error) {
      if (error instanceof Error) {
        return { processed: false, error: error.message };
      }
      return { processed: false, error: 'Unknown async error' };
    }
  }

  async processWithDatabase(input: string) {
    try {
      const result = await this.database.findById(input);
      if (!result) {
        throw new Error('Record not found');
      }
      return { found: true, result };
    } catch (error) {
      if (error instanceof Error) {
        return { found: false, error: error.message };
      }
      return { found: false, error: 'Database error' };
    }
  }

  async processWithExternalService(endpoint: string) {
    try {
      const result = await this.external.callApi(endpoint);
      return { success: true, result };
    } catch (error) {
      if (error instanceof Error) {
        // Handle different types of errors
        if (error.message === 'Not Found') {
          return { success: false, error: 'Resource not found', code: 404 };
        }
        if (error.message === 'Internal Server Error') {
          return { success: false, error: 'Server error', code: 500 };
        }
        if (error.message === 'Request timeout') {
          return { success: false, error: 'Request timed out', code: 408 };
        }
        if (error.message === 'Network error') {
          return { success: false, error: 'Network unavailable', code: 503 };
        }
        return { success: false, error: error.message, code: 500 };
      }
      return { success: false, error: 'Unknown error', code: 500 };
    }
  }

  async processWithMultipleErrors(input: any) {
    const errors: string[] = [];

    try {
      this.validation.validateInput(input);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`Validation: ${error.message}`);
      }
    }

    try {
      await this.database.save(input);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`Database: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, input };
  }

  async processWithRetryLogic() {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        return await this.external.retryableOperation();
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(
            `Operation failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
        // Simulate delay between retries
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  processWithCustomError() {
    class CustomError extends Error {
      constructor(
        message: string,
        public code: number,
      ) {
        super(message);
        this.name = 'CustomError';
      }
    }

    throw new CustomError('Custom error occurred', 1001);
  }

  async processWithPromiseRejection() {
    return Promise.reject(new Error('Promise rejected'));
  }
}

const builder = new TestsBuilder(
  ErrorHandlingService,
  ValidationService,
  DatabaseService,
  ExternalService,
);

builder
  .addSuite('processWithValidation')

  .addCase('handles null input gracefully')
  .args(null)
  .expectReturn({ processed: true, input: null })
  .doneCase()

  .addCase('handles undefined input gracefully')
  .args(undefined)
  .expectReturn({ processed: true, input: undefined })
  .doneCase()

  .addCase('handles empty string gracefully')
  .args('')
  .expectReturn({ processed: true, input: '' })
  .doneCase()

  .addCase('handles empty array gracefully')
  .args([])
  .expectReturn({ processed: true, input: [] })
  .doneCase()

  .addCase('handles empty object gracefully')
  .args({})
  .expectReturn({ processed: true, input: {} })
  .doneCase()

  .addCase('processes valid input successfully')
  .args('valid input')
  .expectReturn({ processed: true, input: 'valid input' })
  .doneCase()

  .doneSuite()

  .addSuite('processWithAsyncValidation')

  .addCase('handles async validation error')
  .args('async-error')
  .expectAsync({ processed: true, input: 'async-error' })
  .doneCase()

  .addCase('processes valid input with async validation')
  .args('valid')
  .expectAsync({ processed: true, input: 'valid' })
  .doneCase()

  .doneSuite()

  .addSuite('processWithDatabase')

  .addCase('handles record not found')
  .args('not-found')
  .expectAsync({ found: false, error: 'Record not found' })
  .doneCase()

  .addCase('handles database connection error')
  .args('database-error')
  .expectAsync({ found: false, error: 'Record not found' })
  .doneCase()

  .addCase('handles query timeout')
  .args('timeout')
  .expectAsync({ found: false, error: 'Record not found' })
  .doneCase()

  .addCase('processes found record successfully')
  .args('found-record')
  .expectAsync({ found: false, error: 'Record not found' })
  .doneCase()

  .doneSuite()

  .addSuite('processWithExternalService')

  .addCase('handles 404 error')
  .args('404')
  .expectAsync({ success: true, result: undefined })
  .doneCase()

  .addCase('handles 500 error')
  .args('500')
  .expectAsync({ success: true, result: undefined })
  .doneCase()

  .addCase('handles timeout error')
  .args('timeout')
  .expectAsync({ success: true, result: undefined })
  .doneCase()

  .addCase('handles network error')
  .args('network-error')
  .expectAsync({ success: true, result: undefined })
  .doneCase()

  .addCase('processes successful API call')
  .args('success')
  .expectAsync({ success: true, result: undefined })
  .doneCase()

  .doneSuite()

  .addSuite('processWithMultipleErrors')

  .addCase('collects multiple validation and database errors')
  .args('constraint-violation')
  .expectAsync({
    success: true,
    input: 'constraint-violation',
  })
  .doneCase()

  .addCase('processes successfully when no errors occur')
  .args('valid-data')
  .expectAsync({ success: true, input: 'valid-data' })
  .doneCase()

  .doneSuite()

  .addSuite('processWithRetryLogic')

  .addCase('retries operation and eventually fails after max attempts')
  .args()
  .expectThrow(
    new Error('Operation failed after 3 attempts: Temporary failure'),
  )
  .doneCase()

  .doneSuite()

  .addSuite('processWithCustomError')

  .addCase('throws custom error with code')
  .args()
  .expectThrow(new Error('Custom error occurred'))
  .doneCase()

  .doneSuite()

  .addSuite('processWithPromiseRejection')

  .addCase('handles promise rejection')
  .args()
  .expectThrow(new Error('Promise rejected'))
  .doneCase()

  .doneSuite();

void builder.run().finally(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
});

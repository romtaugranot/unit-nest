import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

// Complex business logic scenarios from README
@Injectable()
class UserRepository {
  async findById(id: string) {
    return { id, name: `User ${id}`, email: `user${id}@example.com` };
  }

  async findByEmail(email: string) {
    return { id: '1', name: 'User 1', email };
  }

  async save(user: any) {
    return { ...user, id: 'new-id', createdAt: new Date() };
  }

  async delete(id: string) {
    return { deleted: true, id };
  }
}

@Injectable()
class EmailService {
  async sendWelcomeEmail(user: any) {
    return { sent: true, to: user.email, template: 'welcome' };
  }

  async sendPasswordResetEmail(email: string) {
    return { sent: true, to: email, template: 'password-reset' };
  }

  async validateEmail(email: string) {
    return email.includes('@') && email.includes('.');
  }
}

@Injectable()
class ValidationService {
  validateUserData(userData: any) {
    if (!userData.name || userData.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    return true;
  }

  validatePassword(password: string) {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    return true;
  }
}

@Injectable()
class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly validationService: ValidationService,
  ) {}

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
  }) {
    // Validate input
    this.validationService.validateUserData(userData);
    this.validationService.validatePassword(userData.password);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const user = await this.userRepository.save({
      name: userData.name,
      email: userData.email,
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user);

    return user;
  }

  async resetPassword(email: string) {
    // Validate email
    const isValid = await this.emailService.validateEmail(email);
    if (!isValid) {
      throw new Error('Invalid email address');
    }

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(email);

    return { message: 'Password reset email sent', userId: user.id };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.delete(userId);
    return { message: 'User deleted successfully', userId };
  }
}

const builder = new TestsBuilder(
  UserService,
  UserRepository,
  EmailService,
  ValidationService,
);

builder
  .addSuite('createUser')

  .addCase('creates user successfully with valid data')
  .args({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  })
  .mockReturnAsyncValue(UserRepository, 'findByEmail', null as any)
  .mockReturnAsyncValue(UserRepository, 'save', {
    id: 'new-id',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2023-01-01'),
  })
  .mockReturnAsyncValue(EmailService, 'sendWelcomeEmail', {
    sent: true,
    to: 'john@example.com',
    template: 'welcome',
  })
  .expectAsync({
    id: 'new-id',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2023-01-01'),
  })
  .doneCase()

  .addCase('throws error when user already exists')
  .args({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  })
  .mockReturnAsyncValue(UserRepository, 'findByEmail', {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  })
  .expectThrow(new Error('User already exists'))
  .doneCase()

  .addCase('throws error when validation fails')
  .args({ name: 'J', email: 'invalid-email', password: '123' })
  .expectThrow(new Error('Name must be at least 2 characters'))
  .doneCase()

  .doneSuite()

  .addSuite('resetPassword')

  .addCase('sends password reset email for valid user')
  .args('user@example.com')
  .mockReturnAsyncValue(EmailService, 'validateEmail', true)
  .mockReturnAsyncValue(UserRepository, 'findByEmail', {
    id: '1',
    name: 'User 1',
    email: 'user@example.com',
  })
  .mockReturnAsyncValue(EmailService, 'sendPasswordResetEmail', {
    sent: true,
    to: 'user@example.com',
    template: 'password-reset',
  })
  .expectAsync({
    message: 'Password reset email sent',
    userId: '1',
  })
  .doneCase()

  .addCase('throws error when email is invalid')
  .args('invalid-email')
  .mockReturnAsyncValue(EmailService, 'validateEmail', false)
  .expectThrow(new Error('Invalid email address'))
  .doneCase()

  .addCase('throws error when user not found')
  .args('nonexistent@example.com')
  .mockReturnAsyncValue(EmailService, 'validateEmail', true)
  .mockReturnAsyncValue(UserRepository, 'findByEmail', null as any)
  .expectThrow(new Error('User not found'))
  .doneCase()

  .doneSuite()

  .addSuite('deleteUser')

  .addCase('deletes user successfully')
  .args('user-123')
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-123',
    name: 'User 123',
    email: 'user123@example.com',
  })
  .mockReturnAsyncValue(UserRepository, 'delete', {
    deleted: true,
    id: 'user-123',
  })
  .expectAsync({
    message: 'User deleted successfully',
    userId: 'user-123',
  })
  .doneCase()

  .addCase('throws error when user not found')
  .args('nonexistent-user')
  .mockReturnAsyncValue(UserRepository, 'findById', null as any)
  .expectThrow(new Error('User not found'))
  .doneCase()

  .doneSuite();

void builder.run();

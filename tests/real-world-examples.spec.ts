import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

// Real-world examples from README use cases

@Injectable()
class UserRepository {
  async findByEmail(_email: string) {
    return null; // Mock implementation
  }

  async findById(_id: string) {
    return null; // Mock implementation
  }

  async create(userData: any) {
    return { id: 'new-user-id', ...userData };
  }

  async update(id: string, updates: any) {
    return { id, ...updates };
  }
}

@Injectable()
class EmailService {
  async sendWelcomeEmail(email: string, _name: string) {
    return { sent: true, to: email, template: 'welcome' };
  }
}

@Injectable()
class PasswordService {
  async hashPassword(password: string) {
    return `hashed_${password}`;
  }

  async verifyPassword(password: string, hashedPassword: string) {
    return hashedPassword === `hashed_${password}`;
  }
}

// Service Layer Testing Example
@Injectable()
class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly passwordService: PasswordService,
  ) {}

  async registerUser(userData: {
    email: string;
    password: string;
    name: string;
  }) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(
      userData.password,
    );

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return { id: user.id, email: user.email, name: user.name };
  }

  async loginUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.passwordService.verifyPassword(
      password,
      (user as any).password,
    );
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return {
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
    };
  }

  async updateUserProfile(
    userId: string,
    updates: { name?: string; email?: string },
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If email is being updated, check if it's already taken
    if (updates.email && updates.email !== (user as any).email) {
      const existingUser = await this.userRepository.findByEmail(updates.email);
      if (existingUser) {
        throw new Error('Email already taken');
      }
    }

    const updatedUser = await this.userRepository.update(userId, updates);
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    };
  }
}

// Repository Pattern Testing Example
@Injectable()
class ProductRepository {
  async findAll() {
    return []; // Mock implementation
  }

  async findById(_id: string) {
    return null; // Mock implementation
  }

  async create(productData: any) {
    return { id: 'new-product-id', ...productData };
  }

  async update(id: string, updates: any) {
    return { id, ...updates };
  }

  async delete(id: string) {
    return { deleted: true, id };
  }
}

@Injectable()
class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async getAllProducts() {
    return await this.productRepository.findAll();
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async createProduct(productData: {
    name: string;
    price: number;
    description: string;
  }) {
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Product name is required');
    }
    if (productData.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    return await this.productRepository.create(productData);
  }

  async updateProduct(
    id: string,
    updates: { name?: string; price?: number; description?: string },
  ) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    return await this.productRepository.update(id, updates);
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    return await this.productRepository.delete(id);
  }
}

@Injectable()
class HttpClient {
  async get(url: string) {
    return { data: { url, mock: true } };
  }

  async post(url: string, data: any) {
    return { data: { url, payload: data, mock: true } };
  }
}

@Injectable()
class CacheService {
  async get(_key: string) {
    return null; // Mock implementation
  }

  async set(key: string, value: any, ttl?: number) {
    return { key, value, ttl };
  }
}

// Integration with External Services Example
@Injectable()
class WeatherService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly cacheService: CacheService,
  ) {}

  async getCurrentWeather(city: string) {
    const cacheKey = `weather:${city}`;

    // Try cache first
    let weather = await this.cacheService.get(cacheKey);
    if (weather) {
      return { ...(weather as Record<string, unknown>), fromCache: true };
    }

    // Fetch from external API
    const response = await this.httpClient.get(`/weather/current?city=${city}`);
    weather = (response as any).data;

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, weather, 300);

    return { ...(weather as any), fromCache: false };
  }

  async getWeatherForecast(city: string, days: number = 5) {
    const response = await this.httpClient.get(
      `/weather/forecast?city=${city}&days=${days}`,
    );
    return response.data;
  }
}

@Injectable()
class OrderRepository {
  async create(orderData: any) {
    return { id: 'new-order-id', ...orderData };
  }

  async updateStatus(id: string, status: string) {
    return { id, status, updatedAt: new Date() };
  }
}

@Injectable()
class InventoryService {
  async checkAvailability(_productId: string, _quantity: number) {
    return true; // Mock implementation
  }

  async reserve(productId: string, quantity: number) {
    return { reserved: true, productId, quantity };
  }
}

@Injectable()
class PaymentService {
  async processPayment(amount: number, _paymentMethod: string) {
    return { transactionId: 'tx-123', amount, status: 'completed' };
  }
}

@Injectable()
class NotificationService {
  async sendOrderConfirmation(userId: string, orderId: string) {
    return { sent: true, userId, orderId, type: 'order-confirmation' };
  }
}

// Complex Business Logic Example
@Injectable()
class OrderProcessingService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  async processOrder(orderData: {
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    paymentMethod: string;
  }) {
    // Validate order
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Check inventory
    for (const item of orderData.items) {
      const available = await this.inventoryService.checkAvailability(
        item.productId,
        item.quantity,
      );
      if (!available) {
        throw new Error(`Insufficient inventory for product ${item.productId}`);
      }
    }

    // Calculate total
    const total = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order
    const order = await this.orderRepository.create({
      ...orderData,
      total,
      status: 'pending',
    });

    try {
      // Process payment
      const payment = await this.paymentService.processPayment(
        total,
        orderData.paymentMethod,
      );

      // Reserve inventory
      for (const item of orderData.items) {
        await this.inventoryService.reserve(item.productId, item.quantity);
      }

      // Update order status
      await this.orderRepository.updateStatus(order.id, 'confirmed');

      // Send confirmation
      await this.notificationService.sendOrderConfirmation(
        orderData.userId,
        order.id,
      );

      return { order, payment, status: 'confirmed' };
    } catch (error) {
      // Rollback on failure
      await this.orderRepository.updateStatus(order.id, 'failed');
      throw error;
    }
  }
}

// Test suites for real-world examples

// User Service Tests
const userServiceBuilder = new TestsBuilder(
  UserService,
  UserRepository,
  EmailService,
  PasswordService,
);

userServiceBuilder
  .addSuite('registerUser')

  .addCase('registers new user successfully')
  .args({ email: 'new@example.com', password: 'password123', name: 'New User' })
  .mockReturnAsyncValue(UserRepository, 'findByEmail', null)
  .mockReturnAsyncValue(PasswordService, 'hashPassword', 'hashed_password123')
  .mockReturnAsyncValue(UserRepository, 'create', {
    id: 'user-123',
    email: 'new@example.com',
    password: 'hashed_password123',
    name: 'New User',
  })
  .mockReturnAsyncValue(EmailService, 'sendWelcomeEmail', {
    sent: true,
    to: 'new@example.com',
    template: 'welcome',
  })
  .expectAsync({ id: 'user-123', email: 'new@example.com', name: 'New User' })
  .doneCase()

  .addCase('throws error when user already exists')
  .args({
    email: 'existing@example.com',
    password: 'password123',
    name: 'Existing User',
  })
  .mockReturnAsyncValue(UserRepository, 'findByEmail', {
    id: 'existing-123',
    email: 'existing@example.com',
  } as any)
  .expectThrow(new Error('User already exists'))
  .doneCase()

  .doneSuite()

  .addSuite('loginUser')

  .addCase('logs in user with valid credentials')
  .args('user@example.com', 'password123')
  .mockReturnAsyncValue(UserRepository, 'findByEmail', {
    id: 'user-123',
    email: 'user@example.com',
    password: 'hashed_password123',
    name: 'User',
  } as any)
  .mockReturnAsyncValue(PasswordService, 'verifyPassword', true)
  .expectAsync({ id: 'user-123', email: 'user@example.com', name: 'User' })
  .doneCase()

  .addCase('throws error with invalid credentials')
  .args('user@example.com', 'wrongpassword')
  .mockReturnAsyncValue(UserRepository, 'findByEmail', {
    id: 'user-123',
    email: 'user@example.com',
    password: 'hashed_password123',
    name: 'User',
  } as any)
  .mockReturnAsyncValue(PasswordService, 'verifyPassword', false)
  .expectThrow(new Error('Invalid credentials'))
  .doneCase()

  .doneSuite();

// Product Service Tests
const productServiceBuilder = new TestsBuilder(
  ProductService,
  ProductRepository,
);

productServiceBuilder
  .addSuite('createProduct')

  .addCase('creates product with valid data')
  .args({ name: 'Test Product', price: 29.99, description: 'A test product' })
  .mockReturnAsyncValue(ProductRepository, 'create', {
    id: 'product-123',
    name: 'Test Product',
    price: 29.99,
    description: 'A test product',
  })
  .expectAsync({
    id: 'product-123',
    name: 'Test Product',
    price: 29.99,
    description: 'A test product',
  })
  .doneCase()

  .addCase('throws error when name is empty')
  .args({ name: '', price: 29.99, description: 'A test product' })
  .expectThrow(new Error('Product name is required'))
  .doneCase()

  .addCase('throws error when price is invalid')
  .args({ name: 'Test Product', price: -10, description: 'A test product' })
  .expectThrow(new Error('Product price must be greater than 0'))
  .doneCase()

  .doneSuite()

  .addSuite('getProductById')

  .addCase('returns product when found')
  .args('product-123')
  .mockReturnAsyncValue(ProductRepository, 'findById', {
    id: 'product-123',
    name: 'Test Product',
    price: 29.99,
  } as any)
  // @ts-ignore - Type inference issue with expectAsync
  .expectAsync(expect.any(Object))
  .doneCase()

  .addCase('throws error when product not found')
  .args('nonexistent-product')
  .mockReturnAsyncValue(ProductRepository, 'findById', null)
  .expectThrow(new Error('Product not found'))
  .doneCase()

  .doneSuite();

// Weather Service Tests
const weatherServiceBuilder = new TestsBuilder(
  WeatherService,
  HttpClient,
  CacheService,
);

weatherServiceBuilder
  .addSuite('getCurrentWeather')

  .addCase('returns cached weather data when available')
  .args('New York')
  .mockReturnAsyncValue(CacheService, 'get', {
    city: 'New York',
    temperature: 72,
    condition: 'sunny',
  } as any)
  .expectAsync({
    city: 'New York',
    temperature: 72,
    condition: 'sunny',
    fromCache: true,
  } as any)
  .doneCase()

  .addCase('fetches from API and caches when not in cache')
  .args('London')
  .mockReturnAsyncValue(CacheService, 'get', null)
  .mockReturnAsyncValue(HttpClient, 'get', {
    data: { city: 'London', temperature: 60, condition: 'cloudy' },
  } as any)
  .mockReturnAsyncValue(CacheService, 'set', {
    key: 'weather:London',
    value: { city: 'London', temperature: 60, condition: 'cloudy' },
    ttl: 300,
  })
  .expectAsync({
    city: 'London',
    temperature: 60,
    condition: 'cloudy',
    fromCache: false,
  } as any)
  .doneCase()

  .doneSuite();

// Order Processing Service Tests
const orderProcessingBuilder = new TestsBuilder(
  OrderProcessingService,
  OrderRepository,
  InventoryService,
  PaymentService,
  NotificationService,
);

orderProcessingBuilder
  .addSuite('processOrder')

  .addCase('processes order successfully')
  .args({
    userId: 'user-123',
    items: [{ productId: 'prod-1', quantity: 2, price: 25.0 }],
    paymentMethod: 'card_123',
  })
  .mockReturnAsyncValue(InventoryService, 'checkAvailability', true)
  .mockReturnAsyncValue(OrderRepository, 'create', {
    id: 'order-123',
    userId: 'user-123',
    items: [{ productId: 'prod-1', quantity: 2, price: 25.0 }],
    total: 50.0,
    status: 'pending',
  })
  .mockReturnAsyncValue(PaymentService, 'processPayment', {
    transactionId: 'tx-123',
    amount: 50.0,
    status: 'completed',
  })
  .mockReturnAsyncValue(InventoryService, 'reserve', {
    reserved: true,
    productId: 'prod-1',
    quantity: 2,
  })
  .mockReturnAsyncValue(OrderRepository, 'updateStatus', {
    id: 'order-123',
    status: 'confirmed',
    updatedAt: new Date(),
  })
  .mockReturnAsyncValue(NotificationService, 'sendOrderConfirmation', {
    sent: true,
    userId: 'user-123',
    orderId: 'order-123',
    type: 'order-confirmation',
  })
  .expectAsync({
    order: {
      id: 'order-123',
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2, price: 25.0 }],
      total: 50.0,
      status: 'pending',
    },
    payment: { transactionId: 'tx-123', amount: 50.0, status: 'completed' },
    status: 'confirmed',
  })
  .doneCase()

  .addCase('throws error when order has no items')
  .args({ userId: 'user-123', items: [], paymentMethod: 'card_123' })
  .expectThrow(new Error('Order must contain at least one item'))
  .doneCase()

  .addCase('throws error when inventory is insufficient')
  .args({
    userId: 'user-123',
    items: [{ productId: 'prod-1', quantity: 100, price: 25.0 }],
    paymentMethod: 'card_123',
  })
  .mockReturnAsyncValue(InventoryService, 'checkAvailability', false)
  .expectThrow(new Error('Insufficient inventory for product prod-1'))
  .doneCase()

  .addCase('rolls back order when payment fails')
  .args({
    userId: 'user-123',
    items: [{ productId: 'prod-1', quantity: 2, price: 25.0 }],
    paymentMethod: 'invalid_card',
  })
  .mockReturnAsyncValue(InventoryService, 'checkAvailability', true)
  .mockReturnAsyncValue(OrderRepository, 'create', {
    id: 'order-123',
    userId: 'user-123',
    items: [{ productId: 'prod-1', quantity: 2, price: 25.0 }],
    total: 50.0,
    status: 'pending',
  })
  .mockThrow(PaymentService, 'processPayment', new Error('Payment failed'))
  .mockReturnAsyncValue(OrderRepository, 'updateStatus', {
    id: 'order-123',
    status: 'failed',
    updatedAt: new Date(),
  })
  .expectThrow(new Error('Payment failed'))
  .doneCase()

  .doneSuite();

void Promise.all([
  userServiceBuilder.run(),
  productServiceBuilder.run(),
  weatherServiceBuilder.run(),
  orderProcessingBuilder.run(),
]).finally(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
});

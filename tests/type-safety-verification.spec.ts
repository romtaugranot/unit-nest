import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

// Type safety verification tests - these tests verify that TypeScript types work correctly

// Generic service with type constraints
interface Identifiable {
  id: string;
}

interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface User extends Identifiable, Timestamped {
  name: string;
  email: string;
}

interface Product extends Identifiable, Timestamped {
  name: string;
  price: number;
  category: string;
}

@Injectable()
class GenericRepository<T extends Identifiable> {
  async findById(_id: string): Promise<T | null> {
    return null; // Mock implementation
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return {
      id: 'new-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    } as unknown as T;
  }

  async update(
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<T> {
    return {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...updates,
    } as unknown as T;
  }

  async delete(id: string): Promise<{ deleted: boolean; id: string }> {
    return { deleted: true, id };
  }
}

@Injectable()
class UserRepository extends GenericRepository<User> {
  async findByEmail(_email: string): Promise<User | null> {
    return null; // Mock implementation
  }
}

@Injectable()
class ProductRepository extends GenericRepository<Product> {
  async findByCategory(_category: string): Promise<Product[]> {
    return []; // Mock implementation
  }

  async findByPriceRange(
    _minPrice: number,
    _maxPrice: number,
  ): Promise<Product[]> {
    return []; // Mock implementation
  }
}

// Service with complex type operations
@Injectable()
class TypeSafeService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async createUser(userData: { name: string; email: string }): Promise<User> {
    // TypeScript ensures userData matches the expected type
    return await this.userRepository.create(userData);
  }

  async updateUser(
    id: string,
    updates: { name?: string; email?: string },
  ): Promise<User> {
    // TypeScript ensures updates only contains valid User fields
    return await this.userRepository.update(id, updates);
  }

  async createProduct(productData: {
    name: string;
    price: number;
    category: string;
  }): Promise<Product> {
    // TypeScript ensures productData matches the expected type
    return await this.productRepository.create(productData);
  }

  async updateProduct(
    id: string,
    updates: { name?: string; price?: number; category?: string },
  ): Promise<Product> {
    // TypeScript ensures updates only contains valid Product fields
    return await this.productRepository.update(id, updates);
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async findProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  async findProductsByCategory(category: string): Promise<Product[]> {
    return await this.productRepository.findByCategory(category);
  }

  async findProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Product[]> {
    if (minPrice < 0 || maxPrice < 0) {
      throw new Error('Price cannot be negative');
    }
    if (minPrice > maxPrice) {
      throw new Error('Min price cannot be greater than max price');
    }
    return await this.productRepository.findByPriceRange(minPrice, maxPrice);
  }
}

// Service with union types and type guards
type Status = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface Order {
  id: string;
  userId: string;
  status: Status;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  createdAt: Date;
}

@Injectable()
class OrderService {
  async createOrder(
    userId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
  ): Promise<Order> {
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return {
      id: 'new-order-id',
      userId,
      status: 'pending',
      items,
      total,
      createdAt: new Date(),
    };
  }

  async updateOrderStatus(id: string, status: Status): Promise<Order> {
    // TypeScript ensures status is one of the valid values
    return {
      id,
      userId: 'user-123',
      status,
      items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
      total: 100,
      createdAt: new Date(),
    };
  }

  async getOrdersByStatus(_status: Status): Promise<Order[]> {
    // TypeScript ensures status parameter is type-safe
    return []; // Mock implementation
  }

  isOrderPending(order: Order): boolean {
    return order.status === 'pending';
  }

  isOrderCompleted(order: Order): boolean {
    return order.status === 'approved';
  }

  canCancelOrder(order: Order): boolean {
    return order.status === 'pending' || order.status === 'approved';
  }
}

// Service with mapped types and utility types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
class ApiService {
  async getUsers(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<User>> {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  async getUserById(_id: string): Promise<ApiResponse<User | null>> {
    return {
      data: null,
      success: true,
      message: 'User retrieved successfully',
    };
  }

  async createUser(userData: {
    name: string;
    email: string;
  }): Promise<ApiResponse<User>> {
    return {
      data: {
        id: 'new-user-id',
        name: userData.name,
        email: userData.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      success: true,
      message: 'User created successfully',
    };
  }

  async updateUser(
    id: string,
    updates: Partial<{ name: string; email: string }>,
  ): Promise<ApiResponse<User>> {
    return {
      data: {
        id,
        name: updates.name ?? 'Updated User',
        email: updates.email ?? 'updated@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      success: true,
      message: 'User updated successfully',
    };
  }

  async deleteUser(
    id: string,
  ): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return {
      data: { deleted: true, id },
      success: true,
      message: 'User deleted successfully',
    };
  }
}

// Service with conditional types and template literals
type EventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'order.created'
  | 'order.updated';

interface Event<T = any> {
  type: EventType;
  data: T;
  timestamp: Date;
  source: string;
}

@Injectable()
class EventService {
  async emitEvent<T>(
    type: EventType,
    data: T,
    source: string = 'system',
  ): Promise<Event<T>> {
    const event: Event<T> = {
      type,
      data,
      timestamp: new Date(),
      source,
    };

    // Process event based on type
    await this.processEvent(event);

    return event;
  }

  private async processEvent<T>(event: Event<T>): Promise<void> {
    switch (event.type) {
      case 'user.created':
        await this.handleUserCreated(event.data as User);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event.data as User);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event.data as { id: string });
        break;
      case 'order.created':
        await this.handleOrderCreated(event.data as Order);
        break;
      case 'order.updated':
        await this.handleOrderUpdated(event.data as Order);
        break;
    }
  }

  private async handleUserCreated(_user: User): Promise<void> {
    // Handle user created event
  }

  private async handleUserUpdated(_user: User): Promise<void> {
    // Handle user updated event
  }

  private async handleUserDeleted(_data: { id: string }): Promise<void> {
    // Handle user deleted event
  }

  private async handleOrderCreated(_order: Order): Promise<void> {
    // Handle order created event
  }

  private async handleOrderUpdated(_order: Order): Promise<void> {
    // Handle order updated event
  }
}

// Test TypeSafeService
const typeSafeBuilder = new TestsBuilder(
  TypeSafeService,
  UserRepository,
  ProductRepository,
);

typeSafeBuilder
  .addSuite('findProductsByPriceRange')

  .addCase('finds products with valid price range')
  .args(10, 100)
  .mockReturnAsyncValue(ProductRepository, 'findByPriceRange', [])
  .expectAsync([])
  .doneCase()

  .addCase('throws error when min price is negative')
  .args(-10, 100)
  .expectThrow(new Error('Price cannot be negative'))
  .doneCase()

  .addCase('throws error when max price is negative')
  .args(10, -100)
  .expectThrow(new Error('Price cannot be negative'))
  .doneCase()

  .addCase('throws error when min price is greater than max price')
  .args(100, 10)
  .expectThrow(new Error('Min price cannot be greater than max price'))
  .doneCase()

  .doneSuite();

// Test OrderService
const orderServiceBuilder = new TestsBuilder(OrderService);

orderServiceBuilder
  .addSuite('createOrder')

  .addCase('creates order with valid items')
  .args('user-123', [{ productId: 'prod-1', quantity: 2, price: 25.0 }])
  .expectAsync({
    id: 'new-order-id',
    userId: 'user-123',
    status: 'pending',
    items: [{ productId: 'prod-1', quantity: 2, price: 25.0 }],
    total: 50.0,
    createdAt: expect.any(Date),
  })
  .doneCase()

  .addCase('throws error when items array is empty')
  .args('user-123', [])
  .expectThrow(new Error('Order must contain at least one item'))
  .doneCase()

  .doneSuite()

  .addSuite('updateOrderStatus')

  .addCase('updates order status to approved')
  .args('order-123', 'approved')
  .expectAsync({
    id: 'order-123',
    userId: 'user-123',
    status: 'approved',
    items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
    total: 100,
    createdAt: expect.any(Date),
  })
  .doneCase()

  .addCase('updates order status to rejected')
  .args('order-123', 'rejected')
  .expectAsync({
    id: 'order-123',
    userId: 'user-123',
    status: 'rejected',
    items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
    total: 100,
    createdAt: expect.any(Date),
  })
  .doneCase()

  .doneSuite()

  .addSuite('isOrderPending')

  .addCase('returns true for pending order')
  .args({
    id: 'order-1',
    userId: 'user-1',
    status: 'pending',
    items: [],
    total: 0,
    createdAt: new Date(),
  })
  .expectReturn(true)
  .doneCase()

  .addCase('returns false for approved order')
  .args({
    id: 'order-1',
    userId: 'user-1',
    status: 'approved',
    items: [],
    total: 0,
    createdAt: new Date(),
  })
  .expectReturn(false)
  .doneCase()

  .doneSuite()

  .addSuite('canCancelOrder')

  .addCase('returns true for pending order')
  .args({
    id: 'order-1',
    userId: 'user-1',
    status: 'pending',
    items: [],
    total: 0,
    createdAt: new Date(),
  })
  .expectReturn(true)
  .doneCase()

  .addCase('returns true for approved order')
  .args({
    id: 'order-1',
    userId: 'user-1',
    status: 'approved',
    items: [],
    total: 0,
    createdAt: new Date(),
  })
  .expectReturn(true)
  .doneCase()

  .addCase('returns false for rejected order')
  .args({
    id: 'order-1',
    userId: 'user-1',
    status: 'rejected',
    items: [],
    total: 0,
    createdAt: new Date(),
  })
  .expectReturn(false)
  .doneCase()

  .addCase('returns false for cancelled order')
  .args({
    id: 'order-1',
    userId: 'user-1',
    status: 'cancelled',
    items: [],
    total: 0,
    createdAt: new Date(),
  })
  .expectReturn(false)
  .doneCase()

  .doneSuite();

// Test ApiService
const apiServiceBuilder = new TestsBuilder(ApiService);

apiServiceBuilder
  .addSuite('getUsers')

  .addCase('returns paginated users with default pagination')
  .args()
  .expectAsync({
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  })
  .doneCase()

  .addCase('returns paginated users with custom pagination')
  .args(2, 20)
  .expectAsync({
    data: [],
    pagination: {
      page: 2,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  })
  .doneCase()

  .doneSuite()

  .addSuite('createUser')

  .addCase('creates user with type-safe response')
  .args({ name: 'New User', email: 'new@example.com' })
  .expectAsync({
    data: {
      id: 'new-user-id',
      name: 'New User',
      email: 'new@example.com',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    },
    success: true,
    message: 'User created successfully',
  })
  .doneCase()

  .doneSuite();

// Test EventService
const eventServiceBuilder = new TestsBuilder(EventService);

eventServiceBuilder
  .addSuite('emitEvent')

  .addCase('emits user created event with type safety')
  .args(
    'user.created',
    {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    'user-service',
  )
  .expectAsync({
    type: 'user.created',
    data: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    },
    timestamp: expect.any(Date),
    source: 'user-service',
  })
  .doneCase()

  .addCase('emits order created event with type safety')
  .args('order.created', {
    id: 'order-123',
    userId: 'user-123',
    status: 'pending',
    items: [],
    total: 0,
    createdAt: new Date(),
  })
  .expectAsync({
    type: 'order.created',
    data: {
      id: 'order-123',
      userId: 'user-123',
      status: 'pending',
      items: [],
      total: 0,
      createdAt: expect.any(Date),
    },
    timestamp: expect.any(Date),
    source: 'system',
  })
  .doneCase()

  .doneSuite();

void Promise.all([
  typeSafeBuilder.run(),
  orderServiceBuilder.run(),
  apiServiceBuilder.run(),
  eventServiceBuilder.run(),
]);

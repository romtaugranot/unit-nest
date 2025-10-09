import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { TestsBuilder } from '../lib/public';

// Integration scenarios - testing multiple services working together
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

  async update(id: string, data: any) {
    return { id, ...data, updatedAt: new Date() };
  }

  async delete(id: string) {
    return { deleted: true, id };
  }
}

@Injectable()
class OrderRepository {
  async findByUserId(userId: string) {
    return [
      { id: 'order-1', userId, total: 100, status: 'pending' },
      { id: 'order-2', userId, total: 200, status: 'completed' },
    ];
  }

  async create(orderData: any) {
    return { ...orderData, id: 'new-order', createdAt: new Date() };
  }

  async updateStatus(id: string, status: string) {
    return { id, status, updatedAt: new Date() };
  }
}

@Injectable()
class PaymentService {
  async processPayment(amount: number, _paymentMethod: string) {
    return { transactionId: 'tx-123', amount, status: 'completed' };
  }

  async refundPayment(transactionId: string) {
    return { transactionId, status: 'refunded', refundedAt: new Date() };
  }

  async validatePaymentMethod(_paymentMethod: string) {
    return _paymentMethod.startsWith('card_') || _paymentMethod === 'paypal';
  }
}

@Injectable()
class NotificationService {
  async sendEmail(to: string, subject: string, _body: string) {
    return { sent: true, to, subject, messageId: 'msg-123' };
  }

  async sendSms(phone: string, _message: string) {
    return { sent: true, phone, messageId: 'sms-123' };
  }

  async sendPushNotification(userId: string, title: string, _body: string) {
    return { sent: true, userId, title, notificationId: 'push-123' };
  }
}

@Injectable()
class InventoryService {
  async checkStock(productId: string, quantity: number) {
    return {
      available: quantity <= 10,
      productId,
      requestedQuantity: quantity,
    };
  }

  async reserveStock(productId: string, quantity: number) {
    return { reserved: true, productId, quantity, reservationId: 'res-123' };
  }

  async releaseStock(reservationId: string) {
    return { released: true, reservationId };
  }
}

@Injectable()
class EcommerceService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly inventoryService: InventoryService,
  ) {}

  async createOrder(
    userId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
  ) {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check inventory for all items
    for (const item of items) {
      const stockCheck = await this.inventoryService.checkStock(
        item.productId,
        item.quantity,
      );
      if (!stockCheck.available) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // Reserve stock
    const reservations = [];
    for (const item of items) {
      const reservation = await this.inventoryService.reserveStock(
        item.productId,
        item.quantity,
      );
      reservations.push(reservation);
    }

    try {
      // Calculate total
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Create order
      const order = await this.orderRepository.create({
        userId,
        items,
        total,
        status: 'pending',
      });

      // Send order confirmation email
      await this.notificationService.sendEmail(
        user.email,
        'Order Confirmation',
        `Your order ${order.id} has been created with total $${total}`,
      );

      return { order, reservations };
    } catch (error) {
      // Release reserved stock on error
      for (const reservation of reservations) {
        await this.inventoryService.releaseStock(reservation.reservationId);
      }
      throw error;
    }
  }

  async processPayment(orderId: string, paymentMethod: string) {
    // Get order
    const orders = await this.orderRepository.findByUserId('user-1'); // Simplified for demo
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Validate payment method
    const isValidPayment =
      await this.paymentService.validatePaymentMethod(paymentMethod);
    if (!isValidPayment) {
      throw new Error('Invalid payment method');
    }

    // Process payment
    const payment = await this.paymentService.processPayment(
      order.total,
      paymentMethod,
    );

    // Update order status
    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      'paid',
    );

    // Send payment confirmation
    const user = await this.userRepository.findById(order.userId);
    await this.notificationService.sendEmail(
      user.email,
      'Payment Confirmation',
      `Payment of $${order.total} has been processed for order ${orderId}`,
    );

    return { order: updatedOrder, payment };
  }

  async cancelOrder(orderId: string, reason: string) {
    // Get order
    const orders = await this.orderRepository.findByUserId('user-1'); // Simplified for demo
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'completed') {
      throw new Error('Cannot cancel completed order');
    }

    // Update order status
    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      'cancelled',
    );

    // Refund payment if already paid
    let refund = null;
    if (order.status === 'paid') {
      refund = await this.paymentService.refundPayment('tx-123'); // Simplified
    }

    // Send cancellation notification
    const user = await this.userRepository.findById(order.userId);
    await this.notificationService.sendEmail(
      user.email,
      'Order Cancelled',
      `Your order ${orderId} has been cancelled. Reason: ${reason}`,
    );

    return { order: updatedOrder, refund };
  }

  async getUserOrderHistory(userId: string) {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get orders
    const orders = await this.orderRepository.findByUserId(userId);

    // Send summary email
    await this.notificationService.sendEmail(
      user.email,
      'Order History Summary',
      `You have ${orders.length} orders in your history`,
    );

    return { user, orders };
  }
}

const builder = new TestsBuilder(
  EcommerceService,
  UserRepository,
  OrderRepository,
  PaymentService,
  NotificationService,
  InventoryService,
);

builder
  .addSuite('createOrder')

  .addCase('creates order successfully with all validations')
  .args('user-123', [{ productId: 'prod-1', quantity: 2, price: 50 }])
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-123',
    name: 'User 123',
    email: 'user123@example.com',
  })
  .mockReturnAsyncValue(InventoryService, 'checkStock', {
    available: true,
    productId: 'prod-1',
    requestedQuantity: 2,
  })
  .mockReturnAsyncValue(InventoryService, 'reserveStock', {
    reserved: true,
    productId: 'prod-1',
    quantity: 2,
    reservationId: 'res-123',
  })
  .mockReturnAsyncValue(OrderRepository, 'create', {
    id: 'new-order',
    userId: 'user-123',
    items: [{ productId: 'prod-1', quantity: 2, price: 50 }],
    total: 100,
    status: 'pending',
    createdAt: new Date(),
  })
  .mockReturnAsyncValue(NotificationService, 'sendEmail', {
    sent: true,
    to: 'user123@example.com',
    subject: 'Order Confirmation',
    messageId: 'msg-123',
  })
  .expectAsync({
    order: {
      id: 'new-order',
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2, price: 50 }],
      total: 100,
      status: 'pending',
      createdAt: expect.any(Date),
    },
    reservations: [
      {
        reserved: true,
        productId: 'prod-1',
        quantity: 2,
        reservationId: 'res-123',
      },
    ],
  })
  .doneCase()

  .addCase('throws error when user not found')
  .args('nonexistent-user', [{ productId: 'prod-1', quantity: 1, price: 50 }])
  .mockReturnAsyncValue(UserRepository, 'findById', null as any)
  .expectThrow(new Error('User not found'))
  .doneCase()

  .addCase('throws error when insufficient stock')
  .args('user-123', [{ productId: 'prod-1', quantity: 100, price: 50 }])
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-123',
    name: 'User 123',
    email: 'user123@example.com',
  })
  .mockReturnAsyncValue(InventoryService, 'checkStock', {
    available: false,
    productId: 'prod-1',
    requestedQuantity: 100,
  })
  .expectThrow(new Error('Insufficient stock for product prod-1'))
  .doneCase()

  .addCase('releases stock when order creation fails')
  .args('user-123', [{ productId: 'prod-1', quantity: 2, price: 50 }])
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-123',
    name: 'User 123',
    email: 'user123@example.com',
  })
  .mockReturnAsyncValue(InventoryService, 'checkStock', {
    available: true,
    productId: 'prod-1',
    requestedQuantity: 2,
  })
  .mockReturnAsyncValue(InventoryService, 'reserveStock', {
    reserved: true,
    productId: 'prod-1',
    quantity: 2,
    reservationId: 'res-123',
  })
  .mockThrow(OrderRepository, 'create', new Error('Database error'))
  .mockReturnAsyncValue(InventoryService, 'releaseStock', {
    released: true,
    reservationId: 'res-123',
  })
  .expectThrow(new Error('Database error'))
  .doneCase()

  .doneSuite()

  .addSuite('processPayment')

  .addCase('processes payment successfully')
  .args('order-1', 'card_123')
  .mockReturnAsyncValue(OrderRepository, 'findByUserId', [
    { id: 'order-1', userId: 'user-1', total: 100, status: 'pending' },
  ])
  .mockReturnAsyncValue(PaymentService, 'validatePaymentMethod', true)
  .mockReturnAsyncValue(PaymentService, 'processPayment', {
    transactionId: 'tx-123',
    amount: 100,
    status: 'completed',
  })
  .mockReturnAsyncValue(OrderRepository, 'updateStatus', {
    id: 'order-1',
    status: 'paid',
    updatedAt: new Date(),
  })
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-1',
    name: 'User 1',
    email: 'user1@example.com',
  })
  .mockReturnAsyncValue(NotificationService, 'sendEmail', {
    sent: true,
    to: 'user1@example.com',
    subject: 'Payment Confirmation',
    messageId: 'msg-123',
  })
  .expectAsync({
    order: { id: 'order-1', status: 'paid', updatedAt: expect.any(Date) },
    payment: { transactionId: 'tx-123', amount: 100, status: 'completed' },
  })
  .doneCase()

  .addCase('throws error when order not found')
  .args('nonexistent-order', 'card_123')
  .mockReturnAsyncValue(OrderRepository, 'findByUserId', [])
  .expectThrow(new Error('Order not found'))
  .doneCase()

  .addCase('throws error when payment method is invalid')
  .args('order-1', 'invalid-method')
  .mockReturnAsyncValue(OrderRepository, 'findByUserId', [
    { id: 'order-1', userId: 'user-1', total: 100, status: 'pending' },
  ])
  .mockReturnAsyncValue(PaymentService, 'validatePaymentMethod', false)
  .expectThrow(new Error('Invalid payment method'))
  .doneCase()

  .doneSuite()

  .addSuite('cancelOrder')

  .addCase('cancels pending order successfully')
  .args('order-1', 'Customer request')
  .mockReturnAsyncValue(OrderRepository, 'findByUserId', [
    { id: 'order-1', userId: 'user-1', total: 100, status: 'pending' },
  ])
  .mockReturnAsyncValue(OrderRepository, 'updateStatus', {
    id: 'order-1',
    status: 'cancelled',
    updatedAt: new Date(),
  })
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-1',
    name: 'User 1',
    email: 'user1@example.com',
  })
  .mockReturnAsyncValue(NotificationService, 'sendEmail', {
    sent: true,
    to: 'user1@example.com',
    subject: 'Order Cancelled',
    messageId: 'msg-123',
  })
  .expectAsync({
    order: { id: 'order-1', status: 'cancelled', updatedAt: expect.any(Date) },
    refund: null,
  })
  .doneCase()

  .addCase('cancels paid order with refund')
  .args('order-2', 'Customer request')
  .mockReturnAsyncValue(OrderRepository, 'findByUserId', [
    { id: 'order-2', userId: 'user-1', total: 200, status: 'paid' },
  ])
  .mockReturnAsyncValue(OrderRepository, 'updateStatus', {
    id: 'order-2',
    status: 'cancelled',
    updatedAt: new Date(),
  })
  .mockReturnAsyncValue(PaymentService, 'refundPayment', {
    transactionId: 'tx-123',
    status: 'refunded',
    refundedAt: new Date(),
  })
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-1',
    name: 'User 1',
    email: 'user1@example.com',
  })
  .mockReturnAsyncValue(NotificationService, 'sendEmail', {
    sent: true,
    to: 'user1@example.com',
    subject: 'Order Cancelled',
    messageId: 'msg-123',
  })
  .expectAsync({
    order: { id: 'order-2', status: 'cancelled', updatedAt: expect.any(Date) },
    refund: {
      transactionId: 'tx-123',
      status: 'refunded',
      refundedAt: expect.any(Date),
    },
  })
  .doneCase()

  .addCase('throws error when trying to cancel completed order')
  .args('order-3', 'Customer request')
  .mockReturnAsyncValue(OrderRepository, 'findByUserId', [
    { id: 'order-3', userId: 'user-1', total: 300, status: 'completed' },
  ])
  .expectThrow(new Error('Cannot cancel completed order'))
  .doneCase()

  .doneSuite()

  .addSuite('getUserOrderHistory')

  .addCase('retrieves user order history successfully')
  .args('user-123')
  .mockReturnAsyncValue(UserRepository, 'findById', {
    id: 'user-123',
    name: 'User 123',
    email: 'user123@example.com',
  })
  .mockReturnAsyncValue(OrderRepository, 'findByUserId', [
    { id: 'order-1', userId: 'user-123', total: 100, status: 'completed' },
    { id: 'order-2', userId: 'user-123', total: 200, status: 'pending' },
  ])
  .mockReturnAsyncValue(NotificationService, 'sendEmail', {
    sent: true,
    to: 'user123@example.com',
    subject: 'Order History Summary',
    messageId: 'msg-123',
  })
  .expectAsync({
    user: { id: 'user-123', name: 'User 123', email: 'user123@example.com' },
    orders: [
      { id: 'order-1', userId: 'user-123', total: 100, status: 'completed' },
      { id: 'order-2', userId: 'user-123', total: 200, status: 'pending' },
    ],
  })
  .doneCase()

  .addCase('throws error when user not found')
  .args('nonexistent-user')
  .mockReturnAsyncValue(UserRepository, 'findById', null as any)
  .expectThrow(new Error('User not found'))
  .doneCase()

  .doneSuite();

void builder.run();

import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Cart } from '../cart/entities/cart.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

const TAX_RATE = 0.1; // mirrors OrdersService

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  subtotal: number;
  tax: number;
  amount: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {
    const secretKey = this.config.get<string>('stripe.secretKey');
    this.webhookSecret = this.config.get<string>('stripe.webhookSecret');
    // Construct lazily-usable client; absence is surfaced as a clean 503 on use.
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  private client(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Payments are not configured');
    }
    return this.stripe;
  }

  // The charge amount is computed server-side from the user's own cart — the
  // client never dictates the price (same rule as order totals).
  async createIntent(userId: string): Promise<PaymentIntentResult> {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cart.items.reduce(
      (sum, i) => sum + Number(i.product.price) * i.quantity,
      0,
    );
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    let intent: Stripe.PaymentIntent;
    try {
      intent = await this.client().paymentIntents.create({
        amount: Math.round(total * 100), // Stripe expects the smallest currency unit
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { userId },
      });
    } catch (err) {
      // Almost always a bad/placeholder API key — surface a clear, actionable error.
      this.logger.error(`Stripe createPaymentIntent failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        'Could not initialise payment. Check the Stripe test keys.',
      );
    }

    return {
      clientSecret: intent.client_secret ?? '',
      paymentIntentId: intent.id,
      subtotal,
      tax,
      amount: total,
    };
  }

  // Authoritative payment check used before an order is created: the intent must
  // have actually succeeded, belong to this user, and match the order total.
  async assertPaid(
    paymentIntentId: string,
    userId: string,
    expectedTotal: number,
  ): Promise<Stripe.PaymentIntent> {
    let intent: Stripe.PaymentIntent;
    try {
      intent = await this.client().paymentIntents.retrieve(paymentIntentId);
    } catch {
      throw new BadRequestException('Invalid payment reference');
    }

    if (intent.metadata?.userId !== userId) {
      throw new BadRequestException('Payment does not belong to this account');
    }
    if (intent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not been completed');
    }
    if (intent.amount !== Math.round(expectedTotal * 100)) {
      throw new BadRequestException('Payment amount does not match the order total');
    }
    return intent;
  }

  // Verifies the Stripe signature over the raw body, then advances the matching
  // order to PROCESSING. Best-effort backup to the synchronous order-creation path.
  async handleWebhook(rawBody: Buffer | undefined, signature: string): Promise<{ received: true }> {
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException('Webhook is not configured');
    }
    if (!rawBody) {
      throw new BadRequestException('Missing payload');
    }

    let event: Stripe.Event;
    try {
      event = this.client().webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const order = await this.orderRepo.findOne({
        where: { stripePaymentIntentId: intent.id },
      });
      if (order && order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.PROCESSING;
        await this.orderRepo.save(order);
        this.logger.log(`Order ${order.id} → PROCESSING via webhook`);
      }
    }

    return { received: true };
  }
}

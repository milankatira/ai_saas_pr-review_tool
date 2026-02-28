import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionService } from './subscription.service';
import { PlanType, SubscriptionStatus } from './schemas/subscription.schema';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private subscriptionService: SubscriptionService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('stripe.secretKey') || '',
    );
  }

  async createCheckoutSession(
    organizationId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    const priceId = this.configService.get<string>('stripe.priceProMonthly');

    // Get or create customer
    const subscription = await this.subscriptionService.getOrCreateFreeSubscription(organizationId);

    let customerId = subscription.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        metadata: {
          organizationId,
          userId,
        },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        userId,
      },
    });

    return { url: session.url || '' };
  }

  async createPortalSession(
    organizationId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const subscription = await this.subscriptionService.getByOrganization(organizationId);

    if (!subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, rawBody: Buffer): Promise<void> {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret || '',
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed:', err);
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        this.logger.log('Invoice paid:', (event.data.object as Stripe.Invoice).id);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;

    if (!organizationId) {
      this.logger.error('No organizationId in checkout session metadata');
      return;
    }

    // Get the subscription details
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    await this.subscriptionService.linkStripeCustomer(
      organizationId,
      session.customer as string,
      stripeSubscription.id,
      PlanType.PRO,
      new Date(stripeSubscription.current_period_start * 1000),
      new Date(stripeSubscription.current_period_end * 1000),
    );

    this.logger.log(`Subscription activated for organization ${organizationId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const status = this.mapStripeStatus(subscription.status);

    await this.subscriptionService.updateFromStripe(subscription.id, {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    this.logger.log(`Subscription ${subscription.id} updated to status: ${status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.subscriptionService.updateFromStripe(subscription.id, {
      status: SubscriptionStatus.CANCELED,
      plan: PlanType.FREE,
    });

    this.logger.log(`Subscription ${subscription.id} canceled`);
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }
}

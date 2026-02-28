import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  PlanType,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import { Usage, UsageDocument } from './schemas/usage.schema';

const PLAN_LIMITS = {
  [PlanType.FREE]: { reviewsPerMonth: 5, repositoriesMax: 3 },
  [PlanType.PRO]: { reviewsPerMonth: -1, repositoriesMax: -1 }, // -1 = unlimited
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Usage.name)
    private usageModel: Model<UsageDocument>,
  ) {}

  async createFreeSubscription(
    organizationId: Types.ObjectId,
  ): Promise<SubscriptionDocument> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = new this.subscriptionModel({
      organizationId,
      plan: PlanType.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      limits: PLAN_LIMITS[PlanType.FREE],
    });

    return subscription.save();
  }

  async getByOrganization(
    organizationId: string | Types.ObjectId,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ organizationId: new Types.ObjectId(organizationId) })
      .exec();
  }

  async getOrCreateFreeSubscription(
    organizationId: string | Types.ObjectId,
  ): Promise<SubscriptionDocument> {
    const orgId = new Types.ObjectId(organizationId);
    let subscription = await this.getByOrganization(orgId);

    if (!subscription) {
      subscription = await this.createFreeSubscription(orgId);
    }

    return subscription;
  }

  async canPerformReview(organizationId: string): Promise<boolean> {
    const subscription = await this.getOrCreateFreeSubscription(organizationId);

    // Unlimited for pro
    if (subscription.limits.reviewsPerMonth === -1) {
      return true;
    }

    // Check subscription status
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    // Count usage in current period
    const usageCount = await this.usageModel.countDocuments({
      subscriptionId: subscription._id,
      periodStart: { $gte: subscription.currentPeriodStart },
      periodEnd: { $lte: subscription.currentPeriodEnd },
    });

    return usageCount < subscription.limits.reviewsPerMonth;
  }

  async recordUsage(organizationId: string, reviewId: string): Promise<UsageDocument> {
    const subscription = await this.getOrCreateFreeSubscription(organizationId);

    const usage = new this.usageModel({
      subscriptionId: subscription._id,
      organizationId: new Types.ObjectId(organizationId),
      reviewId: new Types.ObjectId(reviewId),
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    });

    return usage.save();
  }

  async getUsageCount(organizationId: string): Promise<{
    used: number;
    limit: number;
    periodEnd: Date;
  }> {
    const subscription = await this.getOrCreateFreeSubscription(organizationId);

    const usageCount = await this.usageModel.countDocuments({
      subscriptionId: subscription._id,
      periodStart: { $gte: subscription.currentPeriodStart },
      periodEnd: { $lte: subscription.currentPeriodEnd },
    });

    return {
      used: usageCount,
      limit: subscription.limits.reviewsPerMonth,
      periodEnd: subscription.currentPeriodEnd,
    };
  }

  async updateFromStripe(
    stripeSubscriptionId: string,
    updates: Partial<{
      status: SubscriptionStatus;
      plan: PlanType;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
    }>,
  ): Promise<SubscriptionDocument> {
    // Update limits based on plan
    if (updates.plan) {
      updates['limits' as keyof typeof updates] = PLAN_LIMITS[updates.plan] as unknown as undefined;
    }

    const subscription = await this.subscriptionModel
      .findOneAndUpdate({ stripeSubscriptionId }, updates, { new: true })
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async linkStripeCustomer(
    organizationId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    plan: PlanType,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.subscriptionModel
      .findOneAndUpdate(
        { organizationId: new Types.ObjectId(organizationId) },
        {
          stripeCustomerId,
          stripeSubscriptionId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart,
          currentPeriodEnd,
          limits: PLAN_LIMITS[plan],
        },
        { new: true },
      )
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async cancelSubscription(
    organizationId: string,
    immediate = false,
  ): Promise<SubscriptionDocument> {
    const updates: Partial<Subscription> = immediate
      ? { status: SubscriptionStatus.CANCELED, plan: PlanType.FREE, limits: PLAN_LIMITS[PlanType.FREE] }
      : { cancelAtPeriodEnd: true };

    const subscription = await this.subscriptionModel
      .findOneAndUpdate(
        { organizationId: new Types.ObjectId(organizationId) },
        updates,
        { new: true },
      )
      .exec();

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }
}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { SubscriptionService } from './subscription.service';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { Usage, UsageSchema } from './schemas/usage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Usage.name, schema: UsageSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService, SubscriptionService],
  exports: [BillingService, SubscriptionService],
})
export class BillingModule {}

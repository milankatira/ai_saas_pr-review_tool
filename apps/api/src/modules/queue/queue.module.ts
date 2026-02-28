import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { ReviewProcessor } from './processors/review.processor';
import { ReviewsModule } from '../reviews/reviews.module';
import { GithubModule } from '../github/github.module';
import { AiReviewModule } from '../ai-review/ai-review.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reviews',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    ReviewsModule,
    forwardRef(() => GithubModule),
    AiReviewModule,
    forwardRef(() => BillingModule),
  ],
  providers: [QueueService, ReviewProcessor],
  exports: [QueueService],
})
export class QueueModule {}

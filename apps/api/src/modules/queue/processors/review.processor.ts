import { Process, Processor, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Types } from 'mongoose';
import { ReviewJobData } from '../queue.service';
import { ReviewsService } from '../../reviews/reviews.service';
import { GithubAppService } from '../../github/github-app.service';
import { AiReviewService } from '../../ai-review/ai-review.service';
import { CommentPosterService } from '../../ai-review/comment-poster.service';
import { SubscriptionService } from '../../billing/subscription.service';
import { ReviewStatus } from '../../reviews/schemas/review.schema';

@Processor('reviews')
export class ReviewProcessor {
  private readonly logger = new Logger(ReviewProcessor.name);

  constructor(
    private reviewsService: ReviewsService,
    private githubAppService: GithubAppService,
    private aiReviewService: AiReviewService,
    private commentPosterService: CommentPosterService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Process('process-review')
  async processReview(job: Job<ReviewJobData>) {
    console.log('ReviewProcessor: Received job', job.data);
    const { reviewId, installationId, repositoryId, owner, repo, prNumber, prTitle, prAuthor, prUrl, commitSha, userId } =
      job.data;

    this.logger.log(`Processing review for ${owner}/${repo}#${prNumber}`);

    // Get existing review by ID
    const review = await this.reviewsService.findById(new Types.ObjectId(reviewId));

    if (!review) {
      throw new Error('Review not found');
    }

    // Check subscription limits using review's organizationId
    if (review.organizationId) {
      const canReview = await this.subscriptionService.canPerformReview(
        review.organizationId.toString(),
      );

      if (!canReview) {
        await this.githubAppService.postComment(
          installationId,
          owner,
          repo,
          prNumber,
          '⚠️ **AI Code Review limit reached**\n\nYour organization has reached the monthly review limit. Please upgrade your plan to continue receiving AI code reviews.',
        );
        throw new Error('Review limit reached');
      }
    }

    try {
      // Update status to processing
      await this.reviewsService.updateStatus(review._id, ReviewStatus.PROCESSING);
      job.progress(10);

      // Fetch PR diff
      this.logger.log('Fetching PR diff...');
      const diff = await this.githubAppService.fetchPRDiff(
        installationId,
        owner,
        repo,
        prNumber,
      );
      job.progress(30);

      // Run AI review
      this.logger.log('Running AI review...');
      const reviewResult = await this.aiReviewService.reviewCode(
        prTitle,
        '', // Could fetch PR body if needed
        diff.files,
      );
      job.progress(70);

      // Save comments to database
      await this.reviewsService.saveComments(review._id, reviewResult.issues);
      job.progress(80);

      // Post comments to GitHub
      this.logger.log('Posting comments to GitHub...');
      const postResult = await this.commentPosterService.postReviewComments(
        installationId,
        owner,
        repo,
        prNumber,
        reviewResult.issues,
        reviewResult.summary,
        {
          costUsd: reviewResult.metrics.costUsd,
          processingTimeMs: reviewResult.metrics.processingTimeMs,
        },
      );

      if (!postResult.success) {
        this.logger.warn(`GitHub comment posting failed: ${postResult.error}`);
        // Continue processing - the review is still successful and stored in DB
      }
      job.progress(90);

      // Record completion
      await this.reviewsService.recordCompletion(
        review._id,
        reviewResult.summary,
        {
          filesReviewed: diff.files.length,
          linesAnalyzed: diff.totalAdditions + diff.totalDeletions,
          processingTimeMs: reviewResult.metrics.processingTimeMs,
          inputTokens: reviewResult.metrics.inputTokens,
          outputTokens: reviewResult.metrics.outputTokens,
          costUsd: reviewResult.metrics.costUsd,
        },
      );

      // Track usage
      if (review.organizationId) {
        await this.subscriptionService.recordUsage(
          review.organizationId.toString(),
          review._id.toString(),
        );
      }

      job.progress(100);
      this.logger.log(`Review completed for ${owner}/${repo}#${prNumber}`);

      return { reviewId: review._id.toString(), issuesFound: reviewResult.issues.length };
    } catch (error) {
      this.logger.error(`Review failed for ${owner}/${repo}#${prNumber}:`, error);
      await this.reviewsService.updateStatus(
        review._id,
        ReviewStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: unknown) {
    this.logger.log(`Job ${job.id} completed with result:`, result);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error.message);
  }
}

import { Process, Processor, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Types } from 'mongoose';
import { ReviewJobData } from '../queue.service';
import { ReviewsService } from '../../reviews/reviews.service';
import { GithubAppService } from '../../github/github-app.service';
import { GithubInstallationService } from '../../github/github-installation.service';
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
    private githubInstallationService: GithubInstallationService,
    private aiReviewService: AiReviewService,
    private commentPosterService: CommentPosterService,
    private subscriptionService: SubscriptionService,
  ) {}

  @Process('process-review')
  async processReview(job: Job<ReviewJobData>) {
    const { installationId, repositoryId, owner, repo, prNumber, prTitle, prAuthor, prUrl, commitSha } =
      job.data;

    this.logger.log(`Processing review for ${owner}/${repo}#${prNumber}`);

    // Get repository and installation
    const repoDoc = await this.githubInstallationService.getRepositoryById(
      new Types.ObjectId(repositoryId),
    );

    if (!repoDoc) {
      throw new Error('Repository not found');
    }

    const installationDoc = await this.githubInstallationService.getInstallationById(
      repoDoc.installationId,
    );

    if (!installationDoc) {
      throw new Error('Installation not found');
    }

    // Check subscription limits
    if (installationDoc.organizationId) {
      const canReview = await this.subscriptionService.canPerformReview(
        installationDoc.organizationId.toString(),
      );

      if (!canReview) {
        // Post comment about limit reached
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

    // Create review record
    const review = await this.reviewsService.create({
      repositoryId: repoDoc._id,
      installationId: installationDoc._id,
      organizationId: installationDoc.organizationId,
      prNumber,
      prTitle,
      prAuthor,
      prUrl,
      commitSha,
    });

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
      await this.commentPosterService.postReviewComments(
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
      if (installationDoc.organizationId) {
        await this.subscriptionService.recordUsage(
          installationDoc.organizationId.toString(),
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

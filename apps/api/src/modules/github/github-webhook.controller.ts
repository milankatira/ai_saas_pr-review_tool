import { Controller, Post, Body, Headers, UseGuards, Get, Param, Patch, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { GithubWebhookGuard } from '../../common/guards/github-webhook.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { GithubInstallationService } from './github-installation.service';
import { QueueService } from '../queue/queue.service';
import { ReviewsService } from '../reviews/reviews.service';

@Controller('webhooks/github')
export class GithubWebhookController {
  constructor(
    private installationService: GithubInstallationService,
    private queueService: QueueService,
    private reviewsService: ReviewsService,
  ) {}

  @Post()
  @UseGuards(GithubWebhookGuard)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Body() payload: any,
  ) {
    switch (event) {
      case 'installation':
        return this.handleInstallationEvent(payload);
      case 'installation_repositories':
        return this.handleInstallationRepositoriesEvent(payload);
      case 'pull_request':
        return this.handlePullRequestEvent(payload);
      default:
        return { received: true, event };
    }
  }

  private async handleInstallationEvent(payload: any) {
    const { action, installation, sender } = payload;

    switch (action) {
      case 'created':
        await this.installationService.handleInstallationCreated(payload);
        // Try to link installation to user's organization
        await this.installationService.linkInstallationToUserOrg(
          installation.id,
          sender.login,
        );
        break;
      case 'deleted':
        await this.installationService.handleInstallationDeleted(payload);
        break;
      case 'suspend':
      case 'unsuspend':
        // Handle suspension status
        break;
    }

    return { received: true, action };
  }

  private async handleInstallationRepositoriesEvent(payload: any) {
    const { action } = payload;

    if (action === 'added') {
      await this.installationService.handleRepositoriesAdded(payload);
    } else if (action === 'removed') {
      await this.installationService.handleRepositoriesRemoved(payload);
    }

    return { received: true, action };
  }

  private async handlePullRequestEvent(payload: any) {
    console.log('handlePullRequestEvent called with payload:', payload);
    const { action, pull_request, repository, installation } = payload;

    // Only process opened, reopened, or synchronized (new commits pushed)
    if (!['opened', 'reopened', 'synchronize'].includes(action)) {
      console.log('Skipping action:', action);
      return { received: true, action, skipped: true };
    }

    // Get installation record
    const installationDoc = await this.installationService.getInstallationByGithubId(
      installation.id,
    );

    if (!installationDoc) {
      return { received: true, error: 'Installation not found' };
    }

    // Get repository record
    const repoDoc = await this.installationService.getRepositoryByGithubId(
      repository.id,
    );

    if (!repoDoc || !repoDoc.isActive) {
      return { received: true, skipped: true, reason: 'Repository not active' };
    }

    console.log('Adding job to queue with data:', {
      installationId: installationDoc.installationId,
      repositoryId: repoDoc._id.toString(),
      owner: repository.owner.login,
      repo: repository.name,
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      prAuthor: pull_request.user.login,
      prUrl: pull_request.html_url,
      commitSha: pull_request.head.sha,
    });

    // Queue the review job
    const jobId = await this.queueService.addReviewJob({
      installationId: installationDoc.installationId,
      repositoryId: repoDoc._id.toString(),
      owner: repository.owner.login,
      repo: repository.name,
      prNumber: pull_request.number,
      prTitle: pull_request.title,
      prAuthor: pull_request.user.login,
      prUrl: pull_request.html_url,
      commitSha: pull_request.head.sha,
    });

    console.log('Job added with ID:', jobId);

    return { received: true, action, queued: true };
  }
}

@Controller('github')
export class GithubController {
  constructor(
    private installationService: GithubInstallationService,
    private queueService: QueueService,
    private reviewsService: ReviewsService,
  ) {}

  @Get('installations')
  async getInstallations() {
    return this.installationService.getAllInstallations();
  }

  @Get('installations/:id/repositories')
  async getRepositories(@Param('id') id: string) {
    return this.installationService.getRepositoriesByInstallation(
      new Types.ObjectId(id),
    );
  }

  @Get('organizations/:id/repositories')
  async getRepositoriesByOrganization(@Param('id') id: string) {
    return this.installationService.getRepositoriesByOrganization(
      new Types.ObjectId(id),
    );
  }

  @Get('my-repositories')
  async getMyRepositories() {
    return this.installationService.getAllRepositories();
  }

  @Get('repositories/:id/pulls')
  async getRepositoryPulls(@Param('id') id: string) {
    return this.installationService.getRepositoryPullRequests(
      new Types.ObjectId(id),
    );
  }

  @Post('sync-repositories')
  async syncRepositories() {
    return this.installationService.syncAllRepositories();
  }

  @Post('reviews/trigger')
  @UseGuards(JwtAuthGuard)
  async triggerReview(
    @CurrentUser() user: UserDocument,
    @Body() body: { repositoryId: string; prNumber: number },
  ) {
    console.log('=== triggerReview endpoint hit ===');
    console.log('triggerReview called with:', body);
    const { repositoryId, prNumber } = body;

    console.log('Looking up repository with ID:', repositoryId);

    // Get repository details
    const repo = await this.installationService.getRepositoryById(
      new Types.ObjectId(repositoryId),
    );

    console.log('Repository lookup result:', repo);

    if (!repo) {
      throw new BadRequestException('Repository not found');
    }

    console.log('Looking up installation with ID:', repo.installationId);

    // Get installation details
    const installation = await this.installationService.getInstallationById(
      repo.installationId,
    );

    console.log('Installation lookup result:', installation);

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    // Extract owner and repo name from fullName
    const [owner, repoName] = repo.fullName.split('/');
    if (!owner || !repoName) {
      throw new BadRequestException('Invalid repository name format');
    }

    try {
      console.log('Fetching PR details for:', {
        installationId: installation.installationId,
        owner,
        repoName,
        prNumber,
      });

      // Get PR details from GitHub
      const prDetails = await this.installationService.fetchPRDetails(
        installation.installationId,
        owner,
        repoName,
        prNumber,
      );

      console.log('PR details fetched:', prDetails);

      console.log('Creating review in database with data:', {
        repositoryId: repo._id,
        installationId: installation._id,
        prNumber: prNumber,
        prTitle: prDetails.title,
        prAuthor: prDetails.author,
        prUrl: prDetails.url,
        commitSha: prDetails.headSha,
        userId: user._id,
      });

      // Create review in database
      const review = await this.reviewsService.create({
        userId: user._id,
        repositoryId: repo._id,
        installationId: installation._id,
        organizationId: installation.organizationId,
        prNumber: prNumber,
        prTitle: prDetails.title,
        prAuthor: prDetails.author,
        prUrl: prDetails.url,
        commitSha: prDetails.headSha,
      });

      console.log('Review created with ID:', review._id);

      // Queue the review for processing
      const jobId = await this.queueService.addReviewJob({
        installationId: installation.installationId,
        repositoryId: repo._id.toString(),
        owner: owner,
        repo: repoName,
        prNumber: prNumber,
        prTitle: prDetails.title,
        prAuthor: prDetails.author,
        prUrl: prDetails.url,
        commitSha: prDetails.headSha,
        userId: user._id.toString(),
      });

      console.log('Review queued with job ID:', jobId);

      return { data: { reviewId: review._id.toString(), jobId: jobId } };
    } catch (error) {
      console.error('Error triggering review:', error);
      throw new BadRequestException('Failed to trigger review');
    }
  }

  @Patch('repositories/:id/settings')
  async updateRepositorySettings(
    @Param('id') id: string,
    @Body() settings: any,
  ) {
    return this.installationService.updateRepositorySettings(
      new Types.ObjectId(id),
      settings,
    );
  }

  @Patch('repositories/:id/toggle')
  async toggleRepository(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.installationService.toggleRepositoryActive(
      new Types.ObjectId(id),
      isActive,
    );
  }
}

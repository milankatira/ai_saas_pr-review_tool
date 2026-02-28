import { Controller, Post, Body, Headers, UseGuards, Get, Param, Patch } from '@nestjs/common';
import { Types } from 'mongoose';
import { GithubWebhookGuard } from '../../common/guards/github-webhook.guard';
import { GithubInstallationService } from './github-installation.service';
import { QueueService } from '../queue/queue.service';

@Controller('webhooks/github')
export class GithubWebhookController {
  constructor(
    private installationService: GithubInstallationService,
    private queueService: QueueService,
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
    const { action } = payload;

    switch (action) {
      case 'created':
        await this.installationService.handleInstallationCreated(payload);
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
    const { action, pull_request, repository, installation } = payload;

    // Only process opened, reopened, or synchronized (new commits pushed)
    if (!['opened', 'reopened', 'synchronize'].includes(action)) {
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

    // Queue the review job
    await this.queueService.addReviewJob({
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

    return { received: true, action, queued: true };
  }
}

@Controller('github')
export class GithubController {
  constructor(private installationService: GithubInstallationService) {}

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
